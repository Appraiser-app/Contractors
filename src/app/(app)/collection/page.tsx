import { requireAuth, getProfile } from "@/lib/auth";
import { getAllSites } from "@/lib/db";
import CollectButton from "@/components/CollectButton";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "long", year: "numeric" }).format(new Date(date));
}

export default async function CollectionPage() {
  await requireAuth();
  const profile = await getProfile();
  const allSites = await getAllSites();

  const pendingCollection = allSites.filter(s => s.status === "COMPLETED" && !s.collectedAt);
  const collected = allSites.filter(s => s.status === "COMPLETED" && s.collectedAt);

  const totalPending = pendingCollection.reduce((s, site) => s + (site.contractValue || 0), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">גבייה</h1>
        <p className="text-gray-500 text-sm mt-1">עבודות שהסתיימו וממתינות לגבייה</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-gray-400 text-xs mb-1">ממתין לגבייה</p>
          <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalPending)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-gray-400 text-xs mb-1">עבודות פתוחות</p>
          <p className="text-2xl font-bold text-gray-900">{pendingCollection.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-gray-400 text-xs mb-1">נגבה השנה</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(collected.filter(s => s.collectedAt && new Date(s.collectedAt).getFullYear() === new Date().getFullYear()).reduce((s, site) => s + (site.contractValue || 0), 0))}
          </p>
        </div>
      </div>

      {/* Pending collection */}
      <div className="bg-white rounded-2xl border border-gray-100 mb-6">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="font-bold text-gray-900">ממתין לגבייה ({pendingCollection.length})</h2>
        </div>
        {pendingCollection.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm">אין עבודות שממתינות לגבייה</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {pendingCollection.map(site => (
              <div key={site.id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{site.name}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {site.clientName && <span className="text-xs text-gray-500">{site.clientName}</span>}
                    {site.completedAt && <span className="text-xs text-gray-400">הושלם {formatDate(site.completedAt)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {site.contractValue && (
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(site.contractValue)}</span>
                  )}
                  {site.workOrderUrl && (
                    <a href={site.workOrderUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </a>
                  )}
                  <CollectButton siteId={site.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Collected history */}
      {collected.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="font-bold text-gray-900">היסטוריית גבייה ({collected.length})</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {collected.sort((a, b) => (b.collectedAt || "").localeCompare(a.collectedAt || "")).map(site => (
              <div key={site.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{site.name}</p>
                  <div className="flex flex-wrap gap-2 mt-0.5">
                    {site.clientName && <span className="text-xs text-gray-400">{site.clientName}</span>}
                    {site.collectedAt && <span className="text-xs text-green-500">נגבה {formatDate(site.collectedAt)}</span>}
                  </div>
                </div>
                {site.contractValue && (
                  <span className="text-sm font-semibold text-gray-500 flex-shrink-0">{formatCurrency(site.contractValue)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
