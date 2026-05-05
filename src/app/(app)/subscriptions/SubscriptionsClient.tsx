"use client";

import { useState } from "react";

type SubscriptionType = "ביטוח" | "איתוראן" | "מנוי תוכנה" | "רישיון" | "אחר";
type BillingCycle = "חודשי" | "רבעוני" | "חצי שנתי" | "שנתי";
type AppointmentStatus = "PENDING" | "DONE" | "CANCELLED";

type Subscription = {
  id: string; name: string; type: SubscriptionType; provider: string | null;
  amount: number; billingCycle: BillingCycle; nextRenewal: string;
  notes: string | null; isActive: boolean;
  equipmentId: string | null; equipmentName: string | null;
  createdAt: string;
};

type MaintenanceAppointment = {
  id: string; equipmentId: string; equipmentName: string;
  description: string; scheduledDate: string; estimatedCost: number | null;
  status: AppointmentStatus; notes: string | null; createdAt: string;
};

type EquipmentItem = {
  id: string; name: string;
  serviceSchedules: { id: string; name: string; intervalHours: number | null; intervalKm: number | null }[];
};

const SUB_TYPES: SubscriptionType[] = ["ביטוח", "איתוראן", "מנוי תוכנה", "רישיון", "אחר"];
const BILLING_CYCLES: BillingCycle[] = ["חודשי", "רבעוני", "חצי שנתי", "שנתי"];

const TYPE_COLORS: Record<SubscriptionType, string> = {
  "ביטוח":       "bg-blue-100 text-blue-700",
  "איתוראן":     "bg-cyan-100 text-cyan-700",
  "מנוי תוכנה":  "bg-purple-100 text-purple-700",
  "רישיון":      "bg-amber-100 text-amber-700",
  "אחר":         "bg-gray-100 text-gray-600",
};

const CYCLE_MONTHS: Record<BillingCycle, number> = {
  "חודשי": 1, "רבעוני": 3, "חצי שנתי": 6, "שנתי": 12,
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(n);
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString("he-IL", { day: "numeric", month: "short", year: "numeric" });
}
function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}
function today() { return new Date().toISOString().split("T")[0]; }

function RenewalBadge({ dateStr }: { dateStr: string }) {
  const days = daysUntil(dateStr);
  if (days < 0) return <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">פג תוקף לפני {Math.abs(days)} ימים</span>;
  if (days <= 14) return <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">חידוש בעוד {days} ימים!</span>;
  if (days <= 30) return <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-medium">חידוש בעוד {days} ימים</span>;
  return <span className="text-xs text-gray-400">{formatDate(dateStr)}</span>;
}

