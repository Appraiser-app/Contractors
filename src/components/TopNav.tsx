"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import GlobalSearch from "./GlobalSearch";

type Profile = {
	id: string;
	name: string;
	email: string;
	role: string;
	avatarUrl?: string | null;
} | null;

type Notification = {
	id: string;
	type: string;
	title: string;
	body: string;
	relatedId: string | null;
	isRead: boolean;
	createdAt: string;
};

const socialNavItems = [
	{ href: "/feed", label: "פיד", shortLabel: "פיד" },
	{ href: "/marketplace", label: "שוק", shortLabel: "שוק" },
	{ href: "/directory", label: "אנשי מקצוע", shortLabel: "מקצוע" },
	{ href: "/messages", label: "הודעות", shortLabel: "הודעות" },
];

const internalNavItems = [
	{ href: "/dashboard", label: "לוח בקרה" },
	{ href: "/sites", label: "אתרי עבודה" },
	{ href: "/transactions", label: "הכנסות והוצאות" },
	{ href: "/expenses", label: "הוצאות" },
	{ href: "/equipment", label: "ציוד" },
	{ href: "/collection", label: "גבייה" },
	{ href: "/fuel", label: "דלק" },
	{ href: "/tasks", label: "משימות" },
	{ href: "/reports", label: "דוחות" },
	{ href: "/documents", label: "מסמכים" },
	{ href: "/subscriptions", label: "מנויים" },
	{ href: "/project", label: "ניהול פרוייקט" },
	{ href: "/whatsapp", label: "WhatsApp" },
];

