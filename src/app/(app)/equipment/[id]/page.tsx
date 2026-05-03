import { requireAuth, getProfile } from "@/lib/auth";
import { getEquipmentById } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import EquipmentTabs from "@/components/EquipmentTabs";

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
  const isAdmin = profile?.role === "ADMIN";

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/equipment" className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{eq.name}</h1>
            <span className={`text-xs font-medium px-2 py-1 rounded-lg ${statusColor[eq.status]}`}>{statusLabel[eq.status]}</span>
          </div>
          <p className="text-gray-500 text-sm mr-8">
            {typeLabel[eq.type]}
            {eq.licensePlate && ` · ${eq.licensePlate}`}
            {eq.year && ` · ${eq.year}`}
          </p>
        </div>
        {isAdmin && (
          <Link href={`/equipment/${eq.id}/edit`} className="flex items-center gap-2 border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium px-3 py-2 rounded-xl transition-colors text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            עריכה
          </Link>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">תחזוקות</p>
          <p className="text-xl font-bold text-gray-800">{(eq.maintenance || []).length}</p>
          <p className="text-xs text-red-500 mt-0.5">{formatCurrency(totalMaint)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">ביטוחים</p>
          <p className="text-xl font-bold text-gray-800">{(eq.insurances || []).length}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {(eq.insurances || []).filter(i => new Date(i.endDate) > new Date()).length} פעילים
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">הוצאות</p>
          <p className="text-xl font-bold text-gray-800">{(eq.expenses || []).length}</p>
          <p className="text-xs text-red-500 mt-0.5">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">עלות כוללת</p>
          <p className="text-xl font-bold text-red-600">{formatCurrency(totalExpenses + totalMaint)}</p>
        </div>
      </div>

      {/* Tabs */}
      <EquipmentTabs equipment={eq} isAdmin={isAdmin} />
    </div>
  );
}
