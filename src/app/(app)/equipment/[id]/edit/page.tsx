import { requireAdmin } from "@/lib/auth";
import { getEquipmentById } from "@/lib/db";
import { notFound } from "next/navigation";
import EquipmentForm from "@/components/EquipmentForm";

export default async function EditEquipmentPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const eq = await getEquipmentById(id);
  if (!eq) notFound();

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">עריכת כלי</h1>
        <p className="text-gray-500 text-sm mt-1">{eq.name}</p>
      </div>
      <EquipmentForm equipment={eq} />
    </div>
  );
}
