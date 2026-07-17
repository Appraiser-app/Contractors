import SitesPageClient from "@/components/SitesPageClient";
import { requireAuth } from "@/lib/auth";
import { getAllSites } from "@/lib/db";

export default async function SitesPage() {
  await requireAuth();
  const sites = await getAllSites();
  return <SitesPageClient sites={sites} />;
}
