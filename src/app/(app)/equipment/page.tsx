import { requireAuth, getProfile } from "@/lib/auth";
import { getAllEquipment } from "@/lib/db";
import Link from "next/link";

const typeLabel: Record<string, string> = {
  TRUCK: "משאית", MINI_EXCAVATOR: "מיני מחפרון", BOBCAT: "בובקט", OTHER: "ציוד",
};

const typeIcon: Record<string, React.ReactNode> = {
  TRUCK: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l1 1h1m8-1h1l1-1v-3.65a1 1 0 00-.22-.624l-3.48-4.35A1 1 0 0011.52 6H8m0 10H4m4 0h3M3 6v6h7M7 3v3"/>
    </svg>
  ),
  MINI_EXCAVATOR: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
    </svg>
  ),
  BOBCAT: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
    </svg>
  ),
  OTHER: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
    </svg>
  ),
};

const typeColor: Record<string, string> = {
  TRUCK: "bg-blue-50 text-blue-600",
  MINI_EXCAVATOR: "bg-amber-50 text-amber-600",
  BOBCAT: "bg-orange-50 text-orange-600",
  OTHER: "bg-gray-50 text-gray-500",
};

const statusLabel: Record<string, string> = {
  ACTIVE: "פעיל", IN_REPAIR: "בתיקון", INACTIVE: "לא פעיל",
};
const statusColor: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  IN_REPAIR: "bg-amber-100 text-amber-700",
  INACTIVE: "bg-gray-100 text-gray-500",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(amount);
}

function isExpiringSoon(dateStr: string | null, days = 30) {
  if (!dateStr) return false;
  const diff = new Date(dateStr).getTime() - Date.now();
  return diff > 0 && diff < days * 86400000;
}

function isExpired(dateStr: string | null) {
  if (!dateStr) return false;
  return new Date(dateStr).getTime() < Date.now();
}

function AlertBadge({ type }: { type: "expired" | "expiring"; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg ${type === "expired" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`}>
      <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {type === "expired" ? "פג תוקף" : "פג בקרוב"}
    </div>
  );
}

export default async function EquipmentPage() {
  await requireAuth();
  const [equipment, profile] = await Promise.all([getAllEquipment(), getProfile()]);
  const isAdmin = profile?.role === "ADMIN";

  const activeCount = equipment.filter(e => e.status === "ACTIVE").length;
  const inRepairCount = equipment.filter(e => e.status === "IN_REPAIR").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ניהול ציוד</h1>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2.5 py-1 rounded-full">{activeCount} פעילים</span>
            {inRepairCount > 0 && <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2.5 py-1 rounded-full">{inRepairCount} בתיקון</span>}
            <span className="text-xs text-gray-400">{equipment.length} סה״כ</span>
          </div>
        </div>
        {isAdmin && (
          <Link href="/equipment/new"
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm shadow-sm shadow-green-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            כלי חדש
          </Link>
        )}
      </div>

      {equipment.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-20 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-gray-600 font-semibold mb-1">אין ציוד עדיין</p>
          <p className="text-gray-400 text-sm mb-5">הוסף את הכלי הראשון שלך</p>
          {isAdmin && (
            <Link href="/equipment/new"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              הוסף ציוד
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {equipment.map(eq => {
            const totalExpenses = (eq.expenses || []).reduce((s, e) => s + e.amount, 0);
            const totalMaint = (eq.maintenance || []).reduce((s, m) => s + (m.cost || 0), 0);
            const totalCost = totalExpenses + totalMaint;
            const insurances = eq.insurances || [];
            const activeInsurance = [...insurances].sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0];
            const insuranceExpired = activeInsurance && isExpired(activeInsurance.endDate);
            const insuranceExpiring = activeInsurance && !insuranceExpired && isExpiringSoon(activeInsurance.endDate);
            const testExpired = isExpired(eq.testDate);
            const testExpiring = !testExpired && isExpiringSoon(eq.testDate);
            const hasAlert = insuranceExpired || insuranceExpiring || testExpired || testExpiring;

            return (
              <div key={eq.id} className={`relative bg-white rounded-2xl border transition-all duration-200 group hover:shadow-md ${hasAlert ? "border-amber-200" : "border-gray-100 hover:border-green-200"}`}>
                <Link href={`/equipment/${eq.id}`} className="block p-5">
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${typeColor[eq.type] || typeColor.OTHER}`}>
                      {typeIcon[eq.type] || typeIcon.OTHER}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 group-hover:text-green-700 transition-colors truncate">{eq.name}</h3>
                      <p className="text-gray-400 text-xs mt-0.5">{typeLabel[eq.type] || "ציוד"}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${statusColor[eq.status]}`}>
                      {statusLabel[eq.status]}
                    </span>
                  </div>

                  {/* Vehicle details */}
                  {(eq.licensePlate || eq.year) && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3 bg-gray-50 rounded-lg px-2.5 py-1.5">
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      {[eq.licensePlate, eq.year].filter(Boolean).join(" · ")}
                    </div>
                  )}

                  {/* Alerts */}
                  {hasAlert && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {insuranceExpired && <AlertBadge type="expired" label="ביטוח" />}
                      {insuranceExpiring && !insuranceExpired && <AlertBadge type="expiring" label="ביטוח" />}
                      {testExpired && <AlertBadge type="expired" label="טסט" />}
                      {testExpiring && !testExpired && <AlertBadge type="expiring" label="טסט" />}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-50 text-xs">
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-gray-400 mb-0.5">תחזוקות</p>
                      <p className="font-bold text-gray-700">{(eq.maintenance || []).length}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-gray-400 mb-0.5">ביטוחים</p>
                      <p className="font-bold text-gray-700">{insurances.length}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-2 text-center">
                      <p className="text-gray-400 mb-0.5">עלות</p>
                      <p className="font-bold text-red-600">{totalCost > 0 ? formatCurrency(totalCost) : "—"}</p>
                    </div>
                  </div>
                </Link>

                {isAdmin && (
                  <Link href={`/equipment/${eq.id}/edit`}
                    className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-200 text-gray-400 hover:text-green-700 hover:border-green-200 rounded-lg p-1.5 shadow-sm"
                    onClick={e => e.stopPropagation()}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
