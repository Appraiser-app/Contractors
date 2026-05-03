import { requireAuth } from "@/lib/auth";
import { getAllSites, getAllTransactions } from "@/lib/db";
import Link from "next/link";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(amount);
}

export default async function DashboardPage() {
  await requireAuth();

  const [sites, allTransactions] = await Promise.all([
    getAllSites(),
    getAllTransactions(),
  ]);

  const totalIncome = allTransactions.filter(t => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const totalExpense = allTransactions.filter(t => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
  const totalBalance = totalIncome - totalExpense;
  const activeSites = sites.filter(s => s.status === "ACTIVE").length;
  const recentTransactions = allTransactions.slice(0, 10);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">לוח בקרה</h1>
        <p className="text-gray-500 text-sm mt-1">סיכום כללי של הפעילות</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="יתרה כוללת" value={formatCurrency(totalBalance)} color={totalBalance >= 0 ? "text-green-600" : "text-red-600"} iconBg="bg-green-100" iconColor="text-green-600" icon="balance" />
        <StatCard label="סה״כ הכנסות" value={formatCurrency(totalIncome)} color="text-blue-600" iconBg="bg-blue-100" iconColor="text-blue-600" icon="income" />
        <StatCard label="סה״כ הוצאות" value={formatCurrency(totalExpense)} color="text-red-600" iconBg="bg-red-100" iconColor="text-red-600" icon="expense" />
        <StatCard label="אתרים פעילים" value={`${activeSites} מתוך ${sites.length}`} color="text-amber-600" iconBg="bg-amber-100" iconColor="text-amber-600" icon="sites" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">אתרים פעילים</h2>
            <Link href="/sites" className="text-amber-600 text-sm hover:underline">כל האתרים</Link>
          </div>
          {sites.filter(s => s.status === "ACTIVE").length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">אין אתרים פעילים</p>
          ) : (
            <div className="space-y-3">
              {sites.filter(s => s.status === "ACTIVE").slice(0, 5).map(site => {
                const income = (site.transactions || []).filter(t => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
                const expense = (site.transactions || []).filter(t => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
                return (
                  <Link key={site.id} href={`/sites/${site.id}`} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-amber-50 transition-colors">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{site.name}</p>
                      {site.location && <p className="text-gray-400 text-xs">{site.location}</p>}
                    </div>
                    <p className={`text-sm font-semibold ${income - expense >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(income - expense)}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">תנועות אחרונות</h2>
            <Link href="/transactions" className="text-amber-600 text-sm hover:underline">כל התנועות</Link>
          </div>
          {recentTransactions.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">אין תנועות עדיין</p>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map(t => (
                <div key={t.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${t.type === "INCOME" ? "bg-green-100" : "bg-red-100"}`}>
                      <svg className={`w-4 h-4 ${t.type === "INCOME" ? "text-green-600" : "text-red-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.type === "INCOME" ? "M7 11l5-5m0 0l5 5m-5-5v12" : "M17 13l-5 5m0 0l-5-5m5 5V6"} />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{t.description}</p>
                      <p className="text-xs text-gray-400">{t.workSite?.name || ""}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${t.type === "INCOME" ? "text-green-600" : "text-red-600"}`}>
                    {t.type === "INCOME" ? "+" : "-"}{formatCurrency(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, iconBg, iconColor, icon }: {
  label: string; value: string; color: string; iconBg: string; iconColor: string; icon: string;
}) {
  const icons: Record<string, string> = {
    balance: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    income: "M7 11l5-5m0 0l5 5m-5-5v12",
    expense: "M17 13l-5 5m0 0l-5-5m5 5V6",
    sites: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
      <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <svg className={`w-5 h-5 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[icon]} />
        </svg>
      </div>
      <div>
        <p className="text-gray-500 text-xs mb-0.5">{label}</p>
        <p className={`text-xl font-bold ${color}`}>{value}</p>
      </div>
    </div>
  );
}
