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
  ACTIVE: "bg-green-100 text-green-700", IN_REPAIR: "bg-orange-100 text-orange-700", INACTIVE: "bg-gray-100 text-gray-500",
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
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ניהול ציוד</h1>
          <p className="text-gray-500 text-sm mt-1">{equipment.length} כלים בסך הכל</p>
        </div>
        <Link href="/equipment/new" className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          כלי חדש
        </Link>
      </div>

      {equipment.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <p className="text-gray-400 text-sm">אין ציוד עדיין. הוסף את הכלי הראשון!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {equipment.map(eq => {
            const totalExpenses = (eq.expenses || []).reduce((s, e) => s + e.amount, 0);
            const totalMaint = (eq.maintenance || []).reduce((s, m) => s + (m.cost || 0), 0);
            const totalCost = totalExpenses + totalMaint;
            const nextInsurance = (eq.insurances || []).sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())[0];
            const hasExpiring = nextInsurance && (isExpiringSoon(nextInsurance.endDate) || isExpired(nextInsurance.endDate));

            return (
              <Link key={eq.id} href={`/equipment/${eq.id}`} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-amber-200 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{typeIcon[eq.type]}</span>
                    <div>
                      <h3 className="font-bold text-gray-900">{eq.name}</h3>
                      <p className="text-gray-400 text-xs">{typeLabel[eq.type]}{eq.licensePlate ? ` · ${eq.licensePlate}` : ""}{eq.year ? ` · ${eq.year}` : ""}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <span className={`text-xs font-medium px-2 py-1 rounded-lg ${statusColor[eq.status]}`}>{statusLabel[eq.status]}</span>
                    {hasExpiring && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-lg ${isExpired(nextInsurance!.endDate) ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {isExpired(nextInsurance!.endDate) ? "ביטוח פג" : "ביטוח פג בקרוב"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-3 border-t border-gray-50 text-xs">
                  <div className="flex-1"><p className="text-gray-400">תחזוקות</p><p className="font-semibold text-gray-700">{(eq.maintenance || []).length}</p></div>
                  <div className="flex-1"><p className="text-gray-400">ביטוחים</p><p className="font-semibold text-gray-700">{(eq.insurances || []).length}</p></div>
                  <div className="flex-1"><p className="text-gray-400">עלות כוללת</p><p className="font-semibold text-red-600">{formatCurrency(totalCost)}</p></div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
