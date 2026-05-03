import { requireAuth } from "@/lib/auth";
import { getAllTransactions, getAllEquipment } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const [transactions, equipment] = await Promise.all([getAllTransactions(), getAllEquipment()]);

    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to + "T23:59:59") : null;

    function inRange(dateStr: string) {
      const d = new Date(dateStr);
      if (fromDate && d < fromDate) return false;
      if (toDate && d > toDate) return false;
      return true;
    }

    const filteredTx = transactions.filter(t => inRange(t.date));

    // Collect all equipment expenses and maintenance
    const allExpenses = equipment.flatMap(eq =>
      (eq.expenses || []).filter(e => inRange(e.date)).map(e => ({
        ...e,
        equipmentName: eq.name,
        equipmentType: eq.type,
      }))
    );
    const allMaintenance = equipment.flatMap(eq =>
      (eq.maintenance || []).filter(m => m.cost && inRange(m.date)).map(m => ({
        ...m,
        equipmentName: eq.name,
        equipmentType: eq.type,
        category: "טיפול",
      }))
    );
    const allInsurance = equipment.flatMap(eq =>
      (eq.insurances || []).filter(i => inRange(i.startDate)).map(i => ({
        id: i.id,
        date: i.startDate,
        amount: i.cost,
        category: "ביטוח",
        description: i.type,
        equipmentName: eq.name,
        equipmentType: eq.type,
      }))
    );

    // Site income/expense totals
    const siteIncome = filteredTx.filter(t => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
    const siteExpense = filteredTx.filter(t => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);

    // Equipment totals
    const equipmentExpenseTotal = allExpenses.reduce((s, e) => s + e.amount, 0);
    const maintenanceTotal = allMaintenance.reduce((s, m) => s + (m.cost || 0), 0);
    const insuranceTotal = allInsurance.reduce((s, i) => s + i.amount, 0);

    // Category breakdown (site expenses)
    const siteCategoryBreakdown: Record<string, number> = {};
    for (const t of filteredTx.filter(t => t.type === "EXPENSE")) {
      const cat = t.category || "אחר";
      siteCategoryBreakdown[cat] = (siteCategoryBreakdown[cat] || 0) + t.amount;
    }

    // Equipment category breakdown
    const equipCategoryBreakdown: Record<string, number> = {};
    for (const e of allExpenses) {
      equipCategoryBreakdown[e.category] = (equipCategoryBreakdown[e.category] || 0) + e.amount;
    }
    equipCategoryBreakdown["טיפול"] = (equipCategoryBreakdown["טיפול"] || 0) + maintenanceTotal;
    equipCategoryBreakdown["ביטוח"] = (equipCategoryBreakdown["ביטוח"] || 0) + insuranceTotal;

    // Daily breakdown
    const dailyMap: Record<string, { income: number; expense: number; equip: number }> = {};
    function addDay(date: string, type: "income" | "expense" | "equip", amount: number) {
      const key = date.slice(0, 10);
      if (!dailyMap[key]) dailyMap[key] = { income: 0, expense: 0, equip: 0 };
      dailyMap[key][type] += amount;
    }
    for (const t of filteredTx) {
      if (t.type === "INCOME") addDay(t.date, "income", t.amount);
      else addDay(t.date, "expense", t.amount);
    }
    for (const e of allExpenses) addDay(e.date, "equip", e.amount);
    for (const m of allMaintenance) if (m.cost) addDay(m.date, "equip", m.cost);
    for (const i of allInsurance) addDay(i.date, "equip", i.amount);

    const daily = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({ date, ...vals }));

    return NextResponse.json({
      summary: {
        siteIncome,
        siteExpense,
        equipmentExpenseTotal,
        maintenanceTotal,
        insuranceTotal,
        totalExpense: siteExpense + equipmentExpenseTotal + maintenanceTotal + insuranceTotal,
        netBalance: siteIncome - siteExpense - equipmentExpenseTotal - maintenanceTotal - insuranceTotal,
      },
      siteCategoryBreakdown,
      equipCategoryBreakdown,
      daily,
      transactions: filteredTx,
      equipmentExpenses: allExpenses,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
