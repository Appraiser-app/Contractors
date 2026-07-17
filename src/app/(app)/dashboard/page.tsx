import { getProfile, requireAuth } from "@/lib/auth";
import { getAllEquipment, getAllExpenses, getAllSites, getAllTransactions } from "@/lib/db";
import Link from "next/link";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "short" }).format(new Date(date));
}

function isExpired(dateStr: string) { return new Date(dateStr).getTime() < Date.now(); }
function isExpiringSoon(dateStr: string, days = 30) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return diff > 0 && diff < days * 86400000;
}

function StatCard({ label, value, sub, color, icon }: {
  label: string; value: string; sub?: string; color: "green" | "red" | "blue" | "amber"; icon: React.ReactNode;
}) {
  const colors = {
    green: { bg: "bg-green-50", icon: "bg-green-100 text-green-600", text: "text-green-700" },
    red: { bg: "bg-red-50", icon: "bg-red-100 text-red-500", text: "text-red-600" },
    blue: { bg: "bg-blue-50", icon: "bg-blue-100 text-blue-600", text: "text-blue-700" },
    amber: { bg: "bg-amber-50", icon: "bg-amber-100 text-amber-600", text: "text-amber-700" },
  };
  const c = colors[color];
  return (
    <div className={`${c.bg} rounded-2xl p-5 hover:shadow-md transition-all duration-200 card-hover`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500">{label}</p>
        <div className={`w-8 h-8 ${c.icon} rounded-xl flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
      </div>
      <p className={`text-xl font-bold ${c.text} leading-none`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1.5">{sub}</p>}
    </div>
  );
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
  const actualIncomeNet = allTransactions.filter(t => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const totalIncomeNet = actualIncomeNet;
  const totalVat = totalIncomeNet * VAT;
  const totalIncome = totalIncomeNet * (1 + VAT);
  const expectedIncomeNet = sites.reduce((s, site) => s + (site.contractValue || 0), 0);
  const expectedIncome = expectedIncomeNet * (1 + VAT);
  const txExpense = allTransactions.filter(t => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
  const generalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalExpense = txExpense + generalExpenses;
  const totalBalance = totalIncome - totalExpense;
  const activeSites = sites.filter(s => s.status === "ACTIVE").length;

  const allActivity = [
    ...allTransactions.map(t => ({ id: t.id, type: t.type as "INCOME" | "EXPENSE", amount: t.amount, description: t.description, date: t.date, siteName: t.workSite?.name || null, source: "transaction" as const })),
    ...expenses.map(e => ({ id: e.id, type: "EXPENSE" as const, amount: e.amount, description: e.description, date: e.date, siteName: e.entity || null, source: "expense" as const })),
  ];
  const recentTransactions = [...allActivity].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

  const expiringInsurances = equipment.flatMap(eq =>
    (eq.insurances || [])
      .filter(i => isExpired(i.endDate) || isExpiringSoon(i.endDate))
      .map(i => ({ ...i, equipmentName: eq.name }))
  );

  const activeSitesList = sites.filter(s => s.status === "ACTIVE");

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-7">
        <p className="text-green-600 text-sm font-semibold mb-1 flex items-center gap-1.5">
          <span>👋</span>
          ברוך הבא{profile?.name ? `, ${profile.name}` : ""}
        </p>
        <h1 className="text-2xl font-bold text-gray-900">לוח בקרה</h1>
        <p className="text-gray-400 text-sm mt-0.5">{new Intl.DateTimeFormat("he-IL", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date())}</p>
      </div>

      {/* Alert bar */}
      {expiringInsurances.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-4.5 h-4.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.924-.833-2.694 0L3.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-red-800">{expiringInsurances.length} ביטוחים דורשים תשומת לב</p>
            <p className="text-xs text-red-400 mt-0.5">{expiringInsurances.map(i => i.equipmentName).join(" · ")}</p>
          </div>
          <Link href="/equipment" className="text-xs text-red-700 font-bold hover:underline bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors">
            לציוד ←
          </Link>
        </div>
      )}

      {/* Main balance card */}
      <div className={`rounded-2xl p-6 mb-4 text-white shadow-lg ${totalBalance >= 0 ? "bg-gradient-to-br from-green-500 to-green-700 shadow-green-200" : "bg-gradient-to-br from-red-500 to-red-600 shadow-red-200"}`}>
        <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">רווח תפעולי</p>
        <p className="text-4xl font-bold leading-none mb-4">{formatCurrency(totalBalance)}</p>
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
          <div>
            <p className="text-white/50 text-[11px] font-medium mb-0.5">הכנסות (כולל מע״מ)</p>
            <p className="text-white font-bold text-sm">{formatCurrency(totalIncome)}</p>
            <p className="text-white/40 text-[11px]">מע״מ: {formatCurrency(totalVat)}</p>
          </div>
          <div>
            <p className="text-white/50 text-[11px] font-medium mb-0.5">הוצאות</p>
            <p className="text-white font-bold text-sm">{formatCurrency(totalExpense)}</p>
          </div>
          {expectedIncome > 0 && (
            <div>
              <p className="text-white/50 text-[11px] font-medium mb-0.5">צפי מחוזים</p>
              <p className="text-white font-bold text-sm">{formatCurrency(expectedIncome)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="הכנסות נטו"
          value={formatCurrency(totalIncomeNet)}
          sub={`מע״מ: ${formatCurrency(totalVat)}`}
          color="green"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg>}
        />
        <StatCard
          label="הוצאות"
          value={formatCurrency(totalExpense)}
          color="red"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" /></svg>}
        />
        <StatCard
          label="אתרים פעילים"
          value={String(activeSites)}
          sub={`מתוך ${sites.length} סה״כ`}
          color="blue"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
        />
        <StatCard
          label="פריטי ציוד"
          value={String(equipment.length)}
          color="amber"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Active sites */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-bold text-gray-900 text-[15px]">אתרים פעילים</h2>
            <Link href="/sites" className="text-green-600 text-xs font-bold hover:text-green-700 flex items-center gap-1 transition-colors">
              כל האתרים
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </Link>
          </div>
          <div className="p-3">
            {activeSitesList.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <p className="text-gray-400 text-sm">אין אתרים פעילים</p>
                <Link href="/sites/new" className="mt-2 inline-block text-green-600 text-xs font-bold hover:underline">+ הוסף אתר</Link>
              </div>
            ) : (
              <div className="space-y-0.5">
                {activeSitesList.slice(0, 6).map(site => {
                  const income = (site.contractValue || 0) + (site.transactions || []).filter(t => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
                  const expense = (site.transactions || []).filter(t => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
                  const balance = income - expense;
                  return (
                    <Link key={site.id} href={`/sites/${site.id}`}
                      className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 bg-green-50 group-hover:bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{site.name}</p>
                          {site.location && <p className="text-gray-400 text-xs truncate">{site.location}</p>}
                        </div>
                      </div>
                      <span className={`text-sm font-bold flex-shrink-0 mr-2 ${balance >= 0 ? "text-green-600" : "text-red-500"}`}>
                        {formatCurrency(balance)}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent transactions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-bold text-gray-900 text-[15px]">תנועות אחרונות</h2>
            <Link href="/transactions" className="text-green-600 text-xs font-bold hover:text-green-700 flex items-center gap-1 transition-colors">
              כל התנועות
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p className="text-gray-400 text-sm">אין תנועות עדיין</p>
              </div>
            ) : (
              recentTransactions.map(t => (
                <div key={t.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${t.type === "INCOME" ? "bg-green-50" : "bg-red-50"}`}>
                      <svg className={`w-3.5 h-3.5 ${t.type === "INCOME" ? "text-green-600" : "text-red-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={t.type === "INCOME" ? "M7 11l5-5m0 0l5 5m-5-5v12" : "M17 13l-5 5m0 0l-5-5m5 5V6"} />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{t.description}</p>
                      <p className="text-xs text-gray-400">
                        {t.siteName ? `${t.siteName} · ` : ""}{formatDate(t.date)}
                        {t.source === "expense" && <span className="mr-1 text-gray-300">· הוצאה כללית</span>}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold flex-shrink-0 mr-2 ${t.type === "INCOME" ? "text-green-600" : "text-red-500"}`}>
                    {t.type === "INCOME" ? "+" : "−"}{formatCurrency(t.amount)}
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
