"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type UserPermissions = {
  sites: boolean;
  expenses: boolean;
  transactions: boolean;
  approveTransactions: boolean;
  equipment: boolean;
  fuel: boolean;
  reports: boolean;
  documents: boolean;
  collection: boolean;
  subscriptions: boolean;
  canDelete: boolean;
};

type UserRole = "ADMIN" | "MANAGER" | "SECRETARY";

const DEFAULT_PERMISSIONS: Record<UserRole, UserPermissions> = {
  ADMIN: {
    sites: true, expenses: true, transactions: true, approveTransactions: true,
    equipment: true, fuel: true, reports: true, documents: true,
    collection: true, subscriptions: true, canDelete: true,
  },
  MANAGER: {
    sites: true, expenses: true, transactions: true, approveTransactions: true,
    equipment: true, fuel: true, reports: true, documents: true,
    collection: true, subscriptions: true, canDelete: true,
  },
  SECRETARY: {
    sites: true, expenses: true, transactions: true, approveTransactions: false,
    equipment: true, fuel: true, reports: false, documents: true,
    collection: false, subscriptions: false, canDelete: false,
  },
};

const PERMISSION_GROUPS: { key: string; items: { key: keyof UserPermissions; label: string }[] }[] = [
  {
    key: "אתרים ועסקאות",
    items: [
      { key: "sites", label: "אתרי עבודה" },
      { key: "transactions", label: "עסקאות" },
      { key: "approveTransactions", label: "אישור עסקאות" },
      { key: "collection", label: "גבייה" },
    ],
  },
  {
    key: "הוצאות וציוד",
    items: [
      { key: "expenses", label: "הוצאות" },
      { key: "equipment", label: "ציוד" },
      { key: "fuel", label: "דלק ותדלוקים" },
      { key: "subscriptions", label: "מנויים וטיפולים" },
    ],
  },
  {
    key: "מידע ומסמכים",
    items: [
      { key: "reports", label: "דוחות" },
      { key: "documents", label: "מסמכים" },
      { key: "canDelete", label: "מחיקת רשומות" },
    ],
  },
];

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  isSuperAdmin?: boolean | null;
  isActive?: boolean | null;
  permissions?: UserPermissions | null;
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

const ROLE_LABELS: Record<string, string> = { ADMIN: "מנהל", MANAGER: "מנהל פרויקט", SECRETARY: "פקיד/ה" };
const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-700",
  MANAGER: "bg-orange-100 text-orange-700",
  SECRETARY: "bg-blue-100 text-blue-600",
};

