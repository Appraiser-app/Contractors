"use client";

import { auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

const TRADES = [
	"Electrical",
	"Plumbing",
	"HVAC",
	"Roofing",
	"Framing",
	"Concrete",
	"Excavation",
	"Painting",
	"Drywall",
	"Flooring",
	"Landscaping",
	"Other",
];

type Profile = {
	id: string;
	name: string;
	email: string;
	role: string;
	isSuperAdmin: boolean | null;
	userRole?: string;
	zipCode?: string | null;
	trade?: string | null;
	bio?: string | null;
	businessName?: string | null;
	website?: string | null;
	phone?: string | null;
	serviceRadius?: number;
};

const roleLabels: Record<string, string> = {
	ADMIN: "מנהל",
	SECRETARY: "פקיד/ה",
};

export default function ProfileClient({
	profile,
	hasSuperAdmin,
	isSuperAdmin,
}: {
	profile: Profile;
	hasSuperAdmin: boolean;
	isSuperAdmin: boolean;
}) {
	const router = useRouter();
	const [name, setName] = useState(profile.name);
	const [savingName, setSavingName] = useState(false);
	const [nameSuccess, setNameSuccess] = useState(false);
	const [nameError, setNameError] = useState("");

	const [resetSent, setResetSent] = useState(false);
	const [resetLoading, setResetLoading] = useState(false);

	const [claimLoading, setClaimLoading] = useState(false);
	const [claimError, setClaimError] = useState("");
	const [claimSuccess, setClaimSuccess] = useState(false);

	// BuildersBooks profile fields
	const [bbForm, setBbForm] = useState({
		userRole: profile.userRole || "COMMUNITY",
		zipCode: profile.zipCode || "",
		trade: profile.trade || "",
		bio: profile.bio || "",
		businessName: profile.businessName || "",
		website: profile.website || "",
		phone: profile.phone || "",
		serviceRadius: profile.serviceRadius || 25,
	});
	const [savingBb, setSavingBb] = useState(false);
	const [bbSuccess, setBbSuccess] = useState(false);

	async function handleSaveBb(e: React.FormEvent) {
		e.preventDefault();
		setSavingBb(true);
		const res = await fetch("/api/users/profile", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(bbForm),
		});
		setSavingBb(false);
		if (res.ok) {
			setBbSuccess(true);
			setTimeout(() => setBbSuccess(false), 3000);
			router.refresh();
		}
	}

	async function handleSaveName(e: React.FormEvent) {
		e.preventDefault();
		if (!name.trim() || name.trim() === profile.name) return;
		setSavingName(true);
		setNameError("");
		setNameSuccess(false);

		const res = await fetch("/api/users/profile", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name }),
		});

		setSavingName(false);
		if (res.ok) {
			setNameSuccess(true);
			setTimeout(() => setNameSuccess(false), 3000);
			router.refresh();
		} else {
			const err = await res.json();
			setNameError(err.error || "שגיאה בשמירה");
		}
	}

	async function handlePasswordReset() {
		setResetLoading(true);
		try {
			await sendPasswordResetEmail(auth, profile.email);
			setResetSent(true);
		} catch {
			// ignore
		}
		setResetLoading(false);
	}

	async function handleClaimSuperAdmin() {
		setClaimLoading(true);
		setClaimError("");
		const res = await fetch("/api/users/super-admin", { method: "POST" });
		setClaimLoading(false);
		if (res.ok) {
			setClaimSuccess(true);
			router.refresh();
		} else {
			const err = await res.json();
			setClaimError(err.error || "שגיאה");
		}
	}

	return (
		<div className="p-4 sm:p-6 lg:p-8 max-w-xl">
			<div className="mb-6">
				<button
					type="button"
					onClick={() => router.back()}
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
				<h1 className="text-2xl font-bold text-gray-900">הפרופיל שלי</h1>
				<p className="text-gray-500 text-sm mt-1">ניהול פרטי החשבון שלך</p>
			</div>

			{/* Profile header */}
			<div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
				<div className="flex items-center gap-4 mb-6">
					<div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-200 relative">
						<span className="text-white text-2xl font-bold">
							{profile.name.charAt(0).toUpperCase()}
						</span>
						{isSuperAdmin && (
							<div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center shadow-md">
								<svg
									className="w-3.5 h-3.5 text-white"
									fill="currentColor"
									viewBox="0 0 24 24"
								>
									<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
								</svg>
							</div>
						)}
					</div>
					<div>
						<div className="flex items-center gap-2 flex-wrap">
							<p className="text-lg font-bold text-gray-900">{profile.name}</p>
							{isSuperAdmin && (
								<span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
									<svg
										className="w-3 h-3"
										fill="currentColor"
										viewBox="0 0 24 24"
									>
										<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
									</svg>
									מנהל ראשי
								</span>
							)}
						</div>
						<p className="text-sm text-gray-500" dir="ltr">
							{profile.email}
						</p>
						<span className="mt-1 inline-block text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
							{roleLabels[profile.role] || profile.role}
						</span>
					</div>
				</div>

				{/* Name edit */}
				<form onSubmit={handleSaveName} className="space-y-3">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1.5">
							שם מלא
						</label>
						<div className="flex gap-2">
							<input
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
							/>
							<button
								type="submit"
								disabled={savingName || name.trim() === profile.name}
								className="px-4 py-2.5 bg-green-600 hover:bg-green-500 disabled:bg-gray-200 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-colors flex-shrink-0"
							>
								{savingName ? "שומר..." : nameSuccess ? "נשמר ✓" : "שמור"}
							</button>
						</div>
						{nameError && (
							<p className="text-red-500 text-xs mt-1">{nameError}</p>
						)}
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1.5">
							אימייל
						</label>
						<input
							type="email"
							value={profile.email}
							disabled
							className="w-full border border-gray-100 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
							dir="ltr"
						/>
					</div>
				</form>
			</div>

			{/* BuildersBooks Profile */}
			<div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
				<div className="flex items-center gap-2 mb-4">
					<div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
						<svg
							className="w-4 h-4 text-green-600"
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
					<h2 className="font-bold text-gray-900">BuildersBooks Profile</h2>
				</div>
				<form onSubmit={handleSaveBb} className="space-y-4">
					<div>
						<label className="block text-xs font-medium text-gray-600 mb-1.5">
							Role
						</label>
						<div className="flex gap-2">
							{[
								{ v: "GC", l: "General Contractor" },
								{ v: "SUB", l: "Subcontractor" },
								{ v: "COMMUNITY", l: "Community" },
							].map((r) => (
								<button
									key={r.v}
									type="button"
									onClick={() => setBbForm((p) => ({ ...p, userRole: r.v }))}
									className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all border ${bbForm.userRole === r.v ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
								>
									{r.l}
								</button>
							))}
						</div>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="block text-xs font-medium text-gray-600 mb-1.5">
								Business Name
							</label>
							<input
								value={bbForm.businessName}
								onChange={(e) =>
									setBbForm((p) => ({ ...p, businessName: e.target.value }))
								}
								placeholder="ABC Construction"
								className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-400"
							/>
						</div>
						<div>
							<label className="block text-xs font-medium text-gray-600 mb-1.5">
								Trade
							</label>
							<select
								value={bbForm.trade}
								onChange={(e) =>
									setBbForm((p) => ({ ...p, trade: e.target.value }))
								}
								className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-400"
							>
								<option value="">Select trade</option>
								{TRADES.map((t) => (
									<option key={t}>{t}</option>
								))}
							</select>
						</div>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="block text-xs font-medium text-gray-600 mb-1.5">
								Zip Code
							</label>
							<input
								value={bbForm.zipCode}
								onChange={(e) =>
									setBbForm((p) => ({ ...p, zipCode: e.target.value }))
								}
								placeholder="90210"
								className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-400"
							/>
						</div>
						<div>
							<label className="block text-xs font-medium text-gray-600 mb-1.5">
								Service Radius (miles)
							</label>
							<input
								type="number"
								value={bbForm.serviceRadius}
								onChange={(e) =>
									setBbForm((p) => ({
										...p,
										serviceRadius: Number.parseInt(e.target.value),
									}))
								}
								className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-400"
							/>
						</div>
					</div>
					<div>
						<label className="block text-xs font-medium text-gray-600 mb-1.5">
							Bio
						</label>
						<textarea
							value={bbForm.bio}
							onChange={(e) =>
								setBbForm((p) => ({ ...p, bio: e.target.value }))
							}
							rows={3}
							placeholder="Tell others about your experience and specialties..."
							className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-400 resize-none"
						/>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="block text-xs font-medium text-gray-600 mb-1.5">
								Phone
							</label>
							<input
								value={bbForm.phone}
								onChange={(e) =>
									setBbForm((p) => ({ ...p, phone: e.target.value }))
								}
								placeholder="+1 (555) 000-0000"
								className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-400"
							/>
						</div>
						<div>
							<label className="block text-xs font-medium text-gray-600 mb-1.5">
								Website
							</label>
							<input
								value={bbForm.website}
								onChange={(e) =>
									setBbForm((p) => ({ ...p, website: e.target.value }))
								}
								placeholder="https://..."
								className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-400"
							/>
						</div>
					</div>
					<button
						type="submit"
						disabled={savingBb}
						className="w-full py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50"
					>
						{savingBb
							? "Saving..."
							: bbSuccess
								? "Saved ✓"
								: "Save BuildersBooks Profile"}
					</button>
				</form>
			</div>

			{/* Password reset */}
			<div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
				<h2 className="font-bold text-gray-900 mb-1">סיסמה</h2>
				<p className="text-gray-500 text-sm mb-4">
					שלח קישור לאיפוס סיסמה לאימייל שלך
				</p>
				{resetSent ? (
					<div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-green-700 text-sm">
						<svg
							className="w-4 h-4 flex-shrink-0"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M5 13l4 4L19 7"
							/>
						</svg>
						נשלח קישור לאיפוס ל-{profile.email}
					</div>
				) : (
					<button
						onClick={handlePasswordReset}
						disabled={resetLoading}
						className="flex items-center gap-2 border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium px-4 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
					>
						<svg
							className="w-4 h-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
							/>
						</svg>
						{resetLoading ? "שולח..." : "שלח קישור לאיפוס סיסמה"}
					</button>
				)}
			</div>

			{/* Super admin claim — only for admins when no super admin exists yet, or if already super admin */}
			{profile.role === "ADMIN" && (!hasSuperAdmin || isSuperAdmin) && (
				<div
					className={`rounded-2xl border p-6 ${isSuperAdmin ? "bg-amber-50 border-amber-200" : "bg-white border-gray-100"}`}
				>
					<div className="flex items-start gap-3 mb-4">
						<div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
							<svg
								className="w-5 h-5 text-amber-600"
								fill="currentColor"
								viewBox="0 0 24 24"
							>
								<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
							</svg>
						</div>
						<div>
							<h2 className="font-bold text-gray-900">מנהל ראשי</h2>
							<p className="text-gray-500 text-sm mt-0.5">
								{isSuperAdmin
									? "אתה המנהל הראשי של המערכת. לא ניתן למחוק או לשנות את הרשאותיך."
									: "המנהל הראשי מוגן ממחיקה ושינוי הרשאות. הגדר את עצמך כמנהל ראשי."}
							</p>
						</div>
					</div>
					{isSuperAdmin ? (
						<div className="flex items-center gap-2 text-amber-700 text-sm font-medium">
							<svg
								className="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
								/>
							</svg>
							פעיל — הגנה מופעלת
						</div>
					) : (
						<>
							{claimSuccess ? (
								<div className="text-amber-700 text-sm font-medium">
									הוגדרת כמנהל ראשי בהצלחה!
								</div>
							) : (
								<button
									onClick={handleClaimSuperAdmin}
									disabled={claimLoading}
									className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-200 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
								>
									<svg
										className="w-4 h-4"
										fill="currentColor"
										viewBox="0 0 24 24"
									>
										<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
									</svg>
									{claimLoading ? "מגדיר..." : "הגדר אותי כמנהל ראשי"}
								</button>
							)}
							{claimError && (
								<p className="text-red-500 text-xs mt-2">{claimError}</p>
							)}
						</>
					)}
				</div>
			)}
		</div>
	);
}
