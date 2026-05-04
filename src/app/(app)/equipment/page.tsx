import { requireAuth } from "@/lib/auth";
import { getAllEquipment } from "@/lib/db";
import Link from "next/link";

const typeLabel: Record<string, string> = {
  TRUCK: "משאית", MINI_EXCAVATOR: "מיני מחפרון", BOBCAT: "בובקט", OTHER: "אחר",
};
const typeIcon: Record<string, string> = {
  TRUCK: "🚛", MINI_EXCAVATOR: "🏗️", BOBCAT: "🟡", OTHER: "⚙️",
};
const statusLabel: Record<string, string> = {
  ACTIVE: "פעיל", IN_REPAIR: "בתיקון", INACTIVE: "לא פעיל",
};
const statusColor: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  IN_REPAIR: "bg-green-100 text-green-700",
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

export default async function EquipmentPage() {
  await requireAuth();
  const equipment = await getAllEquipment();

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-start justify-between mb-6 sm:mb-8 gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ניהול ציוד</h1>
          <p className="text-gray-400 text-sm mt-1">{equipment.length} כלים בסך הכל</p>
        </div>
        <Link href="/equipment/new"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm shadow-md shadow-green-200">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          כלי חדש
        </Link>
      </div>

      {equipment.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-20 text-center">
          <p className="text-5xl mb-4">🚛</p>
          <p className="text-gray-500 font-medium">אין ציוד עדיין</p>
          <p className="text-gray-400 text-sm mt-1 mb-5">הוסף את הכלי הראשון שלך</p>
          <Link href="/equipment/new"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            הוסף ציוד
          </Link>
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

            return (
              <Link key={eq.id} href={`/equipment/${eq.id}`}
                className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-green-200 hover:shadow-lg hover:shadow-green-50 transition-all group">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-stone-100 group-hover:bg-green-50 rounded-2xl flex items-center justify-center text-2xl transition-colors flex-shrink-0">
                      {typeIcon[eq.type]}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 group-hover:text-green-700 transition-colors">{eq.name}</h3>
                      <p className="text-gray-400 text-xs mt-0.5">{typeLabel[eq.type]}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${statusColor[eq.status]}`}>
                    {statusLabel[eq.status]}
                  </span>
                </div>

                {/* Vehicle info */}
                {(eq.licensePlate || eq.year) && (
                  <p className="text-xs text-gray-400 mb-3 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    {[eq.licensePlate, eq.year].filter(Boolean).join(" · ")}
                  </p>
                )}

                {/* Insurance alert */}
                {(insuranceExpired || insuranceExpiring) && (
                  <div className={`rounded-xl px-3 py-2 mb-3 flex items-center gap-2 text-xs font-medium ${insuranceExpired ? "bg-red-50 text-red-700" : "bg-yellow-50 text-yellow-700"}`}>
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.694 0L3.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    {insuranceExpired ? "ביטוח פג תוקף" : "ביטוח פג בקרוב"}
                  </div>
                )}

                {/* Stats */}
                <div className="flex gap-3 pt-3 border-t border-gray-50 text-xs">
                  <div className="flex-1">
                    <p className="text-gray-400">תחזוקות</p>
                    <p className="font-semibold text-gray-700 mt-0.5">{(eq.maintenance || []).length}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-400">ביטוחים</p>
                    <p className="font-semibold text-gray-700 mt-0.5">{insurances.length}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-400">עלות כוללת</p>
                    <p className="font-semibold text-red-500 mt-0.5">{formatCurrency(totalCost)}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
