"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

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
	{
		href: "/feed",
		label: "בית",
		icon: (active: boolean) => (
			<svg
				aria-hidden="true"
				className={`w-6 h-6 ${active ? "text-green-600" : "text-gray-500"}`}
				fill={active ? "currentColor" : "none"}
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={active ? 0 : 2}
					d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
				/>
				{active && (
					<path fill="currentColor" d="M10 20v-6h4v6h5v-8l-7-7-7 7v8z" />
				)}
			</svg>
		),
	},
	{
		href: "/marketplace",
		label: "שוק",
		icon: (active: boolean) => (
			<svg
				aria-hidden="true"
				className={`w-6 h-6 ${active ? "text-green-600" : "text-gray-500"}`}
				fill={active ? "currentColor" : "none"}
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
				/>
			</svg>
		),
	},
	{
		href: "/directory",
		label: "אנשי מקצוע",
		icon: (active: boolean) => (
			<svg
				aria-hidden="true"
				className={`w-6 h-6 ${active ? "text-green-600" : "text-gray-500"}`}
				fill={active ? "currentColor" : "none"}
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
				/>
			</svg>
		),
	},
	{
		href: "/messages",
		label: "הודעות",
		icon: (active: boolean) => (
			<svg
				aria-hidden="true"
				className={`w-6 h-6 ${active ? "text-green-600" : "text-gray-500"}`}
				fill={active ? "currentColor" : "none"}
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
				/>
			</svg>
		),
	},
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
			if (ref.current && !ref.current.contains(e.target as Node))
				setOpen(false);
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
			setNotifications((prev) =>
				prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)),
			);
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

	return (
		<div className="relative" ref={ref}>
			<button
				type="button"
				aria-label="התראות"
				onClick={() => setOpen((o) => !o)}
				className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-colors ${open ? "bg-green-100" : "bg-gray-100 hover:bg-gray-200"}`}
			>
				<svg
					aria-hidden="true"
					className={`w-5 h-5 ${open ? "text-green-600" : "text-gray-700"}`}
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
					/>
				</svg>
				{unreadCount > 0 && (
					<span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center border-2 border-white">
						{unreadCount > 9 ? "9+" : unreadCount}
					</span>
				)}
			</button>

			{open && (
				<div
					className="absolute top-12 left-0 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
					dir="rtl"
				>
					<div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
						<p className="font-bold text-gray-900 text-lg">התראות</p>
						{unreadCount > 0 && (
							<button
								type="button"
								onClick={markAll}
								className="text-xs text-green-600 hover:text-green-700 font-medium"
							>
								סמן הכל כנקרא
							</button>
						)}
					</div>
					<div className="max-h-96 overflow-y-auto">
						{notifications.length === 0 ? (
							<div className="text-center py-10 text-gray-400 text-sm">
								אין התראות
							</div>
						) : (
							notifications.map((notif) => (
								<button
									type="button"
									key={notif.id}
									onClick={() => handleNotifClick(notif)}
									className={`w-full text-right px-5 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${!notif.isRead ? "bg-green-50/50" : ""}`}
								>
									<div className="flex items-start gap-3">
										<div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
											<span className="text-lg">
												{notif.type === "TRANSACTION_PENDING"
													? "⏳"
													: notif.type === "TRANSACTION_APPROVED"
														? "✅"
														: "🔔"}
											</span>
										</div>
										<div className="flex-1 min-w-0">
											<p
												className={`text-sm font-semibold ${!notif.isRead ? "text-gray-900" : "text-gray-600"}`}
											>
												{notif.title}
											</p>
											<p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
												{notif.body}
											</p>
											<p
												className={`text-xs mt-1 font-medium ${!notif.isRead ? "text-green-600" : "text-gray-400"}`}
											>
												{timeAgo(notif.createdAt)}
											</p>
										</div>
										{!notif.isRead && (
											<div className="w-2.5 h-2.5 bg-green-500 rounded-full flex-shrink-0 mt-2" />
										)}
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
			if (ref.current && !ref.current.contains(e.target as Node))
				setOpen(false);
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
				className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center hover:opacity-90 transition-opacity ring-2 ring-transparent hover:ring-green-300 flex-shrink-0"
			>
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
			</button>
			{open && (
				<div
					className="absolute top-12 left-0 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
					dir="rtl"
				>
					<Link
						href="/profile"
						onClick={() => setOpen(false)}
						className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-100"
					>
						<div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center flex-shrink-0">
							<span className="text-white font-bold text-sm">
								{profile?.name?.charAt(0)?.toUpperCase() || "?"}
							</span>
						</div>
						<div>
							<p className="font-semibold text-gray-900 text-sm">
								{profile?.name}
							</p>
							<p className="text-xs text-gray-400">הצג פרופיל</p>
						</div>
					</Link>
					<div className="p-2">
						<button
							type="button"
							onClick={handleLogout}
							className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
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
									d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
								/>
							</svg>
							התנתק
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

export default function TopNav({ profile }: { profile: Profile }) {
	const pathname = usePathname();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	const socialPaths = [
		"/feed",
		"/marketplace",
		"/directory",
		"/messages",
		"/professionals",
	];
	const isOnSocialPage = socialPaths.some((p) => pathname.startsWith(p));

	return (
		<>
			<header
				className="fixed top-0 right-0 left-0 z-40 bg-white border-b border-gray-200 h-14 shadow-sm"
				dir="rtl"
			>
				<div className="h-full flex items-center px-2 sm:px-4 gap-2">
					{/* Logo */}
					<Link
						href="/feed"
						className="flex items-center gap-2 flex-shrink-0 mr-1"
					>
						<div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
							<svg
								aria-hidden="true"
								className="w-5 h-5 text-white"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
								/>
							</svg>
						</div>
						<span className="hidden sm:block font-bold text-gray-900 text-lg">
							BuildersBooks
						</span>
					</Link>

					{/* Search */}
					<div className="hidden md:flex items-center bg-gray-100 rounded-full px-4 py-2 gap-2 w-52 mr-2">
						<svg
							aria-hidden="true"
							className="w-4 h-4 text-gray-400 flex-shrink-0"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
							/>
						</svg>
						<input
							placeholder="חיפוש"
							className="bg-transparent text-sm outline-none w-full text-gray-700 placeholder-gray-400"
						/>
					</div>

					{/* Center nav - social */}
					<nav className="hidden lg:flex items-center flex-1 justify-center gap-1">
						{socialNavItems.map((item) => {
							const active =
								pathname === item.href || pathname.startsWith(`${item.href}/`);
							return (
								<Link
									key={item.href}
									href={item.href}
									className={`relative flex items-center justify-center w-28 xl:w-36 h-12 rounded-xl transition-colors group ${active ? "text-green-600" : "text-gray-500 hover:bg-gray-100"}`}
								>
									{item.icon(active)}
									{active && (
										<div className="absolute bottom-0 left-3 right-3 h-0.5 bg-green-600 rounded-full" />
									)}
									<span className="sr-only">{item.label}</span>
								</Link>
							);
						})}
					</nav>

					{/* Right icons */}
					<div className="flex items-center gap-1.5 mr-auto">
						{/* Internal tools button */}
						<button
							type="button"
							onClick={() => setMobileMenuOpen((v) => !v)}
							className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-700 transition-colors"
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
									d="M4 6h16M4 12h16M4 18h7"
								/>
							</svg>
							<span className="hidden sm:block text-xs">ניהול</span>
						</button>

						<NotificationBell />
						<ProfileMenu profile={profile} />
					</div>
				</div>
			</header>

			{/* Internal tools drawer */}
			{mobileMenuOpen && (
				<>
					<div
						className="fixed inset-0 z-50 bg-black/40"
						role="button"
						tabIndex={0}
						aria-label="סגור תפריט"
						onClick={() => setMobileMenuOpen(false)}
						onKeyDown={(e) =>
							e.key === "Enter" || e.key === " "
								? setMobileMenuOpen(false)
								: undefined
						}
					/>
					<div
						className="fixed top-14 right-0 w-72 bg-white shadow-2xl z-50 rounded-bl-2xl overflow-hidden border-l border-gray-100"
						dir="rtl"
					>
						<InternalMenu
							onClose={() => setMobileMenuOpen(false)}
							profile={profile}
							pathname={pathname}
						/>
					</div>
				</>
			)}

			{/* Mobile bottom nav */}
			<nav
				className="lg:hidden fixed bottom-0 right-0 left-0 z-40 bg-white border-t border-gray-200 flex"
				dir="rtl"
			>
				{socialNavItems.map((item) => {
					const active =
						pathname === item.href || pathname.startsWith(`${item.href}/`);
					return (
						<Link
							key={item.href}
							href={item.href}
							className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${active ? "text-green-600" : "text-gray-500"}`}
						>
							{item.icon(active)}
							<span className="text-[9px] font-medium">{item.label}</span>
						</Link>
					);
				})}
				<button
					type="button"
					onClick={() => setMobileMenuOpen((v) => !v)}
					className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-gray-500"
				>
					<svg
						aria-hidden="true"
						className="w-6 h-6"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M4 6h16M4 12h16M4 18h16"
						/>
					</svg>
					<span className="text-[9px] font-medium">עוד</span>
				</button>
			</nav>
		</>
	);
}