function CopyButton({ text, label = "העתק" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2500); }}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${copied ? "bg-green-100 text-green-700 border border-green-200" : "bg-green-600 hover:bg-green-500 text-white"}`}
    >
      {copied ? (
        <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>הועתק!</>
      ) : (
        <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>{label}</>
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

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${checked ? "bg-green-500" : "bg-slate-200"} ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
    </button>
  );
}

function UserDetailModal({ user, currentUserId, onClose, onUpdate, onDelete }: {
  user: User;
  currentUserId: string;
  onClose: () => void;
  onUpdate: (id: string, changes: Partial<User>) => void;
  onDelete: (id: string) => void;
}) {
  const isMe = user.id === currentUserId;
  const isSA = user.isSuperAdmin;
  const isActive = user.isActive !== false;

  const [role, setRole] = useState<UserRole>((user.role as UserRole) || "SECRETARY");
  const [permissions, setPermissions] = useState<UserPermissions>(
    user.permissions ?? DEFAULT_PERMISSIONS[role as UserRole] ?? DEFAULT_PERMISSIONS.SECRETARY
  );
  const [savingRole, setSavingRole] = useState(false);
  const [savingPerms, setSavingPerms] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [loadingReset, setLoadingReset] = useState(false);
  const [resetError, setResetError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [permsSaved, setPermsSaved] = useState(false);

  const canEdit = !isSA && !isMe;
  const roleChanged = role !== user.role;
  // Show custom permission toggles only for non-ADMIN roles (ADMIN always has all)
  const showPerms = role !== "ADMIN";

  function handleRoleChange(newRole: UserRole) {
    setRole(newRole);
    // Auto-fill permissions from defaults when role changes
    setPermissions(DEFAULT_PERMISSIONS[newRole]);
  }

  async function saveRole() {
    if (!roleChanged) return;
    setSavingRole(true);
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) onUpdate(user.id, { role });
    setSavingRole(false);
  }

  async function savePermissions() {
    setSavingPerms(true);
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissions }),
    });
    if (res.ok) {
      onUpdate(user.id, { permissions });
      setPermsSaved(true);
      setTimeout(() => setPermsSaved(false), 2500);
    }
    setSavingPerms(false);
  }

  async function toggleActive() {
    setTogglingActive(true);
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    if (res.ok) onUpdate(user.id, { isActive: !isActive });
    setTogglingActive(false);
  }

  async function sendResetLink() {
    setLoadingReset(true); setResetError(""); setResetLink(null);
    const res = await fetch(`/api/users/${user.id}/reset-password`, { method: "POST" });
    const data = await res.json();
    if (res.ok) setResetLink(data.link);
    else setResetError(data.error || "שגיאה");
    setLoadingReset(false);
  }

  async function deleteUser() {
    setDeleting(true);
    const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    if (res.ok) { onDelete(user.id); onClose(); }
    setDeleting(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">פרטי משתמש</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Identity */}
          <div className="flex items-center gap-4">
            <Avatar name={user.name || user.email} size="lg" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-gray-900 text-lg">{user.name || "—"}</h3>
                {isMe && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-semibold">אתה</span>}
                {isSA && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-semibold">מנהל ראשי</span>}
              </div>
              <p className="text-sm text-slate-500" dir="ltr">{user.email}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                הצטרף {user.createdAt ? new Date(user.createdAt as string).toLocaleDateString("he-IL") : "—"}
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isActive ? "bg-green-500" : "bg-red-400"}`} />
            <span className="text-sm font-medium text-slate-700">{isActive ? "חשבון פעיל" : "חשבון מושבת"}</span>
          </div>

          {/* Role */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">תפקיד</p>
            <div className="space-y-2">
              {([
                { value: "ADMIN", label: "מנהל", desc: "גישה מלאה להכל — כולל ניהול משתמשים ואישור עסקאות", color: "border-purple-300 bg-purple-50" },
                { value: "MANAGER", label: "מנהל פרויקט", desc: "ניהול אתרים, ציוד ועסקאות — ניתן להגדיר הרשאות מפורטות", color: "border-orange-300 bg-orange-50" },
                { value: "SECRETARY", label: "פקיד/ה", desc: "הזנת נתונים בלבד — ניתן להגדיר הרשאות מפורטות", color: "border-blue-300 bg-blue-50" },
              ] as { value: UserRole; label: string; desc: string; color: string }[]).map(opt => (
                <label key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all ${canEdit ? "cursor-pointer" : "cursor-default"} ${role === opt.value ? opt.color : "border-slate-200 bg-white"}`}>
                  <input type="radio" name="role" value={opt.value} checked={role === opt.value}
                    disabled={!canEdit}
                    onChange={() => handleRoleChange(opt.value)}
                    className="mt-1 accent-purple-600" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">{opt.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
            {canEdit && roleChanged && (
              <button onClick={saveRole} disabled={savingRole}
                className="mt-2 w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold py-2 rounded-xl text-sm transition-colors">
                {savingRole ? "שומר..." : "שמור תפקיד"}
              </button>
            )}
          </div>

          {/* Granular Permissions (only for non-ADMIN) */}
          {showPerms && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">הרשאות מפורטות</p>
              <div className="space-y-4">
                {PERMISSION_GROUPS.map(group => (
                  <div key={group.key}>
                    <p className="text-[11px] font-semibold text-slate-400 mb-2">{group.key}</p>
                    <div className="bg-slate-50 rounded-xl divide-y divide-slate-100">
                      {group.items.map(item => (
                        <div key={item.key} className="flex items-center justify-between px-3 py-2.5">
                          <span className="text-sm text-slate-700">{item.label}</span>
                          <Toggle
                            checked={permissions[item.key]}
                            onChange={v => setPermissions(p => ({ ...p, [item.key]: v }))}
                            disabled={!canEdit}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {canEdit && (
                <button onClick={savePermissions} disabled={savingPerms}
                  className={`mt-3 w-full font-semibold py-2 rounded-xl text-sm transition-colors ${permsSaved ? "bg-green-100 text-green-700" : "bg-slate-800 hover:bg-slate-700 text-white"} disabled:opacity-50`}>
                  {savingPerms ? "שומר..." : permsSaved ? "✓ הרשאות נשמרו" : "שמור הרשאות"}
                </button>
              )}
            </div>
          )}

          {/* Password reset */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">איפוס סיסמה</p>
            {resetLink ? (
              <div className="space-y-2">
                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-green-800 mb-1">הקישור מוכן — תוקף: 1 שעה</p>
                  <p className="text-xs text-slate-500 font-mono break-all" dir="ltr">{resetLink}</p>
                </div>
                <CopyButton text={resetLink} label="העתק קישור איפוס" />
              </div>
            ) : (
              <div>
                <button onClick={sendResetLink} disabled={loadingReset}
                  className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-semibold py-2.5 rounded-xl text-sm transition-colors">
                  {loadingReset ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                  )}
                  {loadingReset ? "יוצר קישור..." : "צור קישור איפוס סיסמה"}
                </button>
                {resetError && <p className="text-red-500 text-xs mt-1.5 bg-red-50 px-3 py-2 rounded-lg">{resetError}</p>}
                <p className="text-xs text-slate-400 mt-1.5 text-center">הקישור תקף שעה אחת — שלח אותו ישירות למשתמש</p>
              </div>
            )}
          </div>

          {/* Danger zone */}
          {canEdit && (
            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">פעולות</p>
              <div className="flex gap-2">
                <button onClick={toggleActive} disabled={togglingActive}
                  className={`flex-1 text-sm font-medium py-2 rounded-xl border transition-colors disabled:opacity-50 ${isActive ? "border-red-200 text-red-600 hover:bg-red-50" : "border-green-200 text-green-700 hover:bg-green-50"}`}>
                  {togglingActive ? "..." : isActive ? "השבת חשבון" : "הפעל חשבון"}
                </button>
                {!confirmDelete ? (
                  <button onClick={() => setConfirmDelete(true)}
                    className="px-4 text-sm font-medium py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                    מחק
                  </button>
                ) : (
                  <div className="flex gap-1.5">
                    <button onClick={deleteUser} disabled={deleting}
                      className="px-3 text-xs font-semibold py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50">
                      {deleting ? "..." : "מחק סופית"}
                    </button>
                    <button onClick={() => setConfirmDelete(false)} className="px-3 text-xs py-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
                      ביטול
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UserManagement({ users: initialUsers, currentUserId }: { users: User[]; currentUserId: string }) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", name: "", role: "SECRETARY" });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<Invitation[] | null>(null);
  const [invLoading, setInvLoading] = useState(false);
  const [resendLinks, setResendLinks] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<"users" | "invitations">("users");

  const admins = users.filter(u => u.role === "ADMIN");
  const managers = users.filter(u => u.role === "MANAGER");
  const secretaries = users.filter(u => u.role === "SECRETARY");
  const active = users.filter(u => u.isActive !== false);
  const pendingInvitations = (invitations ?? []).filter(i => i.status === "PENDING");

  function handleUpdate(id: string, changes: Partial<User>) {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...changes } : u));
    if (selectedUser?.id === id) setSelectedUser(prev => prev ? { ...prev, ...changes } : null);
  }

  function handleDelete(id: string) {
    setUsers(prev => prev.filter(u => u.id !== id));
  }

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
      setInviteError(err.error || "שגיאה");
    }
    setInviteLoading(false);
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
        <button onClick={() => { setShowInviteModal(true); setInviteLink(null); setInviteError(""); }}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm shadow-green-900/20">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          הוסף משתמש
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "סה״כ", value: users.length, color: "text-slate-700", bg: "bg-white", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
          { label: "מנהלים", value: admins.length + managers.length, color: "text-purple-700", bg: "bg-purple-50", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
          { label: "פקידים", value: secretaries.length, color: "text-blue-700", bg: "bg-blue-50", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
          { label: "פעילים", value: active.length, color: "text-green-700", bg: "bg-green-50", icon: "M5 13l4 4L19 7" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl border border-slate-200 p-4`}>
            <div className="flex items-center gap-2 mb-1">
              <svg className={`w-4 h-4 ${s.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
              </svg>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
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
          הזמנות {pendingInvitations.length > 0 && <span className="mr-1 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingInvitations.length}</span>}
        </button>
      </div>

      {/* Users list */}
      {tab === "users" && (
        <div className="space-y-2">
          {users.map(user => {
            const isActive = user.isActive !== false;
            const isMe = user.id === currentUserId;
            const isSA = user.isSuperAdmin;
            return (
              <button key={user.id} onClick={() => setSelectedUser(user)}
                className={`w-full bg-white rounded-xl border ${isActive ? "border-slate-200" : "border-slate-100 opacity-60"} p-4 text-right hover:border-green-300 hover:shadow-sm transition-all group`}>
                <div className="flex items-center gap-3">
                  <Avatar name={user.name || user.email} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-800 text-sm">{user.name || "—"}</span>
                      {isMe && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">אתה</span>}
                      {isSA && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-semibold">מנהל ראשי</span>}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${ROLE_COLORS[user.role] ?? "bg-slate-100 text-slate-600"}`}>
                        {ROLE_LABELS[user.role] ?? user.role}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {isActive ? "פעיל" : "מושבת"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5" dir="ltr">{user.email}</p>
                  </div>
                  <svg className="w-4 h-4 text-slate-300 group-hover:text-green-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </div>
              </button>
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
              <p className="text-slate-400 text-sm">אין הזמנות ממתינות</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(invitations ?? []).filter(i => i.status === "PENDING").map(inv => (
                <div key={inv.id} className="bg-white rounded-xl border border-amber-200 p-4">
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
                      <p className="text-xs text-slate-400" dir="ltr">{inv.email}</p>
                    </div>
                    <div className="flex gap-2">
                      {resendLinks[inv.id] ? (
                        <CopyButton text={resendLinks[inv.id]} />
                      ) : (
                        <button onClick={() => handleResend(inv.id)}
                          className="text-xs text-green-600 border border-green-200 hover:bg-green-50 px-2.5 py-1.5 rounded-lg transition-colors">
                          חדש קישור
                        </button>
                      )}
                      <button onClick={() => handleCancelInvitation(inv.id)}
                        className="text-xs text-red-400 hover:text-red-600 border border-red-100 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
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

      {/* User detail modal */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          currentUserId={currentUserId}
          onClose={() => setSelectedUser(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}

      {/* Invite modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">הוספת משתמש חדש</h2>
              <button onClick={() => { setShowInviteModal(false); setInviteLink(null); }} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-5">
              {inviteLink ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-green-800">ההזמנה נוצרה!</p>
                      <p className="text-xs text-green-600 mt-0.5">שלח את הקישור למשתמש החדש (תוקף 24 שעות)</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-500 font-mono break-all" dir="ltr">{inviteLink}</div>
                  <CopyButton text={inviteLink} label="העתק קישור הזמנה" />
                  <div className="flex gap-2">
                    <button onClick={() => setInviteLink(null)} className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium px-4 py-2.5 rounded-xl text-sm transition-colors">הוסף עוד</button>
                    <button onClick={() => { setShowInviteModal(false); setInviteLink(null); }} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-colors">סגור</button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleInvite} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">שם מלא *</label>
                    <input type="text" value={inviteForm.name} onChange={e => setInviteForm(p => ({ ...p, name: e.target.value }))} required placeholder="ישראל ישראלי"
                      className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">אימייל *</label>
                    <input type="email" value={inviteForm.email} onChange={e => setInviteForm(p => ({ ...p, email: e.target.value }))} required placeholder="user@example.com" dir="ltr"
                      className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">תפקיד</label>
                    <div className="space-y-2">
                      {[
                        { value: "SECRETARY", label: "פקיד/ה", desc: "הזנת נתונים בלבד" },
                        { value: "MANAGER", label: "מנהל פרויקט", desc: "ניהול אתרים וציוד" },
                        { value: "ADMIN", label: "מנהל", desc: "הרשאות מלאות" },
                      ].map(opt => (
                        <label key={opt.value} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${inviteForm.role === opt.value ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"}`}>
                          <input type="radio" name="role" value={opt.value} checked={inviteForm.role === opt.value} onChange={e => setInviteForm(p => ({ ...p, role: e.target.value }))} className="accent-green-600" />
                          <div>
                            <p className="text-sm font-bold text-gray-800">{opt.label}</p>
                            <p className="text-xs text-gray-500">{opt.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  {inviteError && <p className="text-red-500 text-xs bg-red-50 border border-red-100 px-3 py-2 rounded-xl">{inviteError}</p>}
                  <div className="flex gap-2 pt-1">
                    <button type="submit" disabled={inviteLoading} className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors">
                      {inviteLoading ? "יוצר..." : "צור קישור"}
                    </button>
                    <button type="button" onClick={() => setShowInviteModal(false)} className="border border-gray-200 text-gray-500 hover:bg-gray-50 px-4 py-2.5 rounded-xl text-sm transition-colors">ביטול</button>
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
