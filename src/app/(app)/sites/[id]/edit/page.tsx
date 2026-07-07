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
				<div className="flex items-center gap-3 mb-1">
					<Link
						href={`/sites/${id}`}
						className="text-gray-400 hover:text-gray-600 transition-colors"
					>
						<svg
							aria-hidden="true"
							className="w-5 h-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M15 19l-7-7 7-7"
							/>
						</svg>
					</Link>
					<h1 className="text-2xl font-bold text-gray-900">עריכת אתר</h1>
				</div>
				<p className="text-gray-500 text-sm mr-8">{site.name}</p>
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
