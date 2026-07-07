import EquipmentForm from "@/components/EquipmentForm";
import { requireAuth } from "@/lib/auth";
import Link from "next/link";

export default async function NewEquipmentPage() {
	await requireAuth();
	return (
		<div className="p-4 sm:p-6 lg:p-8 max-w-2xl">
			<div className="mb-5 sm:mb-8">
				<Link
					href="/equipment"
					className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-3 group"
				>
					<svg
						aria-hidden="true"
						className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
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
					חזרה לציוד
				</Link>
				<h1 className="text-2xl font-bold text-gray-900">כלי חדש</h1>
				<p className="text-gray-500 text-sm mt-1">הוסף ציוד לניהול</p>
			</div>
			<EquipmentForm />
		</div>
	);
}
