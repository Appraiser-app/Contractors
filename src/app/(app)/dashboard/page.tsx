import { requireAuth, getProfile } from "@/lib/auth";
import { getAllSites, getAllTransactions, getAllEquipment, getAllExpenses } from "@/lib/db";
import Link from "next/link";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "short" }).format(new Date(date));
}

function isExpired(dateStr: string) {
  return new Date(dateStr).getTime() < Date.now();
}

function isExpiringSoon(dateStr: string, days = 30) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return diff > 0 && diff < days * 86400000;
}

export default async function DashboardPage() {
  await requireAuth();
  const profile = await getProfile();

  const [sites, allTransactions, equipment, expenses] = await Promise.all([
    getAllSites(),
    getAllTransactions(),
    getAllEquipment(),
    getAllExpenses(),
  ]);

  const VAT = 0.18;
  const expectedIncomeNet = sites.reduce((s, site) => s + (site.contractValue || 0), 0);
  const actualIncomeNet = allTransactions.filter(t => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const totalIncomeNet = actualIncomeNet;
  const totalVat = totalIncomeNet * VAT;
  const totalIncome = totalIncomeNet * (1 + VAT);
  const expectedIncome = expectedIncomeNet * (1 + VAT);
  const txExpense = allTransactions.filter(t => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
  const generalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalExpense = txExpense + generalExpenses;
  const totalBalance = totalIncome - totalExpense;
  const activeSites = sites.filter(s => s.status === "ACTIVE").length;
  // Merge transactions + general expenses into one recent list
  const allActivity = [
    ...allTransactions.map(t => ({ id: t.id, type: t.type as "INCOME" | "EXPENSE", amount: t.amount, description: t.description, date: t.date, siteName: t.workSite?.name || null, source: "transaction" as const })),
    ...expenses.map(e => ({ id: e.id, type: "EXPENSE" as const, amount: e.amount, description: e.description, date: e.date, siteName: e.entity || null, source: "expense" as const })),
  ];
  const recentTransactions = [...allActivity]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const expiringInsurances = equipment.flatMap(eq =>
    (eq.insurances || [])
      .filter(i => isExpired(i.endDate) || isExpiringSoon(i.endDate))
      .map(i => ({ ...i, equipmentName: eq.name }))
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <p className="text-green-600 text-sm font-medium mb-1">
          ברוך הבא{profile?.name ? `, ${profile.name}` : ""} 👋
        </p>
        <h1 className="text-3xl font-bold text-gray-900">לוח בקרה</h1>
      </div>

      {/* Alert bar */}
      {expiringInsurances.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.924-.833-2.694 0L3.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">{expiringInsurances.length} ביטוחים דורשים תשומת לב</p>
            <p className="text-xs text-red-500 mt-0.5">{expiringInsurances.map(i => i.equipmentName).join(", ")}</p>
          </div>
          <Link href="/equipment" className="text-xs text-red-600 font-semibold hover:text-red-800 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors">
            לציוד
          </Link>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className={`col-span-2 lg:col-span-1 rounded-2xl p-5 text-white shadow-lg ${totalBalance >= 0 ? "bg-gradient-to-br from-green-600 to-green-700 shadow-green-200" : "bg-gradient-to-br from-red-500 to-red-600 shadow-red-200"}`}>
          <p className="text-white/70 text-xs font-medium mb-2">רווח תפעולי</p>
          <p className="text-2xl font-bold leading-none">{formatCurrency(totalBalance)}</p>
          <div className="mt-3 pt-3 border-t border-white/20 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-white/60">הכנסות כולל מע״מ</span>
              <span className="text-white/90 font-medium">{formatCurrency(totalIncome)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/60">הוצאות</span>
              <span className="text-white/90 font-medium">−{formatCurrency(totalExpense)}</span>
            </div>
            {expectedIncome > 0 && (
              <div className="flex justify-between text-xs pt-1 border-t border-white/10">
                <span className="text-white/50">צפי מחוזים</span>
                <span className="text-white/70 font-medium">{formatCurrency(expectedIncome)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
            </div>
            <p className="text-xs text-gray-400 font-medium">הכנסות כולל מע״מ</p>
          </div>
          <p className="text-xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
          <p className="text-xs text-gray-400 mt-1">מע״מ 18%: {formatCurrency(totalVat)}</p>
          {expectedIncome > 0 && (
            <p className="text-xs text-blue-400 mt-1">צפי מחוזים: {formatCurrency(expectedIncome)}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
            </div>
            <p className="text-xs text-gray-400 font-medium">הוצאות</p>
          </div>
          <p className="text-xl font-bold text-red-500">{formatCurrency(totalExpense)}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-xs text-gray-400 font-medium">אתרים פעילים</p>
          </div>
          <p className="text-xl font-bold text-green-600">{activeSites}</p>
          <p className="text-xs text-gray-400 mt-0.5">מתוך {sites.length} סה"כ</p>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active sites */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h2 className="font-bold text-gray-900">אתרים פעילים</h2>
            <Link href="/sites" className="text-green-600 text-xs font-semibold hover:text-green-600 flex items-center gap-1">
              כל האתרים
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
          </div>
          <div className="p-3">
            {sites.filter(s => s.status === "ACTIVE").length === 0 ? (
              <div className="text-center py-10">
                <p className="text-4xl mb-3">🏗️</p>
                <p className="text-gray-400 text-sm">אין אתרים פעילים</p>
                <Link href="/sites/new" className="mt-3 inline-block text-green-600 text-xs font-medium hover:underline">הוסף אתר חדש ←</Link>
              </div>
            ) : (
              <div className="space-y-1">
                {sites.filter(s => s.status === "ACTIVE").slice(0, 5).map(site => {
                  const income = (site.contractValue || 0) + (site.transactions || []).filter(t => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
                  const expense = (site.transactions || []).filter(t => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
                  const balance = income - expense;
                  return (
                    <Link key={site.id} href={`/sites/${site.id}`}
                      className="flex items-center justify-between p-3.5 rounded-xl hover:bg-green-50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-green-100 group-hover:bg-green-200 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{site.name}</p>
                          {site.location && <p className="text-gray-400 text-xs">{site.location}</p>}
                        </div>
                      </div>
                      <p className={`text-sm font-bold ${balance >= 0 ? "text-green-600" : "text-red-500"}`}>
                        {formatCurrency(balance)}
                      </p>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent transactions */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h2 className="font-bold text-gray-900">תנועות אחרונות</h2>
            <Link href="/transactions" className="text-green-600 text-xs font-semibold hover:text-green-600 flex items-center gap-1">
              כל התנועות
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-4xl mb-3">💸</p>
                <p className="text-gray-400 text-sm">אין תנועות עדיין</p>
              </div>
            ) : (
              recentTransactions.map(t => (
                <div key={t.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${t.type === "INCOME" ? "bg-green-100" : "bg-red-100"}`}>
                      <svg className={`w-3.5 h-3.5 ${t.type === "INCOME" ? "text-green-600" : "text-red-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={t.type === "INCOME" ? "M7 11l5-5m0 0l5 5m-5-5v12" : "M17 13l-5 5m0 0l-5-5m5 5V6"} />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{t.description}</p>
                      <p className="text-xs text-gray-400">
                        {t.siteName ? `${t.siteName} · ` : ""}{formatDate(t.date)}
                        {t.source === "expense" && <span className="mr-1 text-slate-400">• הוצאה כללית</span>}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${t.type === "INCOME" ? "text-green-600" : "text-red-500"}`}>
                    {t.type === "INCOME" ? "+" : "-"}{formatCurrency(t.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