// ─── Subscriptions Tab ───────────────────────────────────────────────
function SubscriptionsTab({
  subs, equipment, isAdmin,
  onAdd, onDelete, onRenew, onToggleActive,
}: {
  subs: Subscription[]; equipment: EquipmentItem[]; isAdmin: boolean;
  onAdd: (s: Subscription) => void;
  onDelete: (id: string) => void;
  onRenew: (id: string, nextRenewal: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", type: "ביטוח" as SubscriptionType, provider: "",
    amount: "", billingCycle: "שנתי" as BillingCycle,
    nextRenewal: "", notes: "", equipmentId: "",
  });

  const expiringSoon = subs.filter(s => s.isActive && daysUntil(s.nextRenewal) <= 30);
  const active = subs.filter(s => s.isActive);
  const inactive = subs.filter(s => !s.isActive);

  // Monthly cost total
  const monthlyTotal = active.reduce((sum, s) => sum + s.amount / CYCLE_MONTHS[s.billingCycle], 0);
  const yearlyTotal = active.reduce((sum, s) => sum + (s.amount * 12 / CYCLE_MONTHS[s.billingCycle]), 0);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const eq = equipment.find(x => x.id === form.equipmentId);
    const res = await fetch("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name, type: form.type, provider: form.provider || null,
        amount: form.amount, billingCycle: form.billingCycle,
        nextRenewal: form.nextRenewal, notes: form.notes || null,
        equipmentId: form.equipmentId || null, equipmentName: eq?.name || null,
      }),
    });
    if (res.ok) {
      onAdd(await res.json());
      setForm({ name: "", type: "ביטוח", provider: "", amount: "", billingCycle: "שנתי", nextRenewal: "", notes: "", equipmentId: "" });
      setShowForm(false);
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("למחוק מנוי זה?")) return;
    await fetch(`/api/subscriptions/${id}`, { method: "DELETE" });
    onDelete(id);
  }

  async function handleRenew(sub: Subscription) {
    // Calculate next renewal date based on billing cycle
    const current = new Date(sub.nextRenewal);
    const months = CYCLE_MONTHS[sub.billingCycle];
    current.setMonth(current.getMonth() + months);
    const nextRenewal = current.toISOString().split("T")[0];
    await fetch(`/api/subscriptions/${sub.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nextRenewal }),
    });
    onRenew(sub.id, nextRenewal);
  }

  async function handleToggleActive(sub: Subscription) {
    await fetch(`/api/subscriptions/${sub.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !sub.isActive }),
    });
    onToggleActive(sub.id, !sub.isActive);
  }

  return (
    <div>
      {/* Alert banner */}
      {expiringSoon.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-yellow-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-sm text-yellow-700 font-medium">
            {expiringSoon.length} מנוי{expiringSoon.length > 1 ? "ם" : ""} מתחדש{expiringSoon.length > 1 ? "ים" : ""} בקרוב:{" "}
            {expiringSoon.map(s => s.name).join(", ")}
          </p>
        </div>
      )}

      {/* Summary row */}
      {active.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <p className="text-xs text-gray-400">עלות חודשית משוערת</p>
            <p className="text-lg font-bold text-blue-700 mt-0.5">{formatCurrency(Math.round(monthlyTotal))}</p>
          </div>
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
            <p className="text-xs text-gray-400">עלות שנתית משוערת</p>
            <p className="text-lg font-bold text-indigo-700 mt-0.5">{formatCurrency(Math.round(yearlyTotal))}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">מנויים פעילים ({active.length})</h3>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            הוסף מנוי
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleAdd} className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">שם המנוי *</label>
              <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="ביטוח חובה משאית, איתוראן..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">סוג *</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as SubscriptionType }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {SUB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">ספק / חברה</label>
              <input type="text" value={form.provider} onChange={e => setForm(p => ({ ...p, provider: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="הראל, איתוראן..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">עלות (₪) *</label>
              <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required min="0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="1200" dir="ltr" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">תדירות תשלום *</label>
              <select value={form.billingCycle} onChange={e => setForm(p => ({ ...p, billingCycle: e.target.value as BillingCycle }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {BILLING_CYCLES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">תאריך חידוש הבא *</label>
              <input type="date" value={form.nextRenewal} onChange={e => setForm(p => ({ ...p, nextRenewal: e.target.value }))} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" dir="ltr" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">כלי קשור (אופציונלי)</label>
              <select value={form.equipmentId} onChange={e => setForm(p => ({ ...p, equipmentId: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">ללא שיוך</option>
                {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">הערות</label>
              <input type="text" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="מספר פוליסה, הערות..." />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-200 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors">
              {loading ? "שומר..." : "שמור"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="border border-gray-200 text-gray-600 text-sm px-4 py-1.5 rounded-lg hover:bg-gray-50">ביטול</button>
          </div>
        </form>
      )}

      {/* Active subscriptions */}
      {active.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">אין מנויים פעילים</p>
      ) : (
        <div className="space-y-2 mb-6">
          {[...active].sort((a, b) => new Date(a.nextRenewal).getTime() - new Date(b.nextRenewal).getTime()).map(sub => {
            const days = daysUntil(sub.nextRenewal);
            const isUrgent = days <= 14;
            const isWarning = days > 14 && days <= 30;
            return (
              <div key={sub.id} className={`bg-white border rounded-2xl p-4 ${isUrgent ? "border-red-200" : isWarning ? "border-yellow-200" : "border-gray-100"}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${TYPE_COLORS[sub.type]}`}>{sub.type}</span>
                      <p className="font-semibold text-gray-800 text-sm">{sub.name}</p>
                      {sub.equipmentName && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{sub.equipmentName}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                      {sub.provider && <span>{sub.provider}</span>}
                      <span className="font-medium text-gray-700">{formatCurrency(sub.amount)} / {sub.billingCycle}</span>
                      <span>·</span>
                      <RenewalBadge dateStr={sub.nextRenewal} />
                    </div>
                    {sub.notes && <p className="text-xs text-gray-400 mt-1">{sub.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isAdmin && (
                      <>
                        <button onClick={() => handleRenew(sub)} title="חדש"
                          className="text-xs border border-green-200 text-green-600 hover:bg-green-50 px-2 py-1 rounded-lg transition-colors">
                          חדש
                        </button>
                        <button onClick={() => handleToggleActive(sub)} title="השבת"
                          className="text-xs border border-gray-200 text-gray-500 hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors">
                          השבת
                        </button>
                        <button onClick={() => handleDelete(sub.id)}
                          className="text-gray-300 hover:text-red-400 transition-colors p-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inactive subscriptions */}
      {inactive.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-400 text-sm mb-2">לא פעילים ({inactive.length})</h3>
          <div className="space-y-2">
            {inactive.map(sub => (
              <div key={sub.id} className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex items-center justify-between opacity-60">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${TYPE_COLORS[sub.type]}`}>{sub.type}</span>
                    <p className="text-sm text-gray-600">{sub.name}</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{formatCurrency(sub.amount)} / {sub.billingCycle}</p>
                </div>
                {isAdmin && (
                  <div className="flex gap-1.5">
                    <button onClick={() => handleToggleActive(sub)}
                      className="text-xs border border-gray-200 text-gray-500 hover:bg-gray-100 px-2 py-1 rounded-lg">הפעל</button>
                    <button onClick={() => handleDelete(sub.id)} className="text-gray-300 hover:text-red-400 p-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Maintenance Appointments Tab ─────────────────────────────────────
function AppointmentsTab({
  appointments, equipment, isAdmin,
  onAdd, onStatusChange, onDelete,
}: {
  appointments: MaintenanceAppointment[]; equipment: EquipmentItem[]; isAdmin: boolean;
  onAdd: (a: MaintenanceAppointment) => void;
  onStatusChange: (id: string, status: AppointmentStatus) => void;
  onDelete: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedEqId, setSelectedEqId] = useState("");
  const [form, setForm] = useState({
    equipmentId: "", description: "", scheduledDate: "", estimatedCost: "", notes: "",
  });

  const selectedEq = equipment.find(e => e.id === (form.equipmentId || selectedEqId));

  const pending = appointments.filter(a => a.status === "PENDING");
  const done = appointments.filter(a => a.status === "DONE");
  const overdue = pending.filter(a => a.scheduledDate < today());

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const eq = equipment.find(x => x.id === form.equipmentId);
    const res = await fetch("/api/maintenance-appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        equipmentId: form.equipmentId, equipmentName: eq?.name || "",
        description: form.description, scheduledDate: form.scheduledDate,
        estimatedCost: form.estimatedCost || null, notes: form.notes || null,
      }),
    });
    if (res.ok) {
      onAdd(await res.json());
      setForm({ equipmentId: "", description: "", scheduledDate: "", estimatedCost: "", notes: "" });
      setSelectedEqId("");
      setShowForm(false);
    }
    setLoading(false);
  }

  async function handleStatus(id: string, status: AppointmentStatus) {
    await fetch(`/api/maintenance-appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    onStatusChange(id, status);
  }

  async function handleDelete(id: string) {
    if (!confirm("למחוק תור זה?")) return;
    await fetch(`/api/maintenance-appointments/${id}`, { method: "DELETE" });
    onDelete(id);
  }

  const STATUS_LABELS: Record<AppointmentStatus, string> = { PENDING: "ממתין", DONE: "בוצע", CANCELLED: "בוטל" };
  const STATUS_COLORS: Record<AppointmentStatus, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    DONE: "bg-green-100 text-green-700",
    CANCELLED: "bg-gray-100 text-gray-500",
  };

  return (
    <div>
      {overdue.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-700 font-medium">
            {overdue.length} טיפול{overdue.length > 1 ? "ים" : ""} באיחור: {overdue.map(a => a.equipmentName).join(", ")}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">טיפולים מתוכננים ({pending.length})</h3>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            קבע טיפול
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">כלי *</label>
              <select value={form.equipmentId}
                onChange={e => { setForm(p => ({ ...p, equipmentId: e.target.value, description: "" })); setSelectedEqId(e.target.value); }}
                required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
                <option value="">בחר כלי</option>
                {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">תאריך טיפול *</label>
              <input type="date" value={form.scheduledDate} onChange={e => setForm(p => ({ ...p, scheduledDate: e.target.value }))} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" dir="ltr" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">סוג טיפול *</label>
              {selectedEq && selectedEq.serviceSchedules.length > 0 ? (
                <select value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="">בחר סוג טיפול</option>
                  {selectedEq.serviceSchedules.map(s => (
                    <option key={s.id} value={s.name}>
                      {s.name}{s.intervalHours ? ` (כל ${s.intervalHours} ש"ע)` : ""}{s.intervalKm ? ` (כל ${s.intervalKm} ק"מ)` : ""}
                    </option>
                  ))}
                  <option value="__custom__">אחר (הקלד ידנית)</option>
                </select>
              ) : (
                <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="החלפת שמן, בדיקה תקופתית..." />
              )}
              {form.description === "__custom__" && (
                <input type="text" onChange={e => setForm(p => ({ ...p, description: e.target.value === "" ? "__custom__" : e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="תאר את הטיפול..." />
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">עלות משוערת (₪)</label>
              <input type="number" value={form.estimatedCost} onChange={e => setForm(p => ({ ...p, estimatedCost: e.target.value }))} min="0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="500" dir="ltr" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">הערות</label>
              <input type="text" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="פרטים..." />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading}
              className="bg-amber-500 hover:bg-amber-400 disabled:bg-gray-200 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors">
              {loading ? "שומר..." : "קבע תור"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="border border-gray-200 text-gray-600 text-sm px-4 py-1.5 rounded-lg hover:bg-gray-50">ביטול</button>
          </div>
        </form>
      )}

      {pending.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">אין טיפולים מתוכננים</p>
      ) : (
        <div className="space-y-2 mb-6">
          {[...pending].sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate)).map(appt => {
            const isOverdue = appt.scheduledDate < today();
            const daysLeft = daysUntil(appt.scheduledDate);
            return (
              <div key={appt.id} className={`bg-white border rounded-2xl p-4 ${isOverdue ? "border-red-200" : "border-gray-100"}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-medium bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">{appt.equipmentName}</span>
                      <p className="font-semibold text-gray-800 text-sm">{appt.description}</p>
                      {isOverdue && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">באיחור {Math.abs(daysLeft)} ימים</span>}
                    </div>
                    <div className="flex gap-3 text-xs text-gray-400">
                      <span>{formatDate(appt.scheduledDate)}</span>
                      {!isOverdue && daysLeft <= 7 && <span className="text-orange-500">עוד {daysLeft} ימים</span>}
                      {appt.estimatedCost != null && <span>{formatCurrency(appt.estimatedCost)} משוער</span>}
                      {appt.notes && <span>{appt.notes}</span>}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => handleStatus(appt.id, "DONE")}
                        className="text-xs border border-green-200 text-green-600 hover:bg-green-50 px-2 py-1 rounded-lg transition-colors">
                        בוצע
                      </button>
                      <button onClick={() => handleStatus(appt.id, "CANCELLED")}
                        className="text-xs border border-gray-200 text-gray-500 hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors">
                        בטל
                      </button>
                      <button onClick={() => handleDelete(appt.id)} className="text-gray-300 hover:text-red-400 p-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Done history */}
      {done.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-400 text-sm mb-2">טיפולים שבוצעו ({done.length})</h3>
          <div className="space-y-2">
            {[...done].sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate)).slice(0, 10).map(appt => (
              <div key={appt.id} className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex items-center justify-between opacity-70">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${STATUS_COLORS[appt.status]}`}>{STATUS_LABELS[appt.status]}</span>
                    <span className="text-xs font-medium text-gray-500">{appt.equipmentName}</span>
                    <p className="text-sm text-gray-600">{appt.description}</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(appt.scheduledDate)}</p>
                </div>
                {isAdmin && (
                  <button onClick={() => handleDelete(appt.id)} className="text-gray-300 hover:text-red-400 p-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────
const TABS = [
  { id: "subscriptions", label: "מנויים וביטוחים" },
  { id: "appointments", label: "טיפולים מתוכננים" },
];

export default function SubscriptionsClient({
  initialSubscriptions, initialAppointments, equipmentList, isAdmin,
}: {
  initialSubscriptions: Subscription[];
  initialAppointments: MaintenanceAppointment[];
  equipmentList: EquipmentItem[];
  isAdmin: boolean;
}) {
  const [activeTab, setActiveTab] = useState("subscriptions");
  const [subs, setSubs] = useState<Subscription[]>(initialSubscriptions);
  const [appointments, setAppointments] = useState<MaintenanceAppointment[]>(initialAppointments);

  // Upcoming alerts counts for tab badges
  const urgentSubs = subs.filter(s => s.isActive && daysUntil(s.nextRenewal) <= 30).length;
  const overdueAppts = appointments.filter(a => a.status === "PENDING" && a.scheduledDate < today()).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">מנויים וטיפולים</h1>
        <p className="text-gray-500 text-sm mt-1">ביטוחים, איתוראן, מנויים וקביעת טיפולים לכלים</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="flex border-b border-gray-100">
          {TABS.map(tab => {
            const badge = tab.id === "subscriptions" ? urgentSubs : overdueAppts;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3.5 text-sm font-medium transition-colors relative ${
                  activeTab === tab.id ? "text-green-600 border-b-2 border-green-600" : "text-gray-400 hover:text-gray-600"
                }`}>
                {tab.label}
                {badge > 0 && (
                  <span className="absolute top-2.5 mr-1 inline-flex items-center justify-center w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="p-5">
          {activeTab === "subscriptions" && (
            <SubscriptionsTab
              subs={subs} equipment={equipmentList} isAdmin={isAdmin}
              onAdd={s => setSubs(p => [s, ...p])}
              onDelete={id => setSubs(p => p.filter(s => s.id !== id))}
              onRenew={(id, nextRenewal) => setSubs(p => p.map(s => s.id === id ? { ...s, nextRenewal } : s))}
              onToggleActive={(id, isActive) => setSubs(p => p.map(s => s.id === id ? { ...s, isActive } : s))}
            />
          )}
          {activeTab === "appointments" && (
            <AppointmentsTab
              appointments={appointments} equipment={equipmentList} isAdmin={isAdmin}
              onAdd={a => setAppointments(p => [a, ...p])}
              onStatusChange={(id, status) => setAppointments(p => p.map(a => a.id === id ? { ...a, status } : a))}
              onDelete={id => setAppointments(p => p.filter(a => a.id !== id))}
            />
          )}
        </div>
      </div>
    </div>
  );
}
