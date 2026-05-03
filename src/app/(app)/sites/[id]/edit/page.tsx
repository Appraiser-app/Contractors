import { requireAdmin } from "@/lib/auth";
import { getSiteById } from "@/lib/db";
import { notFound } from "next/navigation";
import SiteForm from "@/components/SiteForm";

export default async function EditSitePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const site = await getSiteById(id);
  if (!site) notFound();

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">עריכת אתר</h1>
        <p className="text-gray-500 text-sm mt-1">{site.name}</p>
      </div>
      <SiteForm site={{ ...site, startDate: site.startDate ? new Date(site.startDate) : null, endDate: site.endDate ? new Date(site.endDate) : null }} />
    </div>
  );
}
