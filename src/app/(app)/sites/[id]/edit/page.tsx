import SiteForm from "@/components/SiteForm";
import { requireAdmin } from "@/lib/auth";
import { getSiteById } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EditSitePage({
	params,
}: { params: Promise<{ id: string }> }) {
	await requireAdmin();
	const { id } = await params;
	const site = await getSiteById(id);
	if (!site) notFound();

	return (
		<div className="p-4 sm:p-6 lg:p-8 max-w-2xl">
			<div className="mb-5 sm:mb-8">
				<Link
					href={`/sites/${id}`}
					className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-3 group"
				>
					<svg
						aria-hidden="true"
						className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M9 5l7 7-7 7"
						/>
					</svg>
					חזרה לפרוייקט
				</Link>
				<h1 className="text-2xl font-bold text-gray-900">עריכת אתר</h1>
				<p className="text-gray-500 text-sm mt-1">{site.name}</p>
			</div>
			<SiteForm
				site={{
					...site,
					startDate: site.startDate ? new Date(site.startDate) : null,
					endDate: site.endDate ? new Date(site.endDate) : null,
				}}
			/>
		</div>
	);
}
