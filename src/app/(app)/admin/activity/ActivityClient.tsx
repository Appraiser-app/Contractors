"use client";

import { useMemo, useState } from "react";

type Activity = {
	id: string;
	userId: string;
	userName: string;
	userEmail: string;
	action: string;
	resource: string;
	resourceId?: string | null;
	resourceName?: string | null;
	timestamp: string;
};

type User = {
	id: string;
	name: string;
	email: string;
	role: string;
};

const RESOURCE_ICONS: Record<string, string> = {
	site: "🏗️",
	expense: "💳",
	transaction: "💰",
	equipment: "🚜",
	auth: "🔐",
	document: "📄",
	task: "✅",
};

const RESOURCE_COLORS: Record<string, string> = {
	site: "bg-blue-100 text-blue-700",
	expense: "bg-red-100 text-red-700",
	transaction: "bg-green-100 text-green-700",
	equipment: "bg-amber-100 text-amber-700",
	auth: "bg-purple-100 text-purple-700",
	document: "bg-slate-100 text-slate-700",
	task: "bg-teal-100 text-teal-700",
};

const USER_COLORS = [
	"bg-blue-500",
	"bg-purple-500",
	"bg-green-500",
	"bg-amber-500",
	"bg-pink-500",
	"bg-teal-500",
	"bg-rose-500",
];

function userColor(name: string) {
	return USER_COLORS[(name.charCodeAt(0) || 0) % USER_COLORS.length];
}

function timeAgo(ts: string) {
	const diff = Date.now() - new Date(ts).getTime();
	const m = Math.floor(diff / 60000);
	if (m < 1) return "עכשיו";
	if (m < 60) return `לפני ${m} דק'`;
	const h = Math.floor(m / 60);
	if (h < 24) return `לפני ${h} שע'`;
	const d = Math.floor(h / 24);
	return `לפני ${d} ${d === 1 ? "יום" : "ימים"}`;
}

