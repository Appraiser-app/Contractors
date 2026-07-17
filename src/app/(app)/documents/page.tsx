import { getProfile, requireAuth } from "@/lib/auth";
import { getAllDocuments } from "@/lib/db";
import Link from "next/link";

const docTypeLabel: Record<string, string> = {
  LICENSE: "רישיון", INSURANCE: "ביטוח", PERMIT: "אישור", CONTRACT: "חוזה", RECEIPT: "קבלה", OTHER: "אחר",
};
const docTypeColor: Record<string, string> = {
  LICENSE: "bg-blue-100 text-blue-700", INSURANCE: "bg-green-100 text-green-700",
  PERMIT: "bg-purple-100 text-purple-700", CONTRACT: "bg-indigo-100 text-indigo-700",
  RECEIPT: "bg-green-100 text-green-700", OTHER: "bg-gray-100 text-gray-600",
};

function isExpired(dateStr: string | null) {
  if (!dateStr) return false;
  return new Date(dateStr).getTime() < Date.now();
}

function isExpiringSoon(dateStr: string | null, days = 30) {
  if (!dateStr) return false;
  const diff = new Date(dateStr).getTime() - Date.now();
  return diff > 0 && diff < days * 86400000;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("he-IL");
}

const typeIcon: Record<string, string> = {
  TRUCK: "🚛", MINI_EXCAVATOR: "🏗️", BOBCAT: "🟡", OTHER: "⚙️",
};

export default async function DocumentsPage() {
  await requireAuth();
  const profile = await getProfile();
  const documents = await getAllDocuments();

  const expiredDocs = documents.filter(d => d.expiryDate && isExpired(d.expiryDate));
  const expiringSoon = documents.filter(d => d.expiryDate && isExpiringSoon(d.expiryDate));

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-start justify-between mb-6 sm:mb-8 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ניהול מסמכים</h1>
          <p className="text-gray-500 text-sm mt-1">{documents.length} מסמכים בסך הכל</p>
        </div>
      </div>

      {/* Alerts */}
      {(expiredDocs.length > 0 || expiringSoon.length > 0) && (
        <div className="space-y-2 mb-6">
          {expiredDocs.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-3 flex items-center gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.924-.833-2.694 0L3.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-sm text-red-700">
                <span className="font-semibold">{expiredDocs.length} מסמכים</span> פג תוקפם:&nbsp;
                {expiredDocs.map(d => d.title).join(", ")}
              </p>
            </div>
          )}
          {expiringSoon.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-5 py-3 flex items-center gap-3">
              <svg className="w-5 h-5 text-yellow-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-yellow-800">
                <span className="font-semibold">{expiringSoon.length} מסמכים</span> יפוגו תוך 30 יום:&nbsp;
                {expiringSoon.map(d => d.title).join(", ")}
              </p>
            </div>
          )}
        </div>
      )}

      {documents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 sm:p-16 text-center">
          <p className="text-gray-400 text-sm">אין מסמכים עדיין. הוסף מסמכים דרך עמוד הציוד.</p>
          <Link href="/equipment" className="mt-4 inline-block text-green-600 hover:text-green-600 text-sm font-medium">
            עבור לניהול ציוד
          </Link>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-2">
            {documents.map(doc => {
              const expired = doc.expiryDate && isExpired(doc.expiryDate);
              const expiring = doc.expiryDate && !expired && isExpiringSoon(doc.expiryDate);
              return (
                <div key={doc.id} className={`bg-white rounded-2xl border p-4 ${expired ? "border-red-200" : expiring ? "border-yellow-200" : "border-gray-100"}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{doc.title}</p>
                      {doc.notes && <p className="text-xs text-gray-400 mt-0.5">{doc.notes}</p>}
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-lg flex-shrink-0 ${docTypeColor[doc.type]}`}>{docTypeLabel[doc.type]}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      {doc.equipment ? (
                        <Link href={`/equipment/${doc.equipment.id}`} className="flex items-center gap-1 text-xs text-gray-600 hover:text-green-600">
                          <span>{typeIcon[doc.equipment.type || "OTHER"]}</span>
                          {doc.equipment.name}
                        </Link>
                      ) : <span className="text-gray-400 text-xs">—</span>}
                      {doc.expiryDate && <span className="text-xs text-gray-400">{formatDate(doc.expiryDate)}</span>}
                    </div>
                    {expired ? (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">פג תוקף</span>
                    ) : expiring ? (
                      <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full">פג בקרוב</span>
                    ) : doc.expiryDate ? (
                      <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">בתוקף</span>
                    ) : (
                      <span className="text-gray-400 text-xs">ללא תפוגה</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block bg-white rounded-2xl border border-gray-100 overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-400 uppercase">מסמך</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-400 uppercase">סוג</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-400 uppercase">כלי</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-400 uppercase">תפוגה</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-400 uppercase">סטטוס</th>
                </tr>
              </thead>
              <tbody>
                {documents.map(doc => {
                  const expired = doc.expiryDate && isExpired(doc.expiryDate);
                  const expiring = doc.expiryDate && !expired && isExpiringSoon(doc.expiryDate);
                  return (
                    <tr key={doc.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-800 text-sm">{doc.title}</p>
                        {doc.notes && <p className="text-xs text-gray-400">{doc.notes}</p>}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-lg ${docTypeColor[doc.type]}`}>{docTypeLabel[doc.type]}</span>
                      </td>
                      <td className="px-5 py-3">
                        {doc.equipment ? (
                          <Link href={`/equipment/${doc.equipment.id}`} className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-green-600">
                            <span>{typeIcon[doc.equipment.type || "OTHER"]}</span>
                            {doc.equipment.name}
                          </Link>
                        ) : <span className="text-gray-400 text-sm">—</span>}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">{doc.expiryDate ? formatDate(doc.expiryDate) : "—"}</td>
                      <td className="px-5 py-3">
                        {expired ? (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">פג תוקף</span>
                        ) : expiring ? (
                          <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full">פג בקרוב</span>
                        ) : doc.expiryDate ? (
                          <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">בתוקף</span>
                        ) : (
                          <span className="text-gray-400 text-xs">ללא תפוגה</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