const internalNavItems = [
	{ href: "/dashboard", label: "לוח בקרה", emoji: "🏠" },
	{ href: "/sites", label: "אתרי עבודה", emoji: "🏗️" },
	{ href: "/expenses", label: "הוצאות", emoji: "💳" },
	{ href: "/transactions", label: "הכנסות והוצאות", emoji: "💰" },
	{ href: "/equipment", label: "ציוד", emoji: "⚙️" },
	{ href: "/whatsapp", label: "WhatsApp", emoji: "📱" },
	{ href: "/collection", label: "גבייה", emoji: "🏦" },
	{ href: "/fuel", label: "דלק ותדלוקים", emoji: "⛽" },
	{ href: "/subscriptions", label: "מנויים וטיפולים", emoji: "📋" },
	{ href: "/tasks", label: "משימות", emoji: "✅" },
	{ href: "/reports", label: "דוחות", emoji: "📊" },
	{ href: "/documents", label: "מסמכים", emoji: "📄" },
	{ href: "/project", label: "ניהול פרוייקט", emoji: "📐" },
];

function InternalMenu({
	onClose,
	profile,
	pathname,
}: { onClose: () => void; profile: Profile; pathname: string }) {
	return (
		<div className="p-3 max-h-[85vh] overflow-y-auto">
			<p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">
				ניהול פנימי
			</p>
			<div className="grid grid-cols-2 gap-1.5">
				{internalNavItems.map((item) => {
					const active = pathname.startsWith(item.href);
					return (
						<Link
							key={item.href}
							href={item.href}
							onClick={onClose}
							className={`flex items-center gap-2.5 px-3 py-3 rounded-xl transition-colors ${active ? "bg-green-50 text-green-700" : "hover:bg-gray-50 text-gray-700"}`}
						>
							<span className="text-xl">{item.emoji}</span>
							<span className="text-xs font-medium leading-tight">
								{item.label}
							</span>
						</Link>
					);
				})}
			</div>
			{(profile as { role?: string } | null)?.role === "ADMIN" && (
				<>
					<p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 mt-4 mb-2">
						ניהול
					</p>
					<div className="grid grid-cols-2 gap-1.5">
						<Link
							href="/admin/activity"
							onClick={onClose}
							className="flex items-center gap-2.5 px-3 py-3 rounded-xl hover:bg-gray-50 text-gray-700"
						>
							<span className="text-xl">📈</span>
							<span className="text-xs font-medium">מעקב פעילות</span>
						</Link>
						<Link
							href="/admin/users"
							onClick={onClose}
							className="flex items-center gap-2.5 px-3 py-3 rounded-xl hover:bg-gray-50 text-gray-700"
						>
							<span className="text-xl">👥</span>
							<span className="text-xs font-medium">ניהול משתמשים</span>
						</Link>
					</div>
				</>
			)}
		</div>
	);
}
