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

const ROLE_LABELS: Record<string, string> = { ADMIN: "מנהל", SECRETARY: "פקיד/ה" };

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${copied ? "bg-green-100 text-green-700" : "bg-green-600 hover:bg-green-500 text-white"}`}
    >
      {copied ? (
        <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>הועתק</>
      ) : (
        <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>העתק</>
      )}
    </button>
  );
}

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-12 h-12 text-base" };
  const colors = ["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-amber-500", "bg-pink-500", "bg-teal-500"];
  const color = colors[(name.charCodeAt(0) || 0) % colors.length];
  return (
    <div className={`${sizes[size]} ${color} rounded-full flex items-center justify-center flex-shrink-0`}>
      <span className="text-white font-bold">{(name || "?").charAt(0).toUpperCase()}</span>
    </div>
  );
}

export default function UserManagement({ users: initialUsers, currentUserId }: { users: User[]; currentUserId: string }) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", name: "", role: "SECRETARY" });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<Invitation[] | null>(null);
  const [invLoading, setInvLoading] = useState(false);
  const [resendLinks, setResendLinks] = useState<Record<string, string>>({});
  const [savingRole, setSavingRole] = useState<string | null>(null);
  const [togglingActive, setTogglingActive] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [pendingRole, setPendingRole] = useState<string>("");
  const [tab, setTab] = useState<"users" | "invitations">("users");

  const admins = users.filter(u => u.role === "ADMIN");
  const secretaries = users.filter(u => u.role === "SECRETARY");
  const activeUsers = users.filter(u => u.isActive !== false);
  const pendingInvitations = (invitations ?? []).filter(i => i.status === "PENDING");

  async function loadInvitations() {
    setInvLoading(true);
    const res = await fetch("/api/invitations");
    if (res.ok) { const d = await res.json(); setInvitations(d.invitations); }
    setInvLoading(false);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteLoading(true); setInviteError(""); setInviteLink(null);
    const res = await fetch("/api/invitations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(inviteForm) });
    if (res.ok) {
      const data = await res.json();
      setInviteLink(data.inviteLink);
      setInviteForm({ email: "", name: "", role: "SECRETARY" });
      router.refresh();
      if (invitations !== null) loadInvitations();
    } else {
      const err = await res.json();
      setInviteError(err.error || "שגיאה בשליחת הזמנה");
    }
    setInviteLoading(false);
  }

  async function handleSaveRole(userId: string) {
    setSavingRole(userId);
    const res = await fetch(`/api/users/${userId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: pendingRole }) });
    if (res.ok) { setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: pendingRole } : u)); }
    setEditingRole(null); setSavingRole(null);
  }

  async function handleToggleActive(userId: string, current: boolean) {
    setTogglingActive(userId);
    const res = await fetch(`/api/users/${userId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !current }) });
    if (res.ok) { setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !current } : u)); }
    setTogglingActive(null);
  }

  async function handleDelete(userId: string, name: string) {
    if (!confirm(`למחוק את ${name}?`)) return;
    setDeletingId(userId);
    const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
    if (res.ok) setUsers(prev => prev.filter(u => u.id !== userId));
    setDeletingId(null);
  }

  async function handleCancelInvitation(id: string) {
    if (!confirm("לבטל את ההזמנה?")) return;
    await fetch(`/api/invitations/${id}`, { method: "DELETE" });
    loadInvitations();
  }

  async function handleResend(invId: string) {
    const res = await fetch(`/api/invitations/${invId}`, { method: "POST" });
    if (res.ok) { const d = await res.json(); setResendLinks(prev => ({ ...prev, [invId]: d.inviteLink })); }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ניהול משתמשים</h1>
          <p className="text-slate-500 text-sm mt-0.5">{users.length} משתמשים רשומים</p>
        </div>
        <button
          onClick={() => { setShowInviteModal(true); setInviteLink(null); setInviteError(""); }}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm shadow-green-900/20"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          הוסף משתמש
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "סה״כ משתמשים", value: users.length, color: "text-slate-700", bg: "bg-white", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
          { label: "מנהלים", value: admins.length, color: "text-purple-700", bg: "bg-purple-50", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
          { label: "פקידים", value: secretaries.length, color: "text-blue-700", bg: "bg-blue-50", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
          { label: "פעילים", value: activeUsers.length, color: "text-green-700", bg: "bg-green-50", icon: "M5 13l4 4L19 7" },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} rounded-xl border border-slate-200 p-4`}>
            <div className="flex items-center gap-2 mb-1">
              <svg className={`w-4 h-4 ${stat.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
              </svg>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-4 w-fit">
        <button onClick={() => setTab("users")}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === "users" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
          משתמשים ({users.length})
        </button>
        <button onClick={() => { setTab("invitations"); if (!invitations) loadInvitations(); }}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === "invitations" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
          הזמנות ממתינות {pendingInvitations.length > 0 && <span className="mr-1 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingInvitations.length}</span>}
        </button>
      </div>

      {/* Users list */}
      {tab === "users" && (
        <div className="space-y-2">
          {users.map(user => {
            const isActive = user.isActive !== false;
            const isMe = user.id === currentUserId;
            const isSA = user.isSuperAdmin;
            const isEditingThis = editingRole === user.id;

            return (
              <div key={user.id} className={`bg-white rounded-xl border ${isActive ? "border-slate-200" : "border-slate-100 opacity-60"} p-4 transition-all`}>
                <div className="flex items-center gap-3">
                  <Avatar name={user.name || user.email} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-800 text-sm">{user.name || "—"}</span>
                      {isMe && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">אתה</span>}
                      {isSA && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-semibold">מנהל ראשי</span>}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${user.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-600"}`}>
                        {ROLE_LABELS[user.role] ?? user.role}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {isActive ? "פעיל" : "מושבת"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5" dir="ltr">{user.email}</p>
                  </div>

                  {/* Actions */}
                  {!isSA && !isMe && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isEditingThis ? (
                        <div className="flex items-center gap-1.5">
                          <select value={pendingRole} onChange={e => setPendingRole(e.target.value)}
                            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-green-500">
                            <option value="ADMIN">מנהל</option>
                            <option value="SECRETARY">פקיד/ה</option>
                          </select>
                          <button onClick={() => handleSaveRole(user.id)} disabled={savingRole === user.id}
                            className="text-xs bg-green-600 hover:bg-green-500 text-white px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                            {savingRole === user.id ? "..." : "שמור"}
                          </button>
                          <button onClick={() => setEditingRole(null)}
                            className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                            ביטול
                          </button>
                        </div>
                      ) : (
                        <>
                          <button onClick={() => { setEditingRole(user.id); setPendingRole(user.role); }}
                            className="text-xs text-slate-500 hover:text-slate-700 border border-slate-200 hover:bg-slate-50 px-2.5 py-1.5 rounded-lg transition-colors">
                            תפקיד
                          </button>
                          <button onClick={() => handleToggleActive(user.id, isActive)} disabled={togglingActive === user.id}
                            className={`text-xs border px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${isActive ? "text-red-500 border-red-200 hover:bg-red-50" : "text-green-600 border-green-200 hover:bg-green-50"}`}>
                            {togglingActive === user.id ? "..." : isActive ? "השבת" : "הפעל"}
                          </button>
                          <button onClick={() => handleDelete(user.id, user.name)} disabled={deletingId === user.id}
                            className="text-xs text-slate-300 hover:text-red-500 border border-slate-100 hover:border-red-200 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50">
                            {deletingId === user.id ? "..." : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Invitations tab */}
      {tab === "invitations" && (
        <div>
          {invLoading ? (
            <div className="flex justify-center py-12">
              <svg className="w-6 h-6 animate-spin text-green-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : (invitations ?? []).length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-slate-500 text-sm">אין הזמנות ממתינות</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(invitations ?? []).filter(i => i.status === "PENDING").map(inv => (
                <div key={inv.id} className="bg-white rounded-xl border border-amber-200 bg-amber-50/30 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-amber-600">{inv.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 text-sm">{inv.name}</span>
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">ממתין</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">{ROLE_LABELS[inv.role] ?? inv.role}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5" dir="ltr">{inv.email}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {resendLinks[inv.id] ? (
                        <CopyButton text={resendLinks[inv.id]} />
                      ) : (
                        <button onClick={() => handleResend(inv.id)}
                          className="text-xs text-green-600 border border-green-200 hover:bg-green-50 px-2.5 py-1.5 rounded-lg transition-colors">
                          חדש קישור
                        </button>
                      )}
                      <button onClick={() => handleCancelInvitation(inv.id)}
                        className="text-xs text-red-400 hover:text-red-600 border border-red-100 hover:border-red-200 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">הוספת משתמש חדש</h2>
              <button onClick={() => { setShowInviteModal(false); setInviteLink(null); }} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5">
              {inviteLink ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-green-800">ההזמנה נוצרה!</p>
                      <p className="text-xs text-green-600 mt-0.5">שלח את הקישור למשתמש החדש</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">קישור הזמנה (תקף ל-24 שעות):</p>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-500 font-mono break-all mb-2" dir="ltr">
                      {inviteLink}
                    </div>
                    <CopyButton text={inviteLink} />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setInviteLink(null)}
                      className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium px-4 py-2.5 rounded-xl text-sm transition-colors">
                      הוסף עוד
                    </button>
                    <button onClick={() => { setShowInviteModal(false); setInviteLink(null); }}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-colors">
                      סגור
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleInvite} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">שם מלא *</label>
                    <input type="text" value={inviteForm.name}
                      onChange={e => setInviteForm(p => ({ ...p, name: e.target.value }))}
                      required placeholder="ישראל ישראלי"
                      className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">אימייל *</label>
                    <input type="email" value={inviteForm.email}
                      onChange={e => setInviteForm(p => ({ ...p, email: e.target.value }))}
                      required placeholder="user@example.com" dir="ltr"
                      className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">תפקיד</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: "SECRETARY", label: "פקיד/ה", desc: "הוספת נתונים", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
                        { value: "ADMIN", label: "מנהל", desc: "הרשאות מלאות", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
                      ].map(opt => (
                        <label key={opt.value}
                          className={`flex items-start gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${inviteForm.role === opt.value ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300 bg-white"}`}>
                          <input type="radio" name="role" value={opt.value} checked={inviteForm.role === opt.value}
                            onChange={e => setInviteForm(p => ({ ...p, role: e.target.value }))} className="mt-0.5 accent-green-600" />
                          <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={opt.icon} />
                              </svg>
                              <span className="text-sm font-bold text-gray-800">{opt.label}</span>
                            </div>
                            <p className="text-xs text-gray-500">{opt.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {inviteError && <p className="text-red-500 text-xs bg-red-50 border border-red-100 px-3 py-2 rounded-xl">{inviteError}</p>}

                  <div className="flex gap-2 pt-1">
                    <button type="submit" disabled={inviteLoading}
                      className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors">
                      {inviteLoading ? "יוצר..." : "צור קישור"}
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
