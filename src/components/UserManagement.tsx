"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: Date | string;
};

const roleLabels: Record<string, string> = {
  ADMIN: "מנהל",
  SECRETARY: "פקיד/ה",
};

const roleColors: Record<string, string> = {
  ADMIN: "bg-amber-100 text-amber-700",
  SECRETARY: "bg-blue-100 text-blue-700",
};

export default function UserManagement({ users }: { users: User[] }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ email: "", name: "", password: "", role: "SECRETARY" });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [editingRole, setEditingRole] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    setAddError("");

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addForm),
    });

    if (res.ok) {
      setAddForm({ email: "", name: "", password: "", role: "SECRETARY" });
      setShowAdd(false);
      router.refresh();
    } else {
      const err = await res.json();
      setAddError(err.error || "שגיאה ביצירת משתמש");
    }
    setAddLoading(false);
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

  return (
    <div className="space-y-6">
      {/* Users list */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-50 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">משתמשים ({users.length})</h2>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-semibold px-3 py-2 rounded-xl text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            משתמש חדש
          </button>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="p-5 bg-amber-50 border-b border-amber-100">
            <h3 className="font-semibold text-gray-900 mb-4">הוספת משתמש חדש</h3>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">שם *</label>
                  <input
                    type="text"
                    value={addForm.name}
                    onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
                    required
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="ישראל ישראלי"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">אימייל *</label>
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))}
                    required
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="user@example.com"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">סיסמה *</label>
                  <input
                    type="password"
                    value={addForm.password}
                    onChange={(e) => setAddForm((p) => ({ ...p, password: e.target.value }))}
                    required
                    minLength={6}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="לפחות 6 תווים"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">תפקיד</label>
                  <select
                    value={addForm.role}
                    onChange={(e) => setAddForm((p) => ({ ...p, role: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    <option value="SECRETARY">פקיד/ה (הזנה בלבד)</option>
                    <option value="ADMIN">מנהל (כל ההרשאות)</option>
                  </select>
                </div>
              </div>

              {/* Permissions note */}
              <div className="bg-white rounded-xl border border-gray-100 p-3 text-xs text-gray-500">
                <strong>פקיד/ה:</strong> יכול להוסיף אתרים ותנועות חדשות, אבל לא לערוך או למחוק נתונים קיימים.
                <br />
                <strong>מנהל:</strong> הרשאות מלאות כולל עריכה, מחיקה וניהול משתמשים.
              </div>

              {addError && (
                <p className="text-red-500 text-xs">{addError}</p>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={addLoading}
                  className="bg-amber-500 hover:bg-amber-400 disabled:bg-gray-200 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
                >
                  {addLoading ? "יוצר..." : "הוסף משתמש"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="border border-gray-200 text-gray-500 hover:bg-gray-50 px-4 py-2 rounded-xl text-sm transition-colors"
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users table */}
        <div className="divide-y divide-gray-50">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-700 font-bold text-sm">{user.name.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                  <p className="text-gray-400 text-xs" dir="ltr">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {editingRole === user.id ? (
                  <div className="flex gap-2">
                    <select
                      defaultValue={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="border border-gray-200 rounded-xl px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
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
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="שנה תפקיד"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
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
    </div>
  );
}
