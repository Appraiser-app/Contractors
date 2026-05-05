"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  isSuperAdmin?: boolean | null;
  createdAt: Date | string;
};

type Invitation = {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  createdAt: string;
  acceptedAt: string | null;
};

const roleLabels: Record<string, string> = {
  ADMIN: "מנהל",
  SECRETARY: "פקיד/ה",
};

const roleColors: Record<string, string> = {
  ADMIN: "bg-green-100 text-green-700",
  SECRETARY: "bg-blue-100 text-blue-700",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold rounded-lg transition-colors flex-shrink-0"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          הועתק!
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          העתק קישור
        </>
      )}
    </button>
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "עכשיו";
  if (m < 60) return `לפני ${m} דק'`;
  const h = Math.floor(m / 60);
  if (h < 24) return `לפני ${h} שע'`;
  const d = Math.floor(h / 24);
  return `לפני ${d} ${d === 1 ? "יום" : "ימים"}`;
}

export default function UserManagement({ users: initialUsers }: { users: User[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"users" | "invitations">("users");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", name: "", role: "SECRETARY" });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<Invitation[] | null>(null);
  const [invLoading, setInvLoading] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [resendLinks, setResendLinks] = useState<Record<string, string>>({});

  async function loadInvitations() {
    setInvLoading(true);
    const res = await fetch("/api/invitations");
    if (res.ok) {
      const data = await res.json();
      setInvitations(data.invitations);
    }
    setInvLoading(false);
  }

  function handleTabChange(t: "users" | "invitations") {
    setTab(t);
    if (t === "invitations" && invitations === null) {
      loadInvitations();
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteLoading(true);
    setInviteError("");
    setInviteLink(null);

    const res = await fetch("/api/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inviteForm),
    });

    if (res.ok) {
      const data = await res.json();
      setInviteLink(data.inviteLink);
      setInviteForm({ email: "", name: "", role: "SECRETARY" });
      if (invitations !== null) loadInvitations();
      router.refresh();
    } else {
      const err = await res.json();
      setInviteError(err.error || "שגיאה בשליחת הזמנה");
    }
    setInviteLoading(false);
  }

  async function handleCancelInvitation(id: string) {
    if (!confirm("לבטל את ההזמנה?")) return;
    await fetch(`/api/invitations/${id}`, { method: "DELETE" });
    loadInvitations();
    router.refresh();
  }

  async function handleResend(invId: string) {
    const res = await fetch(`/api/invitations/${invId}`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setResendLinks(prev => ({ ...prev, [invId]: data.inviteLink }));
    }
  }

  async function handleRoleChange(userId: string, newRole: string) {
    const res = await fetch(`/api/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      setEditingRole(null);
      router.refresh();
    }
  }

  async function handleDelete(userId: string) {
    if (!confirm("האם למחוק את המשתמש?")) return;
    const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  const pendingInvitations = invitations?.filter(i => i.status === "PENDING") ?? [];
  const acceptedInvitations = invitations?.filter(i => i.status === "ACCEPTED") ?? [];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => handleTabChange("users")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "users" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          משתמשים פעילים ({initialUsers.length})
        </button>
        <button
          onClick={() => handleTabChange("invitations")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "invitations" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          הזמנות
          {invitations !== null && pendingInvitations.length > 0 && (
            <span className="mr-2 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {pendingInvitations.length}
            </span>
          )}
        </button>
      </div>

      {/* Users tab */}
      {tab === "users" && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">משתמשים פעילים</h2>
            <button
              onClick={() => { setTab("invitations"); handleTabChange("invitations"); setShowInvite(true); }}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-3 py-2 rounded-xl text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              הזמן משתמש
            </button>
          </div>

          <div className="divide-y divide-gray-50">
            {initialUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-green-700 font-bold text-sm">{user.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                    <p className="text-gray-400 text-xs" dir="ltr">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {user.isSuperAdmin ? (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-xs font-semibold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-lg">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        מנהל ראשי
                      </span>
                    </div>
                  ) : editingRole === user.id ? (
                    <div className="flex gap-2">
                      <select
                        defaultValue={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="border border-gray-200 rounded-xl px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-600 bg-white"
                      >
                        <option value="SECRETARY">פקיד/ה</option>
                        <option value="ADMIN">מנהל</option>
                      </select>
                      <button
                        onClick={() => setEditingRole(null)}
                        className="text-gray-400 hover:text-gray-600 text-xs"
                      >
                        ביטול
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${roleColors[user.role]}`}>
                        {roleLabels[user.role]}
                      </span>
                      <button
                        onClick={() => setEditingRole(user.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="שנה תפקיד"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="מחק משתמש"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invitations tab */}
      {tab === "invitations" && (
        <div className="space-y-4">
          {/* Invite form */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <button
              onClick={() => { setShowInvite(!showInvite); setInviteLink(null); setInviteError(""); }}
              className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <p className="font-bold text-gray-900 text-sm">הזמנת משתמש חדש</p>
              </div>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${showInvite ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showInvite && (
              <div className="px-5 pb-5 border-t border-gray-50">
                {inviteLink ? (
                  /* Success state — show invite link */
                  <div className="pt-4 space-y-4">
                    <div className="flex items-center gap-2.5 p-3 bg-green-50 rounded-xl border border-green-100">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-green-800">המשתמש נוצר בהצלחה</p>
                        <p className="text-xs text-green-600">שלח את הקישור הזה למשתמש — לאחר לחיצה הם יגדירו סיסמה ויוכלו להיכנס</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500">קישור הזמנה:</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-500 font-mono overflow-hidden truncate" dir="ltr">
                          {inviteLink}
                        </div>
                        <CopyButton text={inviteLink} />
                      </div>
                      <p className="text-[11px] text-gray-400">הקישור תקף ל-24 שעות</p>
                    </div>

                    <button
                      onClick={() => { setInviteLink(null); setShowInvite(false); }}
                      className="w-full border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium px-4 py-2.5 rounded-xl text-sm transition-colors"
                    >
                      סגור
                    </button>
                  </div>
                ) : (
                  /* Invite form */
                  <form onSubmit={handleInvite} className="pt-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">שם מלא *</label>
                        <input
                          type="text"
                          value={inviteForm.name}
                          onChange={(e) => setInviteForm((p) => ({ ...p, name: e.target.value }))}
                          required
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                          placeholder="ישראל ישראלי"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">אימייל *</label>
                        <input
                          type="email"
                          value={inviteForm.email}
                          onChange={(e) => setInviteForm((p) => ({ ...p, email: e.target.value }))}
                          required
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                          placeholder="user@example.com"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">תפקיד</label>
                      <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                        {[
                          { value: "SECRETARY", label: "פקיד/ה", desc: "הוספת נתונים בלבד" },
                          { value: "ADMIN", label: "מנהל", desc: "הרשאות מלאות" },
                        ].map(opt => (
                          <label
                            key={opt.value}
                            className={`flex items-start gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${inviteForm.role === opt.value ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"}`}
                          >
                            <input
                              type="radio"
                              name="role"
                              value={opt.value}
                              checked={inviteForm.role === opt.value}
                              onChange={(e) => setInviteForm(p => ({ ...p, role: e.target.value }))}
                              className="mt-0.5 accent-green-600"
                            />
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                              <p className="text-xs text-gray-500">{opt.desc}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {inviteError && (
                      <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">{inviteError}</p>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button
                        type="submit"
                        disabled={inviteLoading}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-200 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
                      >
                        {inviteLoading ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            יוצר...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            צור קישור הזמנה
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowInvite(false)}
                        className="border border-gray-200 text-gray-500 hover:bg-gray-50 px-4 py-2.5 rounded-xl text-sm transition-colors"
                      >
                        ביטול
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Pending invitations */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-50">
              <h3 className="font-bold text-gray-900 text-sm">הזמנות ממתינות</h3>
            </div>
            {invLoading ? (
              <div className="flex items-center justify-center py-10">
                <svg className="w-5 h-5 animate-spin text-green-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : pendingInvitations.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                <svg className="w-10 h-10 mx-auto mb-2 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                </svg>
                אין הזמנות ממתינות
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {pendingInvitations.map((inv) => (
                  <div key={inv.id} className="px-5 py-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-amber-700 font-bold text-sm">{inv.name.charAt(0)}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 text-sm">{inv.name}</p>
                            <span className="text-[10px] bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">ממתין</span>
                          </div>
                          <p className="text-gray-400 text-xs" dir="ltr">{inv.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${roleColors[inv.role]}`}>
                          {roleLabels[inv.role]}
                        </span>
                        <button
                          onClick={() => handleCancelInvitation(inv.id)}
                          className="text-gray-300 hover:text-red-400 transition-colors"
                          title="בטל הזמנה"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Resend link area */}
                    {resendLinks[inv.id] ? (
                      <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-2.5">
                        <p className="text-xs text-gray-500 font-mono truncate flex-1" dir="ltr">{resendLinks[inv.id]}</p>
                        <CopyButton text={resendLinks[inv.id]} />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400">נשלח {timeAgo(inv.createdAt)}</p>
                        <button
                          onClick={() => handleResend(inv.id)}
                          className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          חדש קישור
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Accepted invitations */}
          {!invLoading && acceptedInvitations.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-50">
                <h3 className="font-bold text-gray-900 text-sm">הזמנות שהתקבלו</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {acceptedInvitations.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-green-700 font-bold text-sm">{inv.name.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 text-sm">{inv.name}</p>
                          <span className="text-[10px] bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">הצטרף</span>
                        </div>
                        <p className="text-gray-400 text-xs" dir="ltr">{inv.email}</p>
                      </div>
                    </div>
                    {inv.acceptedAt && (
                      <p className="text-xs text-gray-400">{timeAgo(inv.acceptedAt)}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
