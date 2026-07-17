import { getProfile, requireAuth } from "@/lib/auth";
import { getAllEquipment, getAllMaintenanceAppointments, getAllSubscriptions } from "@/lib/db";
import SubscriptionsClient from "./SubscriptionsClient";

export default async function SubscriptionsPage() {
  await requireAuth();
  const profile = await getProfile();
  const [subscriptions, appointments, equipment] = await Promise.all([
    getAllSubscriptions(),
    getAllMaintenanceAppointments(),
    getAllEquipment(),
  ]);
  const isAdmin = profile?.role === "ADMIN";
  return (
    <SubscriptionsClient
      initialSubscriptions={subscriptions}
      initialAppointments={appointments}
      equipmentList={equipment.map(e => ({ id: e.id, name: e.name, serviceSchedules: e.serviceSchedules || [] }))}
      isAdmin={isAdmin}
    />
  );
}
