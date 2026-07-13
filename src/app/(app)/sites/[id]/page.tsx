import AddTransactionForm from "@/components/AddTransactionForm";
import CompleteWorkButton from "@/components/CompleteWorkButton";
import DeleteSiteButton from "@/components/DeleteSiteButton";
import SiteTasksClient from "@/components/SiteTasksClient";
import TransactionsListClient from "@/components/TransactionsListClient";
import { getProfile, requireAuth } from "@/lib/auth";
import { getSiteById, getTasksBySite } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";

const statusLabel: Record<string, string> = {
	ACTIVE: "פעיל",
	COMPLETED: "הושלם",
	ON_HOLD: "מושהה",
};
const statusColor: Record<string, string> = {
	ACTIVE: "bg-green-100 text-green-700",
	COMPLETED: "bg-blue-100 text-blue-700",
	ON_HOLD: "bg-yellow-100 text-yellow-700",
};

function formatCurrency(amount: number) {
	return new Intl.NumberFormat("he-IL", {
		style: "currency",
		currency: "ILS",
		maximumFractionDigits: 0,
	}).format(amount);
}


export default async function SitePage({
	params,
}: { params: Promise<{ id: string }> }) {
	await requireAuth();
	const profile = await getProfile();
	const { id } = await params;

	const site = await getSiteById(id);
	if (!site) notFound();

	const tasks = await getTasksBySite(id);

	const VAT = 0.18;
	const transactions = site.transactions || [];
	const txIncome = transactions
		.filter((t) => t.type === "INCOME")
		.reduce((s, t) => s + t.amount, 0);
	const incomeNet = (site.contractValue || 0) + txIncome;
	const income = incomeNet * (1 + VAT);
	const expense = transactions
		.filter((t) => t.type === "EXPENSE")
		.reduce((s, t) => s + t.amount, 0);
	const balance = income - expense;
	const isAdmin = profile?.role === "ADMIN" || profile?.isSuperAdmin === true;

	return (
		<div className="p-4 sm:p-6 lg:p-8">
			<div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5 sm:mb-8">
				<div>
					<div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
						<Link href="/sites" className="text-gray-400 hover:text-gray-600">
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
						<h1 className="text-xl sm:text-2xl font-bold text-gray-900">
							{site.name}
						</h1>
						<span
							className={`text-xs font-medium px-2 py-1 rounded-lg ${statusColor[site.status]}`}
						>
							{statusLabel[site.status]}
						</span>
					</div>
					{site.location && (
						<p className="text-gray-500 text-sm sm:mr-8">{site.location}</p>
					)}
				</div>
				<div className="flex gap-2 flex-shrink-0 flex-wrap">
					{site.status === "ACTIVE" && (
						<CompleteWorkButton siteId={site.id} createdAt={site.createdAt} />
					)}
					{isAdmin && (
						<>
							<Link
								href={`/sites/${site.id}/edit`}
								className="flex items-center gap-1.5 border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium px-3 py-2 rounded-xl transition-colors text-sm"
							>
								<svg
									aria-hidden="true"
									className="w-4 h-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
									/>
								</svg>
								עריכה
							</Link>
							<DeleteSiteButton siteId={site.id} />
						</>
					)}
				</div>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-8">
				<div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
					<p className="text-gray-400 text-xs mb-1">הכנסות כולל מע״מ</p>
					<p className="text-xl sm:text-2xl font-bold text-green-600">
						{formatCurrency(income)}
					</p>
					<p className="text-xs text-gray-400 mt-0.5">
						מע״מ: {formatCurrency(incomeNet * VAT)}
					</p>
				</div>
				<div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
					<p className="text-gray-400 text-xs mb-1">הוצאות</p>
					<p className="text-xl sm:text-2xl font-bold text-red-600">
						{formatCurrency(expense)}
					</p>
				</div>
				<div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
					<p className="text-gray-400 text-xs mb-1">יתרה</p>
					<p
						className={`text-xl sm:text-2xl font-bold ${balance >= 0 ? "text-green-700" : "text-red-700"}`}
					>
						{formatCurrency(balance)}
					</p>
				</div>
			</div>

			{(site.clientName ||
				site.contractValue ||
				site.description ||
				site.workOrderUrl) && (
				<div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 mb-4 sm:mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
					{site.clientName && (
						<div>
							<p className="text-xs text-gray-400 mb-0.5">שם לקוח</p>
							<p className="text-sm font-medium text-gray-900">
								{site.clientName}
							</p>
						</div>
					)}
					{site.contractValue && (
						<div>
							<p className="text-xs text-gray-400 mb-0.5">ערך חוזה</p>
							<p className="text-sm font-medium text-gray-900">
								{formatCurrency(site.contractValue)}
							</p>
						</div>
					)}
					{site.workOrderUrl && (
						<div>
							<p className="text-xs text-gray-400 mb-0.5">הזמנת עבודה</p>
							<a
								href={site.workOrderUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
							>
								<svg
									aria-hidden="true"
									className="w-4 h-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
									/>
								</svg>
								פתיחת הזמנה
							</a>
						</div>
					)}
					{site.description && (
						<div className="sm:col-span-3">
							<p className="text-xs text-gray-400 mb-0.5">תיאור</p>
							<p className="text-sm text-gray-600">{site.description}</p>
						</div>
					)}
				</div>
			)}

			<div className="mb-4 sm:mb-6">
				<SiteTasksClient tasks={tasks} siteId={site.id} isAdmin={isAdmin} />
			</div>

			<div className="mb-4 sm:mb-6">
				<AddTransactionForm siteId={site.id} />
			</div>

			<TransactionsListClient transactions={transactions} isAdmin={isAdmin} />
		</div>
	);
}
