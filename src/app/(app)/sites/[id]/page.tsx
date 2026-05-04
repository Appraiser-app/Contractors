import { requireAuth, getProfile } from "@/lib/auth";
import { getSiteById } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import DeleteSiteButton from "@/components/DeleteSiteButton";
import AddTransactionForm from "@/components/AddTransactionForm";

const statusLabel: Record<string, string> = { ACTIVE: "פעיל", COMPLETED: "הושלם", ON_HOLD: "מושהה" };
const statusColor: Record<string, string> = { ACTIVE: "bg-green-100 text-green-700", COMPLETED: "bg-blue-100 text-blue-700", ON_HOLD: "bg-yellow-100 text-yellow-700" };

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "long", year: "numeric" }).format(new Date(date));
}

export default async function SitePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const profile = await getProfile();
  const { id } = await params;

  const site = await getSiteById(id);
  if (!site) notFound();

  const transactions = site.transactions || [];
  const income = transactions.filter(t => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const isAdmin = profile?.role === "ADMIN";

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5 sm:mb-8">
        <div>
          <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
            <Link href="/sites" className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{site.name}</h1>
            <span className={`text-xs font-medium px-2 py-1 rounded-lg ${statusColor[site.status]}`}>{statusLabel[site.status]}</span>
          </div>
          {site.location && <p className="text-gray-500 text-sm sm:mr-8">{site.location}</p>}
        </div>
        {isAdmin && (
          <div className="flex gap-2 flex-shrink-0">
            <Link href={`/sites/${site.id}/edit`} className="flex items-center gap-1.5 border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium px-3 py-2 rounded-xl transition-colors text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              עריכה
            </Link>
            <DeleteSiteButton siteId={site.id} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5"><p className="text-gray-400 text-xs mb-1">הכנסות</p><p className="text-xl sm:text-2xl font-bold text-green-600">{formatCurrency(income)}</p></div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5"><p className="text-gray-400 text-xs mb-1">הוצאות</p><p className="text-xl sm:text-2xl font-bold text-red-600">{formatCurrency(expense)}</p></div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5"><p className="text-gray-400 text-xs mb-1">יתרה</p><p className={`text-xl sm:text-2xl font-bold ${balance >= 0 ? "text-green-700" : "text-red-700"}`}>{formatCurrency(balance)}</p></div>
      </div>

      {(site.clientName || site.contractValue || site.description) && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 mb-4 sm:mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {site.clientName && <div><p className="text-xs text-gray-400 mb-0.5">שם לקוח</p><p className="text-sm font-medium text-gray-900">{site.clientName}</p></div>}
          {site.contractValue && <div><p className="text-xs text-gray-400 mb-0.5">ערך חוזה</p><p className="text-sm font-medium text-gray-900">{formatCurrency(site.contractValue)}</p></div>}
          {site.description && <div className="sm:col-span-3"><p className="text-xs text-gray-400 mb-0.5">תיאור</p><p className="text-sm text-gray-600">{site.description}</p></div>}
        </div>
      )}

      <div className="mb-4 sm:mb-6">
        <AddTransactionForm siteId={site.id} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-50">
          <h2 className="font-bold text-gray-900">תנועות ({transactions.length})</h2>
        </div>
        {transactions.length === 0 ? (
          <div className="p-8 sm:p-12 text-center"><p className="text-gray-400 text-sm">אין תנועות עדיין</p></div>
        ) : (
          <div className="divide-y divide-gray-50">
            {transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
              <div key={t.id} className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center flex-shrink-0 ${t.type === "INCOME" ? "bg-green-100" : "bg-red-100"}`}>
                    <svg className={`w-4 h-4 ${t.type === "INCOME" ? "text-green-600" : "text-red-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.type === "INCOME" ? "M7 11l5-5m0 0l5 5m-5-5v12" : "M17 13l-5 5m0 0l-5-5m5 5V6"} />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{t.description}</p>
                    <div className="flex flex-wrap gap-1.5 mt-0.5">
                      {t.category && <span className="text-xs text-gray-400">{t.category}</span>}
                      <span className="text-xs text-gray-400">{formatDate(t.date)}</span>
                      {t.receiptUrl && (
                        <a href={t.receiptUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-600">📎 קבלה</a>
                      )}
                    </div>
                  </div>
                </div>
                <span className={`text-sm font-bold flex-shrink-0 ${t.type === "INCOME" ? "text-green-600" : "text-red-600"}`}>
                  {t.type === "INCOME" ? "+" : "-"}{formatCurrency(t.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
