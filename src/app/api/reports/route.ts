import { requireAuth } from "@/lib/auth";
import { getAllTransactions, getAllEquipment, getAllSites, getAllExpenses } from "@/lib/db";
import { NextResponse } from "next/server";

const VAT = 0.18;

export async function GET(req: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const [transactions, equipment, sites, generalExpenses] = await Promise.all([
      getAllTransactions(), getAllEquipment(), getAllSites(), getAllExpenses(),
    ]);

    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to + "T23:59:59") : null;

    function inRange(dateStr: string) {
      const d = new Date(dateStr);
      if (fromDate && d < fromDate) return false;
      if (toDate && d > toDate) return false;
      return true;
    }

    const filteredTx = transactions.filter(t => inRange(t.date));
    const filteredExpenses = generalExpenses.filter(e => inRange(e.date));

    // --- Equipment costs ---
    const allEquipExpenses = equipment.flatMap(eq =>
      (eq.expenses || []).filter(e => inRange(e.date)).map(e => ({ ...e, equipmentName: eq.name, equipmentType: eq.type }))
    );
    const allMaintenance = equipment.flatMap(eq =>
      (eq.maintenance || []).filter(m => m.cost && inRange(m.date)).map(m => ({ ...m, equipmentName: eq.name, equipmentType: eq.type, category: "טיפול" }))
    );
    const allInsurance = equipment.flatMap(eq =>
      (eq.insurances || []).filter(i => inRange(i.startDate)).map(i => ({
        id: i.id, date: i.startDate, amount: i.cost || 0, category: "ביטוח", description: i.type,
        equipmentName: eq.name, equipmentType: eq.type,
      }))
    );

    // --- Per-site breakdown ---
    const bySite = sites
      .map(site => {
        const siteTx = filteredTx.filter(t => t.workSiteId === site.id);
        const txIncomeNet = siteTx.filter(t => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
        const contractNet = site.contractValue || 0;
        const incomeNet = contractNet + txIncomeNet;
        const incomeGross = incomeNet * (1 + VAT);
        const expense = siteTx.filter(t => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
        return {
          siteId: site.id,
          siteName: site.name,
          status: site.status,
          contractNet,
          txIncomeNet,
          incomeNet,
          vatAmount: incomeNet * VAT,
          incomeGross,
          expense,
          profit: incomeGross - expense,
        };
      })
      .filter(s => s.incomeNet > 0 || s.expense > 0)
      .sort((a, b) => b.profit - a.profit);

    // --- Per-month breakdown ---
    type MonthBucket = { incomeNet: number; expense: number; generalExpense: number };
    const monthMap: Record<string, MonthBucket> = {};

    function addMonth(date: string, field: keyof MonthBucket, amount: number) {
      const key = date.slice(0, 7);
      if (!monthMap[key]) monthMap[key] = { incomeNet: 0, expense: 0, generalExpense: 0 };
      monthMap[key][field] += amount;
    }

    for (const t of filteredTx) {
      if (t.type === "INCOME") addMonth(t.date, "incomeNet", t.amount);
      else addMonth(t.date, "expense", t.amount);
    }
    for (const e of filteredExpenses) {
      addMonth(e.date, "generalExpense", e.amount);
    }

    const byMonth = Object.entries(monthMap)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([month, v]) => {
        const incomeGross = v.incomeNet * (1 + VAT);
        const totalExpense = v.expense + v.generalExpense;
        return {
          month,
          label: new Date(month + "-01").toLocaleDateString("he-IL", { month: "long", year: "numeric" }),
          incomeNet: v.incomeNet,
          vatAmount: v.incomeNet * VAT,
          incomeGross,
          siteExpense: v.expense,
          generalExpense: v.generalExpense,
          totalExpense,
          profit: incomeGross - totalExpense,
        };
      });

    // --- Global summary ---
    const txIncomeNet = filteredTx.filter(t => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
    const contractsNet = sites.reduce((s, site) => s + (site.contractValue || 0), 0);
    const totalIncomeNet = contractsNet + txIncomeNet;
    const totalVat = totalIncomeNet * VAT;
    const totalIncomeGross = totalIncomeNet * (1 + VAT);

    const siteExpenseTotal = filteredTx.filter(t => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
    const generalExpenseTotal = filteredExpenses.reduce((s, e) => s + e.amount, 0);
    const equipmentExpenseTotal = allEquipExpenses.reduce((s, e) => s + e.amount, 0);
    const maintenanceTotal = allMaintenance.reduce((s, m) => s + (m.cost || 0), 0);
    const insuranceTotal = allInsurance.reduce((s, i) => s + i.amount, 0);
    const totalExpense = siteExpenseTotal + generalExpenseTotal + equipmentExpenseTotal + maintenanceTotal + insuranceTotal;
    const operationalProfit = totalIncomeGross - totalExpense;

    // --- Category breakdowns ---
    const siteCategoryBreakdown: Record<string, number> = {};
    for (const t of filteredTx.filter(t => t.type === "EXPENSE")) {
      const cat = t.category || "אחר";
      siteCategoryBreakdown[cat] = (siteCategoryBreakdown[cat] || 0) + t.amount;
    }
    const equipCategoryBreakdown: Record<string, number> = {};
    for (const e of allEquipExpenses) {
      equipCategoryBreakdown[e.category] = (equipCategoryBreakdown[e.category] || 0) + e.amount;
    }
    equipCategoryBreakdown["טיפול"] = (equipCategoryBreakdown["טיפול"] || 0) + maintenanceTotal;
    equipCategoryBreakdown["ביטוח"] = (equipCategoryBreakdown["ביטוח"] || 0) + insuranceTotal;

    // --- Daily timeline ---
    const dailyMap: Record<string, { income: number; expense: number; equip: number }> = {};
    function addDay(date: string, type: "income" | "expense" | "equip", amount: number) {
      const key = date.slice(0, 10);
      if (!dailyMap[key]) dailyMap[key] = { income: 0, expense: 0, equip: 0 };
      dailyMap[key][type] += amount;
    }
    for (const t of filteredTx) {
      if (t.type === "INCOME") addDay(t.date, "income", t.amount * (1 + VAT));
      else addDay(t.date, "expense", t.amount);
    }
    for (const e of allEquipExpenses) addDay(e.date, "equip", e.amount);
    for (const m of allMaintenance) if (m.cost) addDay(m.date, "equip", m.cost);
    for (const i of allInsurance) addDay(i.date, "equip", i.amount);

    const daily = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({ date, ...vals }));

    return NextResponse.json({
      summary: {
        totalIncomeNet,
        totalVat,
        totalIncomeGross,
        contractsNet,
        txIncomeNet,
        siteExpense: siteExpenseTotal,
        generalExpense: generalExpenseTotal,
        equipmentExpenseTotal,
        maintenanceTotal,
        insuranceTotal,
        totalExpense,
        operationalProfit,
        // legacy fields
        siteIncome: totalIncomeGross,
        siteExpenseTotal,
        netBalance: operationalProfit,
      },
      bySite,
      byMonth,
      siteCategoryBreakdown,
      equipCategoryBreakdown,
      daily,
      transactions: filteredTx,
      equipmentExpenses: allEquipExpenses,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
