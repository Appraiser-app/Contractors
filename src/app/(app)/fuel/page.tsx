export const dynamic = "force-dynamic";
import { requireAuth } from "@/lib/auth";
import { getAllEquipment, getAllFuelLogs, getAllSites } from "@/lib/db";
import FuelClient from "./FuelClient";

export default async function FuelPage() {
  await requireAuth();
  const [logs, equipment, sites] = await Promise.all([
    getAllFuelLogs(),
    getAllEquipment(),
    getAllSites(),
  ]);

  return (
    <FuelClient
      initialLogs={logs as never}
      equipment={equipment.map(e => ({ id: e.id, name: e.name, type: e.type }))}
      sites={sites.map(s => ({ id: s.id, name: s.name, location: s.location }))}
    />
  );
}