function formatDate(ts: string) {
	return new Date(ts).toLocaleString("he-IL", {
		day: "2-digit",
		month: "2-digit",
		year: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export default function ActivityClient({
	initialActivities,
	users,
}: { initialActivities: Activity[]; users: User[] }) {
	const [activities] = useState<Activity[]>(initialActivities);
	const [selectedUser, setSelectedUser] = useState<string>("all");
	const [selectedResource, setSelectedResource] = useState<string>("all");
	const [view, setView] = useState<"timeline" | "users">("timeline");

	const filtered = useMemo(() => {
		return activities.filter((a) => {
			if (selectedUser !== "all" && a.userId !== selectedUser) return false;
			if (selectedResource !== "all" && a.resource !== selectedResource)
				return false;
			return true;
		});
	}, [activities, selectedUser, selectedResource]);

	// Per-user stats
	const userStats = useMemo(() => {
		const map: Record<
			string,
			{
				userId: string;
				userName: string;
				userEmail: string;
				count: number;
				lastSeen: string;
				actions: Record<string, number>;
			}
		> = {};
		for (const a of activities) {
			if (!map[a.userId])
				map[a.userId] = {
					userId: a.userId,
					userName: a.userName,
					userEmail: a.userEmail,
					count: 0,
					lastSeen: a.timestamp,
					actions: {},
				};
			map[a.userId].count++;
			if (a.timestamp > map[a.userId].lastSeen)
				map[a.userId].lastSeen = a.timestamp;
			map[a.userId].actions[a.action] =
				(map[a.userId].actions[a.action] || 0) + 1;
		}
		return Object.values(map).sort((a, b) => b.count - a.count);
	}, [activities]);

	const resources = [...new Set(activities.map((a) => a.resource))];

	return (
		<div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
			{/* Header */}
			<div className="mb-6">
				<button
					type="button"
					onClick={() => window.history.back()}
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
					חזרה
				</button>
				<h1 className="text-2xl font-bold text-gray-900">
					מעקב פעילות משתמשים
				</h1>
				<p className="text-slate-500 text-sm mt-0.5">
					{activities.length} פעולות מוקלטות
				</p>
			</div>

			{/* Summary cards */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
				<div className="bg-white rounded-xl border border-slate-200 p-4">
					<p className="text-xs text-slate-500 mb-1">סה״כ פעולות</p>
					<p className="text-2xl font-bold text-slate-800">
						{activities.length}
					</p>
				</div>
				<div className="bg-white rounded-xl border border-slate-200 p-4">
					<p className="text-xs text-slate-500 mb-1">משתמשים פעילים</p>
					<p className="text-2xl font-bold text-green-700">
						{userStats.length}
					</p>
				</div>
				<div className="bg-white rounded-xl border border-slate-200 p-4">
					<p className="text-xs text-slate-500 mb-1">פעולות היום</p>
					<p className="text-2xl font-bold text-blue-700">
						{
							activities.filter(
								(a) =>
									new Date(a.timestamp).toDateString() ===
									new Date().toDateString(),
							).length
						}
					</p>
				</div>
				<div className="bg-white rounded-xl border border-slate-200 p-4">
					<p className="text-xs text-slate-500 mb-1">התחברויות</p>
					<p className="text-2xl font-bold text-purple-700">
						{activities.filter((a) => a.action === "התחבר").length}
					</p>
				</div>
			</div>

			{/* View toggle + filters */}
			<div className="flex flex-wrap items-center gap-3 mb-4">
				<div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
					<button
						onClick={() => setView("timeline")}
						className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${view === "timeline" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
					>
						ציר זמן
					</button>
					<button
						onClick={() => setView("users")}
						className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${view === "users" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
					>
						לפי משתמש
					</button>
				</div>

				{view === "timeline" && (
					<>
						<select
							value={selectedUser}
							onChange={(e) => setSelectedUser(e.target.value)}
							className="text-sm border border-slate-200 rounded-xl px-3 py-1.5 bg-white focus:outline-none focus:border-green-500"
						>
							<option value="all">כל המשתמשים</option>
							{userStats.map((u) => (
								<option key={u.userId} value={u.userId}>
									{u.userName}
								</option>
							))}
						</select>
						<select
							value={selectedResource}
							onChange={(e) => setSelectedResource(e.target.value)}
							className="text-sm border border-slate-200 rounded-xl px-3 py-1.5 bg-white focus:outline-none focus:border-green-500"
						>
							<option value="all">כל הפעולות</option>
							{resources.map((r) => (
								<option key={r} value={r}>
									{RESOURCE_ICONS[r] || "•"} {r}
								</option>
							))}
						</select>
						<span className="text-xs text-slate-400 mr-auto">
							{filtered.length} תוצאות
						</span>
					</>
				)}
			</div>

			{/* Timeline view */}
			{view === "timeline" && (
				<div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
					{filtered.length === 0 ? (
						<div className="text-center py-16">
							<p className="text-slate-400 text-sm">אין פעולות מוקלטות עדיין</p>
							<p className="text-slate-300 text-xs mt-1">
								פעולות יתחילו להיקלט ממשתמשים שיבצעו פעולות
							</p>
						</div>
					) : (
						<div className="divide-y divide-slate-50">
							{filtered.map((activity, i) => {
								const icon = RESOURCE_ICONS[activity.resource] || "•";
								const colorClass =
									RESOURCE_COLORS[activity.resource] ||
									"bg-slate-100 text-slate-600";
								const isFirst =
									i === 0 || filtered[i - 1].userId !== activity.userId;

								return (
									<div
										key={activity.id}
										className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
									>
										{/* Avatar */}
										<div
											className={`w-8 h-8 ${userColor(activity.userName)} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${!isFirst ? "opacity-0" : ""}`}
										>
											<span className="text-white text-xs font-bold">
												{(activity.userName || "?").charAt(0).toUpperCase()}
											</span>
										</div>

										{/* Content */}
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 flex-wrap">
												{isFirst && (
													<span className="text-sm font-semibold text-slate-800">
														{activity.userName}
													</span>
												)}
												<span
													className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorClass}`}
												>
													{icon} {activity.action}
												</span>
												{activity.resourceName && (
													<span className="text-sm text-slate-600 truncate max-w-[200px]">
														"{activity.resourceName}"
													</span>
												)}
											</div>
											{isFirst && (
												<p className="text-xs text-slate-400 mt-0.5" dir="ltr">
													{activity.userEmail}
												</p>
											)}
										</div>

										{/* Time */}
										<div className="text-right flex-shrink-0">
											<p className="text-xs text-slate-400">
												{timeAgo(activity.timestamp)}
											</p>
											<p className="text-[10px] text-slate-300">
												{formatDate(activity.timestamp)}
											</p>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			)}

			{/* Per-user view */}
			{view === "users" && (
				<div className="space-y-3">
					{userStats.length === 0 ? (
						<div className="bg-white rounded-xl border border-slate-200 text-center py-16">
							<p className="text-slate-400 text-sm">אין פעולות מוקלטות עדיין</p>
						</div>
					) : (
						userStats.map((u) => {
							const topActions = Object.entries(u.actions)
								.sort((a, b) => b[1] - a[1])
								.slice(0, 3);
							const matchedUser = users.find((usr) => usr.id === u.userId);
							return (
								<div
									key={u.userId}
									className="bg-white rounded-xl border border-slate-200 p-4"
								>
									<div className="flex items-start gap-3">
										<div
											className={`w-11 h-11 ${userColor(u.userName)} rounded-full flex items-center justify-center flex-shrink-0`}
										>
											<span className="text-white font-bold">
												{(u.userName || "?").charAt(0).toUpperCase()}
											</span>
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 flex-wrap">
												<span className="font-semibold text-slate-800">
													{u.userName}
												</span>
												{matchedUser && (
													<span
														className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${matchedUser.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-600"}`}
													>
														{matchedUser.role === "ADMIN" ? "מנהל" : "פקיד/ה"}
													</span>
												)}
												<span className="mr-auto text-xs text-slate-400">
													נראה לאחרונה {timeAgo(u.lastSeen)}
												</span>
											</div>
											<p className="text-xs text-slate-400 mt-0.5" dir="ltr">
												{u.userEmail}
											</p>

											<div className="mt-3 flex items-center gap-3 flex-wrap">
												<div className="flex items-center gap-1.5 bg-slate-100 rounded-lg px-3 py-1.5">
													<span className="text-lg font-bold text-slate-800">
														{u.count}
													</span>
													<span className="text-xs text-slate-500">
														פעולות סה״כ
													</span>
												</div>
												{topActions.map(([action, count]) => (
													<div
														key={action}
														className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1"
													>
														<span className="text-xs font-medium text-slate-700">
															{action}
														</span>
														<span className="text-xs font-bold text-green-600">
															×{count}
														</span>
													</div>
												))}
											</div>
										</div>
									</div>
								</div>
							);
						})
					)}
				</div>
			)}
		</div>
	);
}