function NotificationBell() {
	const [open, setOpen] = useState(false);
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const ref = useRef<HTMLDivElement>(null);
	const router = useRouter();

	const load = useCallback(async () => {
		const res = await fetch("/api/notifications");
		if (res.ok) {
			const data = await res.json();
			setNotifications(data.notifications);
			setUnreadCount(data.unreadCount);
		}
	}, []);

	useEffect(() => {
		load();
		const interval = setInterval(load, 30000);
		return () => clearInterval(interval);
	}, [load]);

	useEffect(() => {
		function handleClick(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
		}
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, []);

	async function markAll() {
		await fetch("/api/notifications", {
			method: "PATCH",
			body: JSON.stringify({ markAll: true }),
			headers: { "Content-Type": "application/json" },
		});
		setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
		setUnreadCount(0);
	}

	async function handleNotifClick(notif: Notification) {
		if (!notif.isRead) {
			await fetch("/api/notifications", {
				method: "PATCH",
				body: JSON.stringify({ id: notif.id }),
				headers: { "Content-Type": "application/json" },
			});
			setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)));
			setUnreadCount((prev) => Math.max(0, prev - 1));
		}
		setOpen(false);
		if (notif.relatedId) router.push("/transactions");
	}

	function timeAgo(dateStr: string) {
		const diff = Date.now() - new Date(dateStr).getTime();
		const m = Math.floor(diff / 60000);
		if (m < 1) return "עכשיו";
		if (m < 60) return `לפני ${m}ד'`;
		const h = Math.floor(m / 60);
		if (h < 24) return `לפני ${h}ש'`;
		return `לפני ${Math.floor(h / 24)} ימים`;
	}

	const typeIcon: Record<string, string> = {
		TRANSACTION_PENDING: "⏳",
		TRANSACTION_APPROVED: "✅",
		TRANSACTION_REJECTED: "❌",
	};

	return (
		<div className="relative" ref={ref}>
			<button
				type="button"
				aria-label="התראות"
				onClick={() => setOpen((o) => !o)}
				className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all ${
					open ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
				}`}
			>
				<svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
				</svg>
				{unreadCount > 0 && (
					<span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center border-2 border-white">
						{unreadCount > 9 ? "9+" : unreadCount}
					</span>
				)}
			</button>

			{open && (
				<div className="absolute top-11 left-0 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden" dir="rtl">
					<div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 bg-gray-50/50">
						<div className="flex items-center gap-2">
							<p className="font-bold text-gray-900 text-sm">התראות</p>
							{unreadCount > 0 && (
								<span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
							)}
						</div>
						{unreadCount > 0 && (
							<button type="button" onClick={markAll} className="text-xs text-green-600 hover:text-green-700 font-semibold">
								סמן הכל כנקרא
							</button>
						)}
					</div>
					<div className="max-h-80 overflow-y-auto">
						{notifications.length === 0 ? (
							<div className="text-center py-10 text-gray-400">
								<svg className="w-8 h-8 mx-auto mb-2 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
								</svg>
								<p className="text-sm">אין התראות</p>
							</div>
						) : (
							notifications.map((notif) => (
								<button
									type="button"
									key={notif.id}
									onClick={() => handleNotifClick(notif)}
									className={`w-full text-right px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${!notif.isRead ? "bg-green-50/40" : ""}`}
								>
									<div className="flex items-start gap-3">
										<div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-sm">
											{typeIcon[notif.type] || "🔔"}
										</div>
										<div className="flex-1 min-w-0">
											<p className={`text-xs font-semibold leading-snug ${!notif.isRead ? "text-gray-900" : "text-gray-600"}`}>
												{notif.title}
											</p>
											<p className="text-xs text-gray-400 mt-0.5 leading-relaxed line-clamp-2">{notif.body}</p>
											<p className={`text-[10px] mt-1 font-medium ${!notif.isRead ? "text-green-600" : "text-gray-300"}`}>
												{timeAgo(notif.createdAt)}
											</p>
										</div>
										{!notif.isRead && <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-2" />}
									</div>
								</button>
							))
						)}
					</div>
				</div>
			)}
		</div>
	);
}

function ProfileMenu({ profile }: { profile: Profile }) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const router = useRouter();

	useEffect(() => {
		function handleClick(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
		}
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, []);

	async function handleLogout() {
		await fetch("/api/auth/signout", { method: "POST" });
		router.push("/login");
	}

	return (
		<div className="relative" ref={ref}>
			<button
				type="button"
				aria-label="תפריט פרופיל"
				onClick={() => setOpen((o) => !o)}
				className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center hover:opacity-90 transition-opacity ring-2 ring-transparent hover:ring-green-200 shadow-sm"
			>
				{profile?.avatarUrl ? (
					<img src={profile.avatarUrl} className="w-full h-full rounded-full object-cover" alt="" />
				) : (
					<span className="text-white font-bold text-[13px]">
						{profile?.name?.charAt(0)?.toUpperCase() || "?"}
					</span>
				)}
			</button>

			{open && (
				<div className="absolute top-11 left-0 w-60 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden" dir="rtl">
					<div className="px-4 py-3.5 border-b border-gray-100 bg-gray-50/50">
						<p className="font-semibold text-gray-900 text-sm">{profile?.name}</p>
						<p className="text-xs text-gray-400 mt-0.5">{profile?.email}</p>
					</div>
					<div className="p-2">
						<Link
							href="/profile"
							onClick={() => setOpen(false)}
							className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium"
						>
							<svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
							</svg>
							הצג פרופיל
						</Link>
						<button
							type="button"
							onClick={handleLogout}
							className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors font-medium mt-0.5"
						>
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
							</svg>
							התנתק
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

function InternalMenu({ onClose, profile, pathname }: { onClose: () => void; profile: Profile; pathname: string }) {
	return (
		<div className="p-3 max-h-[80vh] overflow-y-auto">
			<p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-2">ניהול פנימי</p>
			<div className="grid grid-cols-2 gap-1">
				{internalNavItems.map((item) => {
					const active = pathname.startsWith(item.href);
					return (
						<Link
							key={item.href}
							href={item.href}
							onClick={onClose}
							className={`px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
								active ? "bg-green-600 text-white" : "text-gray-700 hover:bg-gray-50"
							}`}
						>
							{item.label}
						</Link>
					);
				})}
			</div>
			{(profile as { role?: string } | null)?.role === "ADMIN" && (
				<>
					<p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mt-4 mb-2">מערכת</p>
					<div className="grid grid-cols-2 gap-1">
						{[
							{ href: "/admin/activity", label: "מעקב פעילות" },
							{ href: "/admin/users", label: "ניהול משתמשים" },
						].map((item) => (
							<Link
								key={item.href}
								href={item.href}
								onClick={onClose}
								className="px-3 py-2.5 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
							>
								{item.label}
							</Link>
						))}
					</div>
				</>
			)}
		</div>
	);
}

export default function TopNav({ profile }: { profile: Profile }) {
	const pathname = usePathname();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	return (
		<>
			<header className="fixed top-0 right-0 left-0 z-40 bg-white border-b border-gray-200 h-14" dir="rtl">
				<div className="h-full flex items-center px-3 sm:px-4 gap-2">
					{/* Logo */}
					<Link href="/feed" className="flex items-center gap-2 flex-shrink-0 mr-1">
						<div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
							<svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
							</svg>
						</div>
						<span className="hidden sm:block font-bold text-gray-900 text-[15px] tracking-tight">BuildersBooks</span>
					</Link>

					{/* Center nav - social tabs */}
					<nav className="hidden lg:flex items-center flex-1 justify-center">
						{socialNavItems.map((item) => {
							const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
							return (
								<Link
									key={item.href}
									href={item.href}
									className={`relative flex items-center justify-center px-5 h-14 text-sm font-semibold transition-colors ${
										active ? "text-green-600" : "text-gray-500 hover:text-gray-900"
									}`}
								>
									{item.label}
									{active && <div className="absolute bottom-0 left-2 right-2 h-[2.5px] bg-green-600 rounded-t-full" />}
								</Link>
							);
						})}
					</nav>

					{/* Right side */}
					<div className="flex items-center gap-1.5 mr-auto">
						{/* Global Search */}
						<GlobalSearch />

						{/* Management button */}
						<button
							type="button"
							onClick={() => setMobileMenuOpen((v) => !v)}
							className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold transition-all ${
								mobileMenuOpen
									? "bg-green-600 text-white"
									: "bg-gray-100 text-gray-700 hover:bg-gray-200"
							}`}
						>
							<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h7"} />
							</svg>
							<span className="hidden sm:block">ניהול</span>
						</button>

						<NotificationBell />
						<ProfileMenu profile={profile} />
					</div>
				</div>
			</header>

			{/* Internal tools panel */}
			{mobileMenuOpen && (
				<>
					<div
						className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px]"
						role="button"
						tabIndex={0}
						aria-label="סגור תפריט"
						onClick={() => setMobileMenuOpen(false)}
						onKeyDown={(e) => (e.key === "Enter" || e.key === " ") ? setMobileMenuOpen(false) : undefined}
					/>
					<div className="fixed top-14 right-0 w-72 bg-white shadow-2xl z-40 rounded-bl-2xl border-b border-l border-gray-100" dir="rtl">
						<InternalMenu onClose={() => setMobileMenuOpen(false)} profile={profile} pathname={pathname} />
					</div>
				</>
			)}

			{/* Mobile bottom nav */}
			<nav className="lg:hidden fixed bottom-0 right-0 left-0 z-40 bg-white border-t border-gray-100 flex safe-area-inset-bottom" dir="rtl">
				{socialNavItems.map((item) => {
					const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
					return (
						<Link
							key={item.href}
							href={item.href}
							className={`flex-1 flex flex-col items-center justify-center py-2.5 transition-colors ${
								active ? "text-green-600" : "text-gray-400"
							}`}
						>
							<div className={`w-6 h-0.5 rounded-full mb-1.5 transition-all ${active ? "bg-green-600" : "bg-transparent"}`} />
							<span className="text-[11px] font-semibold">{item.shortLabel}</span>
						</Link>
					);
				})}
				<button
					type="button"
					onClick={() => setMobileMenuOpen((v) => !v)}
					className="flex-1 flex flex-col items-center justify-center py-2.5 text-gray-400"
				>
					<div className="w-6 h-0.5 rounded-full mb-1.5 bg-transparent" />
					<span className="text-[11px] font-semibold">עוד</span>
				</button>
			</nav>
		</>
	);
}
