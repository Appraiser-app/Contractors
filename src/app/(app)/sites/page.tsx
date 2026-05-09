import { requireAuth } from "@/lib/auth";
import { getAllSites } from "@/lib/db";
import SitesPageClient from "@/components/SitesPageClient";

export default async function SitesPage() {
  await requireAuth();
  const sites = await getAllSites();
  return <SitesPageClient sites={sites} />;
}
