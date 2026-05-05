"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  isSuperAdmin?: boolean | null;
  isActive?: boolean | null;
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

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "מנהל",
  SECRETARY: "פקיד/ה",
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-700",
  SECRETARY: "bg-blue-100 text-blue-700",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold rounded-lg transition-colors flex-shrink-0"
    >
      {copied ? "הועתק! ✓" : "העתק קישור"}
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

export default function UserManagement({
  users: initialUsers,
  currentUserId,
}: {
  users: User[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showInvitations, setShowInvitations] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", name: "", role: "SECRETARY" });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<Invitation[] | null>(null);
  const [invLoading, setInvLoading] = useState(false);
  const [resendLinks, setResendLinks] = useState<Record<string, string>>({});
  const [pendingRoles, setPendingRoles] = useState<Record<string, string>>({});
  const [savingRole, setSavingRole] = useState<string | null>(null);
  const [togglingActive, setTogglingActive] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadInvitations() {
    setInvLoading(true);
    const res = await fetch("/api/invitations");
    if (res.ok) {
      const data = await res.json();
      setInvitations(data.invitations);
    }
    setInvLoading(false);
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

  async function handleSaveRole(userId: string) {
    const newRole = pendingRoles[userId];
    if (!newRole) return;
    setSavingRole(userId);
    const res = await fetch(`/api/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      setPendingRoles((prev) => { const n = { ...prev }; delete n[userId]; return n; });
    }
    setSavingRole(null);
  }

  async function handleToggleActive(userId: string, current: boolean) {
    setTogglingActive(userId);
    const res = await fetch(`/api/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isActive: !current } : u)));
    }
    setTogglingActive(null);
  }

  async function handleDelete(userId: string) {
    if (!confirm("האם למחוק את המשתמש?")) return;
    setDeletingId(userId);
    const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
    if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== userId));
    setDeletingId(null);
  }

  async function handleCancelInvitation(id: string) {
    if (!confirm("לבטל את ההזמנה?")) return;
    await fetch(`/api/invitations/${id}`, { method: "DELETE" });
    loadInvitations();
  }

  async function handleResend(invId: string) {
    const res = await fetch(`/api/invitations/${invId}`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setResendLinks((prev) => ({ ...prev, [invId]: data.inviteLink }));
    }
  }

  const pendingInvitations = invitations?.filter((i) => i.status === "PENDING") ?? [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ניהול עובדים</h1>
          <p className="text-slate-500 text-sm mt-0.5">{users.length} עובדים</p>
        </div>
        <button
          onClick={() => { setShowInviteModal(true); setInviteLink(null); setInviteError(""); }}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          הזמן עובד
        </button>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="text-right text-xs font-medium text-slate-500 px-4 py-3 w-8">#</th>
              <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">שם</th>
              <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">אימייל</th>
              <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">תפקיד</th>
              <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">סטטוס</th>
              <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map((user, idx) => {
              const isActive = user.isActive !== false;
              const isMe = user.id === currentUserId;
              const isSA = user.isSuperAdmin;
              const pendingRole = pendingRoles[user.id] ?? user.role;
              const roleChanged = pendingRole !== user.role;

              return (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  {/* # */}
                  <td className="px-4 py-3 text-xs text-slate-400 font-medium">{idx + 1}</td>

                  {/* Name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-slate-600">
                          {(user.name || user.email).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-medium text-slate-800">{user.name || "—"}</span>
                        {isMe && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">אתה</span>
                        )}
                        {isSA && (
                          <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-semibold">מנהל ראשי</span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3 text-sm text-slate-500" dir="ltr">{user.email}</td>

                  {/* Role badge */}
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[user.role] ?? "bg-slate-100 text-slate-600"}`}>
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      {isActive ? "פעיל" : "מושבת"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    {isSA || isMe ? (
                      <span className="text-xs text-slate-300">—</span>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Role dropdown */}
                        <select
                          value={pendingRole}
                          onChange={(e) => setPendingRoles((prev) => ({ ...prev, [user.id]: e.target.value }))}
                          className="text-xs border border-slate-200 rounded px-1.5 py-1 bg-white focus:outline-none focus:border-blue-400"
                        >
                          <option value="ADMIN">מנהל</option>
                          <option value="SECRETARY">פקיד/ה</option>
                        </select>

                        {roleChanged && (
                          <button
                            onClick={() => handleSaveRole(user.id)}
                            disabled={savingRole === user.id}
                            className="text-xs text-blue-600 hover:text-blue-700 border border-blue-200 px-2 py-1 rounded hover:bg-blue-50 transition-colors disabled:opacity-50"
                          >
                            {savingRole === user.id ? "..." : "שמור"}
                          </button>
                        )}

                        {/* Toggle active */}
                        <button
                          onClick={() => handleToggleActive(user.id, isActive)}
                          disabled={togglingActive === user.id}
                          className={`text-xs border px-2 py-1 rounded transition-colors disabled:opacity-50 ${
                            isActive
                              ? "text-red-500 border-red-200 hover:bg-red-50"
                              : "text-green-600 border-green-200 hover:bg-green-50"
                          }`}
                        >
                          {togglingActive === user.id ? "..." : isActive ? "השבת" : "הפעל"}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={deletingId === user.id}
                          className="text-xs text-slate-400 hover:text-red-500 border border-slate-200 hover:border-red-200 px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          מחק
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pending invitations toggle */}
      {invitations === null ? (
        <button
          onClick={() => { setShowInvitations(true); loadInvitations(); }}
          className="mt-4 text-sm text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          הצג הזמנות ממתינות
        </button>
      ) : showInvitations && (
        <div className="mt-4 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">הזמנות ממתינות</h3>
            <button onClick={() => setShowInvitations(false)} className="text-slate-400 hover:text-slate-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {invLoading ? (
            <div className="flex justify-center py-8">
              <svg className="w-5 h-5 animate-spin text-green-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : pendingInvitations.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-8">אין הזמנות ממתינות</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {pendingInvitations.map((inv) => (
                <div key={inv.id} className="px-5 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-amber-600">{inv.name.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-slate-800">{inv.name}</p>
                          <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">ממתין</span>
                        </div>
                        <p className="text-xs text-slate-400" dir="ltr">{inv.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {resendLinks[inv.id] ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-500 truncate max-w-[120px]" dir="ltr">{resendLinks[inv.id]}</span>
                          <CopyButton text={resendLinks[inv.id]} />
                        </div>
                      ) : (
                        <button onClick={() => handleResend(inv.id)}
                          className="text-xs text-green-600 hover:text-green-700 border border-green-200 px-2 py-1 rounded hover:bg-green-50 transition-colors">
                          חדש קישור
                        </button>
                      )}
                      <button onClick={() => handleCancelInvitation(inv.id)}
                        className="text-xs text-red-400 hover:text-red-600 border border-red-100 px-2 py-1 rounded hover:bg-red-50 transition-colors">
                        בטל
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Invite modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">הזמנת עובד חדש</h2>
              <button onClick={() => { setShowInviteModal(false); setInviteLink(null); }}
                className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5">
              {inviteLink ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 p-3 bg-green-50 rounded-xl border border-green-100">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-green-800">המשתמש נוצר בהצלחה</p>
                      <p className="text-xs text-green-600">שלח את הקישור למשתמש — הם יגדירו סיסמה ויתחברו</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1.5">קישור הזמנה:</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-500 font-mono truncate" dir="ltr">
                        {inviteLink}
                      </div>
                      <CopyButton text={inviteLink} />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">הקישור תקף ל-24 שעות</p>
                  </div>
                  <button onClick={() => { setShowInviteModal(false); setInviteLink(null); }}
                    className="w-full border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium px-4 py-2.5 rounded-xl text-sm transition-colors">
                    סגור
                  </button>
                </div>
              ) : (
                <form onSubmit={handleInvite} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">שם מלא *</label>
                    <input type="text" value={inviteForm.name}
                      onChange={(e) => setInviteForm((p) => ({ ...p, name: e.target.value }))}
                      required placeholder="ישראל ישראלי"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">אימייל *</label>
                    <input type="email" value={inviteForm.email}
                      onChange={(e) => setInviteForm((p) => ({ ...p, email: e.target.value }))}
                      required placeholder="user@example.com" dir="ltr"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">תפקיד</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[{ value: "SECRETARY", label: "פקיד/ה", desc: "הוספת נתונים" }, { value: "ADMIN", label: "מנהל", desc: "הרשאות מלאות" }].map((opt) => (
                        <label key={opt.value}
                          className={`flex items-start gap-2 p-2.5 rounded-xl border-2 cursor-pointer transition-all ${inviteForm.role === opt.value ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"}`}>
                          <input type="radio" name="role" value={opt.value}
                            checked={inviteForm.role === opt.value}
                            onChange={(e) => setInviteForm((p) => ({ ...p, role: e.target.value }))}
                            className="mt-0.5 accent-green-600" />
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
                    <button type="submit" disabled={inviteLoading}
                      className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-200 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors">
                      {inviteLoading ? "יוצר..." : "צור קישור הזמנה"}
                    </button>
                    <button type="button" onClick={() => setShowInviteModal(false)}
                      className="border border-gray-200 text-gray-500 hover:bg-gray-50 px-4 py-2.5 rounded-xl text-sm transition-colors">
                      ביטול
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
