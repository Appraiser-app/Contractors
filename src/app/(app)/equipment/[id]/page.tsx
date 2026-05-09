import { requireAuth, getProfile } from "@/lib/auth";
import { getEquipmentById } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import EquipmentTabs from "@/components/EquipmentTabs";
import DeleteEquipmentButton from "@/components/DeleteEquipmentButton";

const typeLabel: Record<string, string> = {
  TRUCK: "משאית", MINI_EXCAVATOR: "מיני מחפרון", BOBCAT: "בובקט", OTHER: "אחר",
};
const statusLabel: Record<string, string> = {
  ACTIVE: "פעיל", IN_REPAIR: "בתיקון", INACTIVE: "לא פעיל",
};
const statusColor: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700", IN_REPAIR: "bg-green-100 text-green-700", INACTIVE: "bg-gray-100 text-gray-500",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(amount);
}

export default async function EquipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const profile = await getProfile();
  const { id } = await params;
  const eq = await getEquipmentById(id);
  if (!eq) notFound();

  const totalExpenses = (eq.expenses || []).reduce((s, e) => s + e.amount, 0);
  const totalMaint = (eq.maintenance || []).reduce((s, m) => s + (m.cost || 0), 0);
  const totalFuel = (eq.fuelLogs || []).reduce((s, l) => s + l.totalCost, 0);
  const totalLiters = (eq.fuelLogs || []).reduce((s, l) => s + l.liters, 0);
  const isAdmin = profile?.role === "ADMIN";

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
            <Link href="/equipment" className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{eq.name}</h1>
            <span className={`text-xs font-medium px-2 py-1 rounded-lg ${statusColor[eq.status]}`}>{statusLabel[eq.status]}</span>
          </div>
          <p className="text-gray-500 text-sm sm:mr-8">
            {typeLabel[eq.type]}
            {eq.licensePlate && ` · ${eq.licensePlate}`}
            {eq.year && ` · ${eq.year}`}
          </p>
          {(eq.registeredOwner || eq.registeredAt) && (
            <div className="flex items-center gap-1.5 mt-1 sm:mr-8">
              <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-xs text-gray-400">
                רשום על שם{eq.registeredOwner ? ` ${eq.registeredOwner}` : ""}
                {eq.registeredAt && ` · ${eq.registeredAt === "VEHICLE_LICENSING" ? "משרד הרישוי" : "משרד העבודה"}`}
              </span>
            </div>
          )}
          {eq.currentMileage != null && (
            <div className="flex items-center gap-1.5 mt-1 sm:mr-8">
              <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs text-gray-400">
                {eq.currentMileage.toLocaleString("he-IL")} ק״מ
                {eq.nextServiceMileage != null && (
                  <span className={eq.nextServiceMileage - eq.currentMileage <= 1000 ? "text-orange-500 font-medium" : ""}>
                    {" · טיפול ב-"}{eq.nextServiceMileage.toLocaleString("he-IL")} ק״מ
                    {" (עוד "}{Math.max(0, eq.nextServiceMileage - eq.currentMileage).toLocaleString("he-IL")}{" ק״מ)"}
                  </span>
                )}
              </span>
            </div>
          )}
          {eq.testDate && (() => {
            const days = Math.ceil((new Date(eq.testDate).getTime() - Date.now()) / 86400000);
            const isUrgent = days <= 30;
            const isExpired = days < 0;
            return (
              <div className={`flex items-center gap-1.5 mt-1 sm:mr-8 ${isExpired ? "text-red-500" : isUrgent ? "text-orange-500" : "text-gray-400"}`}>
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-medium">
                  טסט: {new Date(eq.testDate).toLocaleDateString("he-IL")}
                  {isExpired ? ` · פג לפני ${Math.abs(days)} ימים` : isUrgent ? ` · עוד ${days} ימים` : ""}
                </span>
              </div>
            );
          })()}
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/equipment/${eq.id}/edit`} className="flex items-center gap-1.5 border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium px-3 py-2 rounded-xl transition-colors text-sm flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              עריכה
            </Link>
            <DeleteEquipmentButton id={eq.id} name={eq.name} />
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">טיפולים</p>
          <p className="text-xl font-bold text-gray-800">{(eq.maintenance || []).length}</p>
          <p className="text-xs text-red-500 mt-0.5">{formatCurrency(totalMaint)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">תדלוקים</p>
          <p className="text-xl font-bold text-gray-800">{(eq.fuelLogs || []).length}</p>
          <p className="text-xs text-orange-500 mt-0.5">{totalLiters.toLocaleString("he-IL", { maximumFractionDigits: 1 })} ל' · {formatCurrency(totalFuel)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">ביטוחים</p>
          <p className="text-xl font-bold text-gray-800">{(eq.insurances || []).length}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {(eq.insurances || []).filter(i => new Date(i.endDate) > new Date()).length} פעילים
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">עלות כוללת</p>
          <p className="text-xl font-bold text-red-600">{formatCurrency(totalExpenses + totalMaint + totalFuel)}</p>
        </div>
      </div>

      {/* Tabs */}
      <EquipmentTabs equipment={eq} isAdmin={isAdmin} />
    </div>
  );
}
