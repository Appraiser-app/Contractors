"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Profile = {
	id: string;
	name: string;
	email: string;
	role: string;
	avatarUrl?: string | null;
	trade?: string | null;
	userRole?: string;
} | null;

const socialItems = [
	{ href: "/feed", label: "פיד פורטפוליו", emoji: "🏠" },
	{ href: "/marketplace", label: "שוק", emoji: "🛒" },
	{ href: "/directory", label: "ספריית מקצוענים", emoji: "👷" },
	{ href: "/messages", label: "הודעות", emoji: "💬" },
];

const internalItems = [
	{ href: "/dashboard", label: "לוח בקרה", emoji: "🏠" },
	{ href: "/sites", label: "אתרי עבודה", emoji: "🏗️" },
	{ href: "/expenses", label: "הוצאות", emoji: "💳" },
	{ href: "/transactions", label: "הכנסות והוצאות", emoji: "💰" },
	{ href: "/equipment", label: "ציוד", emoji: "⚙️" },
	{ href: "/collection", label: "גבייה", emoji: "🏦" },
	{ href: "/fuel", label: "דלק", emoji: "⛽" },
	{ href: "/tasks", label: "משימות", emoji: "✅" },
	{ href: "/reports", label: "דוחות", emoji: "📊" },
	{ href: "/documents", label: "מסמכים", emoji: "📄" },
	{ href: "/subscriptions", label: "מנויים", emoji: "📋" },
	{ href: "/project", label: "ניהול פרוייקט", emoji: "📐" },
	{ href: "/whatsapp", label: "WhatsApp", emoji: "📱" },
];

export default function LeftPanel({ profile }: { profile: Profile }) {
	const pathname = usePathname();

	const userRoleLabel =
		profile?.userRole === "GC"
			? "קבלן ראשי"
			: profile?.userRole === "SUB"
				? "קבלן משנה"
				: "משתמש";

	return (
		<aside
			className="hidden lg:flex w-64 xl:w-72 flex-col h-[calc(100vh-56px)] sticky top-14 overflow-y-auto pb-8 pt-3 px-2"
			dir="rtl"
		>
			{/* Profile card */}
			<Link
				href="/profile"
				className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white transition-colors group mb-1"
			>
				<div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center flex-shrink-0 shadow-sm">
					{profile?.avatarUrl ? (
						<img
							src={profile.avatarUrl}
							className="w-full h-full rounded-full object-cover"
							alt=""
						/>
					) : (
						<span className="text-white font-bold text-sm">
							{profile?.name?.charAt(0)?.toUpperCase() || "?"}
						</span>
					)}
				</div>
				<div className="flex-1 min-w-0">
					<p className="font-semibold text-gray-900 text-sm truncate">
						{profile?.name}
					</p>
					<p className="text-xs text-gray-500 truncate">{userRoleLabel}</p>
				</div>
			</Link>

			{/* BuildersBooks section */}
			<div className="mt-2 mb-1">
				{socialItems.map((item) => {
					const active =
						pathname === item.href || pathname.startsWith(`${item.href}/`);
					return (
						<Link
							key={item.href}
							href={item.href}
							className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors mb-0.5 ${active ? "bg-green-50 text-green-700 font-semibold" : "text-gray-700 hover:bg-white"}`}
						>
							<span className="text-xl w-8 text-center">{item.emoji}</span>
							<span className="text-sm font-medium">{item.label}</span>
							{active && (
								<div className="mr-auto w-1.5 h-1.5 bg-green-500 rounded-full" />
							)}
						</Link>
					);
				})}
			</div>

			<div className="border-t border-gray-200 my-2" />

			{/* Internal tools section */}
			<p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
				ניהול פנימי
			</p>
			{internalItems.map((item) => {
				const active =
					pathname === item.href || pathname.startsWith(`${item.href}/`);
				return (
					<Link
						key={item.href}
						href={item.href}
						className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors mb-0.5 ${active ? "bg-green-50 text-green-700 font-semibold" : "text-gray-700 hover:bg-white"}`}
					>
						<span className="text-xl w-8 text-center">{item.emoji}</span>
						<span className="text-sm font-medium">{item.label}</span>
					</Link>
				);
			})}

			{(profile as { role?: string } | null)?.role === "ADMIN" && (
				<>
					<div className="border-t border-gray-200 my-2" />
					<p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
						ניהול
					</p>
					{[
						{ href: "/admin/activity", label: "מעקב פעילות", emoji: "📈" },
						{ href: "/admin/users", label: "ניהול משתמשים", emoji: "👥" },
					].map((item) => {
						const active = pathname === item.href;
						return (
							<Link
								key={item.href}
								href={item.href}
								className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors mb-0.5 ${active ? "bg-green-50 text-green-700 font-semibold" : "text-gray-700 hover:bg-white"}`}
							>
								<span className="text-xl w-8 text-center">{item.emoji}</span>
								<span className="text-sm font-medium">{item.label}</span>
							</Link>
						);
					})}
				</>
			)}

			<div className="mt-auto pt-3 border-t border-gray-200">
				<p className="text-xs text-gray-400 px-3">© 2026 BuildersBooks</p>
			</div>
		</aside>
	);
}
