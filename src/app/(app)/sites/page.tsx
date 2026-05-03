import { requireAuth } from "@/lib/auth";
import { getAllSites } from "@/lib/db";
import Link from "next/link";

const statusLabel: Record<string, string> = { ACTIVE: "פעיל", COMPLETED: "הושלם", ON_HOLD: "מושהה" };
const statusColor: Record<string, string> = { ACTIVE: "bg-green-100 text-green-700", COMPLETED: "bg-blue-100 text-blue-700", ON_HOLD: "bg-yellow-100 text-yellow-700" };

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(amount);
}

export default async function SitesPage() {
  await requireAuth();
  const sites = await getAllSites();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">אתרי עבודה</h1>
          <p className="text-gray-500 text-sm mt-1">{sites.length} אתרים בסך הכל</p>
        </div>
        <Link href="/sites/new" className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          אתר חדש
        </Link>
      </div>

      {sites.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <p className="text-gray-400 text-sm">אין אתרים עדיין. הוסף את האתר הראשון!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sites.map(site => {
            const income = (site.transactions || []).filter(t => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
            const expense = (site.transactions || []).filter(t => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
            const balance = income - expense;
            return (
              <Link key={site.id} href={`/sites/${site.id}`} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-amber-200 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{site.name}</h3>
                    {site.location && <p className="text-gray-400 text-xs mt-0.5">{site.location}</p>}
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-lg ${statusColor[site.status]}`}>{statusLabel[site.status]}</span>
                </div>
                {site.clientName && <p className="text-sm text-gray-600 mb-3">לקוח: {site.clientName}</p>}
                <div className="flex gap-3 pt-3 border-t border-gray-50">
                  <div className="flex-1"><p className="text-xs text-gray-400">הכנסות</p><p className="text-sm font-semibold text-green-600">{formatCurrency(income)}</p></div>
                  <div className="flex-1"><p className="text-xs text-gray-400">הוצאות</p><p className="text-sm font-semibold text-red-600">{formatCurrency(expense)}</p></div>
                  <div className="flex-1"><p className="text-xs text-gray-400">יתרה</p><p className={`text-sm font-bold ${balance >= 0 ? "text-green-700" : "text-red-700"}`}>{formatCurrency(balance)}</p></div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
