import { requireAuth } from "@/lib/auth";
import EquipmentForm from "@/components/EquipmentForm";

export default async function NewEquipmentPage() {
  await requireAuth();
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl">
      <div className="mb-5 sm:mb-8">
        <h1 className="text-2xl font-bold text-gray-900">כלי חדש</h1>
        <p className="text-gray-500 text-sm mt-1">הוסף ציוד לניהול</p>
      </div>
      <EquipmentForm />
    </div>
  );
}
