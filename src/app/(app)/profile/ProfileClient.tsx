"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

type Profile = {
  id: string;
  name: string;
  email: string;
  role: string;
  isSuperAdmin: boolean | null;
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
        <h1 className="text-2xl font-bold text-gray-900">הפרופיל שלי</h1>
        <p className="text-gray-500 text-sm mt-1">ניהול פרטי החשבון שלך</p>
      </div>

      {/* Profile header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-200 relative">
            <span className="text-white text-2xl font-bold">{profile.name.charAt(0).toUpperCase()}</span>
            {isSuperAdmin && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center shadow-md">
                <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
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
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  מנהל ראשי
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500" dir="ltr">{profile.email}</p>
            <span className="mt-1 inline-block text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              {roleLabels[profile.role] || profile.role}
            </span>
          </div>
        </div>

        {/* Name edit */}
        <form onSubmit={handleSaveName} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">שם מלא</label>
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
            {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">אימייל</label>
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

      {/* Password reset */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
        <h2 className="font-bold text-gray-900 mb-1">סיסמה</h2>
        <p className="text-gray-500 text-sm mb-4">שלח קישור לאיפוס סיסמה לאימייל שלך</p>
        {resetSent ? (
          <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-green-700 text-sm">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            נשלח קישור לאיפוס ל-{profile.email}
          </div>
        ) : (
          <button
            onClick={handlePasswordReset}
            disabled={resetLoading}
            className="flex items-center gap-2 border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium px-4 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            {resetLoading ? "שולח..." : "שלח קישור לאיפוס סיסמה"}
          </button>
        )}
      </div>

      {/* Super admin claim — only for admins when no super admin exists yet, or if already super admin */}
      {profile.role === "ADMIN" && (!hasSuperAdmin || isSuperAdmin) && (
        <div className={`rounded-2xl border p-6 ${isSuperAdmin ? "bg-amber-50 border-amber-200" : "bg-white border-gray-100"}`}>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
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
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              פעיל — הגנה מופעלת
            </div>
          ) : (
            <>
              {claimSuccess ? (
                <div className="text-amber-700 text-sm font-medium">הוגדרת כמנהל ראשי בהצלחה!</div>
              ) : (
                <button
                  onClick={handleClaimSuperAdmin}
                  disabled={claimLoading}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-200 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  {claimLoading ? "מגדיר..." : "הגדר אותי כמנהל ראשי"}
                </button>
              )}
              {claimError && <p className="text-red-500 text-xs mt-2">{claimError}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
