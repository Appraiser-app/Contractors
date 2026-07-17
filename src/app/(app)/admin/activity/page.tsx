export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth";
import { getAllProfiles, getRecentActivities } from "@/lib/db";
import ActivityClient from "./ActivityClient";

export default async function ActivityPage() {
  const [, activities, users] = await Promise.all([
    requireAdmin(),
    getRecentActivities(200),
    getAllProfiles(),
  ]);

  return <ActivityClient initialActivities={activities} users={users} />;
}
