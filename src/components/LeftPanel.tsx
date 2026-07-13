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

function NavIcon({ d }: { d: string }) {
	return (
		<svg className="w-[17px] h-[17px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={d} />
		</svg>
	);
}

const socialItems = [
	{ href: "/feed", label: "פיד פורטפוליו", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
	{ href: "/marketplace", label: "שוק", icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" },
	{ href: "/directory", label: "ספריית מקצוענים", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
	{ href: "/messages", label: "הודעות", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
];

const internalItems = [
	{ href: "/dashboard", label: "לוח בקרה", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
	{ href: "/sites", label: "אתרי עבודה", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
	{ href: "/transactions", label: "הכנסות והוצאות", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
	{ href: "/expenses", label: "הוצאות", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
	{ href: "/equipment", label: "ציוד", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
	{ href: "/collection", label: "גבייה", icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" },
	{ href: "/fuel", label: "דלק ותדלוקים", icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" },
	{ href: "/tasks", label: "משימות", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
	{ href: "/reports", label: "דוחות", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
	{ href: "/documents", label: "מסמכים", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
	{ href: "/subscriptions", label: "מנויים וטיפולים", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
	{ href: "/project", label: "ניהול פרוייקט", icon: "M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" },
	{ href: "/whatsapp", label: "WhatsApp", icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" },
];

const adminItems = [
	{ href: "/admin/activity", label: "מעקב פעילות", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
	{ href: "/admin/users", label: "ניהול משתמשים", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
];

function NavItem({ href, label, icon, active }: { href: string; label: string; icon: string; active: boolean }) {
	return (
		<Link
			href={href}
			className={`flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] transition-all duration-150 mb-0.5 group ${
				active
					? "bg-green-600 text-white font-semibold shadow-sm"
					: "text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium"
			}`}
		>
			<span className={active ? "text-white/90" : "text-gray-400 group-hover:text-gray-500 transition-colors"}>
				<NavIcon d={icon} />
			</span>
			<span className="truncate">{label}</span>
		</Link>
	);
}

function SectionLabel({ label }: { label: string }) {
	return (
		<p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2.5 mb-1.5 mt-1">
			{label}
		</p>
	);
}

export default function LeftPanel({ profile }: { profile: Profile }) {
	const pathname = usePathname();
	const role = (profile as { role?: string } | null)?.role;

	const userRoleLabel =
		profile?.userRole === "GC"
			? "קבלן ראשי"
			: profile?.userRole === "SUB"
				? "קבלן משנה"
				: role === "ADMIN" ? "מנהל" : role === "MANAGER" ? "מנהל" : "עובד";

	return (
		<aside
			className="hidden lg:flex w-56 xl:w-60 flex-col h-[calc(100vh-56px)] sticky top-14 overflow-y-auto bg-white border-l border-gray-100"
			dir="rtl"
		>
			<div className="flex-1 px-2 pt-2 pb-4">
				{/* Profile */}
				<Link
					href="/profile"
					className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group mb-3"
				>
					<div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center flex-shrink-0 shadow ring-2 ring-green-100">
						{profile?.avatarUrl ? (
							<img src={profile.avatarUrl} className="w-full h-full rounded-full object-cover" alt="" />
						) : (
							<span className="text-white font-bold text-xs">
								{profile?.name?.charAt(0)?.toUpperCase() || "?"}
							</span>
						)}
					</div>
					<div className="flex-1 min-w-0">
						<p className="font-semibold text-gray-900 text-[13px] truncate leading-tight">{profile?.name}</p>
						<p className="text-[11px] text-gray-400 truncate">{userRoleLabel}</p>
					</div>
					<svg className="w-3 h-3 text-gray-300 group-hover:text-gray-400 flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
					</svg>
				</Link>

				{/* Social */}
				<SectionLabel label="BuildersBooks" />
				{socialItems.map((item) => (
					<NavItem key={item.href} href={item.href} label={item.label} icon={item.icon}
						active={pathname === item.href || pathname.startsWith(`${item.href}/`)} />
				))}

				<div className="h-px bg-gray-100 my-3" />

				{/* Internal */}
				<SectionLabel label="ניהול פנימי" />
				{internalItems.map((item) => (
					<NavItem key={item.href} href={item.href} label={item.label} icon={item.icon}
						active={pathname === item.href || pathname.startsWith(`${item.href}/`)} />
				))}

				{role === "ADMIN" && (
					<>
						<div className="h-px bg-gray-100 my-3" />
						<SectionLabel label="מערכת" />
						{adminItems.map((item) => (
							<NavItem key={item.href} href={item.href} label={item.label} icon={item.icon}
								active={pathname === item.href} />
						))}
					</>
				)}
			</div>

			<div className="px-4 py-2.5 border-t border-gray-100">
				<p className="text-[10px] text-gray-300 text-center">© 2026 BuildersBooks</p>
			</div>
		</aside>
	);
}
