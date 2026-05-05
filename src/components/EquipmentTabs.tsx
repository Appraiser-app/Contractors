"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { uploadReceipt } from "@/lib/upload";
import type { Equipment, MaintenanceRecord, Insurance, EquipmentExpense, Document, FuelLog, ServiceSchedule } from "@/lib/db";

type WorkSite = { id: string; name: string; location?: string | null };

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(amount);
}
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("he-IL");
}
function isExpired(dateStr: string) {
  return new Date(dateStr).getTime() < Date.now();
}
function isExpiringSoon(dateStr: string, days = 30) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return diff > 0 && diff < days * 86400000;
}

// --- Maintenance Tab ---
function MaintenanceTab({ equipment, isAdmin }: { equipment: Equipment; isAdmin: boolean }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [showSchedForm, setShowSchedForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ description: "", cost: "", date: new Date().toISOString().slice(0, 10), mileage: "", notes: "" });
  const [schedForm, setSchedForm] = useState({ name: "", intervalHours: "", intervalKm: "", notes: "" });
  const records = equipment.maintenance || [];
  const schedules = equipment.serviceSchedules || [];

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ equipmentId: equipment.id, description: form.description, cost: form.cost ? parseFloat(form.cost) : null, date: form.date, mileage: form.mileage ? parseInt(form.mileage) : null, notes: form.notes || null }),
    });
    setForm({ description: "", cost: "", date: new Date().toISOString().slice(0, 10), mileage: "", notes: "" });
    setShowForm(false);
    setLoading(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("למחוק רשומה זו?")) return;
    await fetch(`/api/maintenance/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function handleAddSched(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/service-schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ equipmentId: equipment.id, name: schedForm.name, intervalHours: schedForm.intervalHours || null, intervalKm: schedForm.intervalKm || null, notes: schedForm.notes || null }),
    });
    setSchedForm({ name: "", intervalHours: "", intervalKm: "", notes: "" });
    setShowSchedForm(false);
    router.refresh();
  }

  async function handleDeleteSched(id: string) {
    if (!confirm("למחוק מרווח שירות זה?")) return;
    await fetch(`/api/service-schedules/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Manufacturer service schedules */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">לוח טיפולים לפי יצרן</h3>
            <p className="text-xs text-gray-400">מרווחי שירות מומלצים</p>
          </div>
          {isAdmin && (
            <button onClick={() => setShowSchedForm(!showSchedForm)} className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              הוסף מרווח
            </button>
          )}
        </div>

        {showSchedForm && (
          <form onSubmit={handleAddSched} className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">שם הטיפול *</label>
                <input type="text" value={schedForm.name} onChange={e => setSchedForm(p => ({ ...p, name: e.target.value }))} required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="החלפת שמן מנוע" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">כל כמה שעות</label>
                <input type="number" value={schedForm.intervalHours} onChange={e => setSchedForm(p => ({ ...p, intervalHours: e.target.value }))} min="1"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="250" dir="ltr" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">כל כמה ק"מ</label>
                <input type="number" value={schedForm.intervalKm} onChange={e => setSchedForm(p => ({ ...p, intervalKm: e.target.value }))} min="1"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="10000" dir="ltr" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">הערות</label>
                <input type="text" value={schedForm.notes} onChange={e => setSchedForm(p => ({ ...p, notes: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="לפי הוראות יצרן..." />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-amber-500 hover:bg-amber-400 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors">שמור</button>
              <button type="button" onClick={() => setShowSchedForm(false)} className="border border-gray-200 text-gray-600 text-sm px-4 py-1.5 rounded-lg hover:bg-gray-50">ביטול</button>
            </div>
          </form>
        )}

        {schedules.length === 0 ? (
          <p className="text-gray-400 text-xs text-center py-3 bg-amber-50 rounded-xl border border-dashed border-amber-200">לא הוגדרו מרווחי שירות עדיין</p>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {schedules.map((s: ServiceSchedule) => (
              <div key={s.id} className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5">
                <div>
                  <p className="font-medium text-gray-800 text-sm">{s.name}</p>
                  <div className="flex gap-2 mt-0.5 text-xs text-gray-400">
                    {s.intervalHours && <span>כל {s.intervalHours.toLocaleString()} שעות</span>}
                    {s.intervalHours && s.intervalKm && <span>·</span>}
                    {s.intervalKm && <span>כל {s.intervalKm.toLocaleString()} ק"מ</span>}
                    {s.notes && <span>· {s.notes}</span>}
                  </div>
                </div>
                {isAdmin && (
                  <button onClick={() => handleDeleteSched(s.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Maintenance records */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">רשומות טיפול ({records.length})</h3>
          {isAdmin && (
            <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              הוסף טיפול
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleAdd} className="bg-green-50 border border-green-100 rounded-xl p-4 mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">תיאור הטיפול *</label>
                <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" placeholder="החלפת שמן + פילטר" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">תאריך</label>
                <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" dir="ltr" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">עלות (₪)</label>
                <input type="number" value={form.cost} onChange={e => setForm(p => ({ ...p, cost: e.target.value }))} min="0"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" placeholder="500" dir="ltr" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">קילומטראז' / שעות</label>
                <input type="number" value={form.mileage} onChange={e => setForm(p => ({ ...p, mileage: e.target.value }))} min="0"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" placeholder="250" dir="ltr" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">הערות</label>
                <input type="text" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" placeholder="פרטים נוספים..." />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-500 disabled:bg-gray-200 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors">{loading ? "שומר..." : "שמור"}</button>
              <button type="button" onClick={() => setShowForm(false)} className="border border-gray-200 text-gray-600 text-sm px-4 py-1.5 rounded-lg hover:bg-gray-50">ביטול</button>
            </div>
          </form>
        )}

        {records.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">אין רשומות טיפול עדיין</p>
        ) : (
          <div className="space-y-2">
            {[...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((r: MaintenanceRecord) => (
              <div key={r.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-800 text-sm">{r.description}</p>
                  <div className="flex gap-3 mt-1 text-xs text-gray-400">
                    <span>{formatDate(r.date)}</span>
                    {r.cost != null && <span className="text-red-500">{formatCurrency(r.cost)}</span>}
                    {r.mileage && <span>{r.mileage.toLocaleString()} {r.mileage < 10000 ? 'ש"ע' : 'ק"מ'}</span>}
                  </div>
                  {r.notes && <p className="text-xs text-gray-400 mt-1">{r.notes}</p>}
                </div>
                {isAdmin && (
                  <button onClick={() => handleDelete(r.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Insurance Tab ---
function InsuranceTab({ equipment, isAdmin }: { equipment: Equipment; isAdmin: boolean }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ type: "", company: "", policyNumber: "", startDate: new Date().toISOString().slice(0, 10), endDate: "", cost: "", isPaid: false });
  const records = equipment.insurances || [];

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/insurance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ equipmentId: equipment.id, type: form.type, company: form.company || null, policyNumber: form.policyNumber || null, startDate: form.startDate, endDate: form.endDate, cost: parseFloat(form.cost) || 0, isPaid: form.isPaid }),
    });
    setForm({ type: "", company: "", policyNumber: "", startDate: new Date().toISOString().slice(0, 10), endDate: "", cost: "", isPaid: false });
    setShowForm(false);
    setLoading(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("למחוק ביטוח זה?")) return;
    await fetch(`/api/insurance/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">ביטוחים ({records.length})</h3>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            הוסף ביטוח
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">סוג ביטוח *</label>
              <input type="text" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="ביטוח חובה" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">חברת ביטוח</label>
              <input type="text" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="הראל" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">מספר פוליסה</label>
              <input type="text" value={form.policyNumber} onChange={e => setForm(p => ({ ...p, policyNumber: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" dir="ltr" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">עלות (₪)</label>
              <input type="number" value={form.cost} onChange={e => setForm(p => ({ ...p, cost: e.target.value }))} min="0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="1500" dir="ltr" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">תאריך התחלה</label>
              <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" dir="ltr" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">תאריך סיום *</label>
              <input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" dir="ltr" />
            </div>
            <div className="flex items-center gap-2 pt-4">
              <input type="checkbox" id="isPaid" checked={form.isPaid} onChange={e => setForm(p => ({ ...p, isPaid: e.target.checked }))} className="rounded" />
              <label htmlFor="isPaid" className="text-sm text-gray-600">שולם</label>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="bg-blue-500 hover:bg-blue-400 disabled:bg-gray-200 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors">{loading ? "שומר..." : "שמור"}</button>
            <button type="button" onClick={() => setShowForm(false)} className="border border-gray-200 text-gray-600 text-sm px-4 py-1.5 rounded-lg hover:bg-gray-50">ביטול</button>
          </div>
        </form>
      )}

      {records.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">אין ביטוחים רשומים</p>
      ) : (
        <div className="space-y-2">
          {[...records].sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()).map((ins: Insurance) => {
            const expired = isExpired(ins.endDate);
            const expiring = !expired && isExpiringSoon(ins.endDate);
            return (
              <div key={ins.id} className={`bg-white border rounded-xl p-4 flex items-start justify-between ${expired ? "border-red-200" : expiring ? "border-yellow-200" : "border-gray-100"}`}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-800 text-sm">{ins.type}</p>
                    {expired && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">פג תוקף</span>}
                    {expiring && <span className="text-xs bg-yellow-100 text-yellow-600 px-1.5 py-0.5 rounded">פג בקרוב</span>}
                    {ins.isPaid && <span className="text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded">שולם</span>}
                  </div>
                  <div className="flex gap-3 text-xs text-gray-400">
                    {ins.company && <span>{ins.company}</span>}
                    {ins.policyNumber && <span dir="ltr">{ins.policyNumber}</span>}
                    <span>{formatDate(ins.startDate)} — {formatDate(ins.endDate)}</span>
                    <span className="text-red-500">{formatCurrency(ins.cost)}</span>
                  </div>
                </div>
                {isAdmin && (
                  <button onClick={() => handleDelete(ins.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- Fuel Tab ---
function FuelTab({ equipment, isAdmin, sites }: { equipment: Equipment; isAdmin: boolean; sites: WorkSite[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), liters: "", pricePerLiter: "", totalCost: "", workSiteId: "", mileage: "", notes: "" });
  const logs = equipment.fuelLogs || [];

  const totalLiters = logs.reduce((s, l) => s + l.liters, 0);
  const totalCost = logs.reduce((s, l) => s + l.totalCost, 0);

  // Auto-calculate totalCost when liters or pricePerLiter changes
  function handleLitersChange(val: string) {
    const l = parseFloat(val) || 0;
    const p = parseFloat(form.pricePerLiter) || 0;
    setForm(prev => ({ ...prev, liters: val, totalCost: l && p ? (l * p).toFixed(2) : prev.totalCost }));
  }
  function handlePriceChange(val: string) {
    const p = parseFloat(val) || 0;
    const l = parseFloat(form.liters) || 0;
    setForm(prev => ({ ...prev, pricePerLiter: val, totalCost: l && p ? (l * p).toFixed(2) : prev.totalCost }));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/fuel-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ equipmentId: equipment.id, date: form.date, liters: parseFloat(form.liters), pricePerLiter: parseFloat(form.pricePerLiter), totalCost: parseFloat(form.totalCost), workSiteId: form.workSiteId || null, mileage: form.mileage || null, notes: form.notes || null }),
    });
    setForm({ date: new Date().toISOString().slice(0, 10), liters: "", pricePerLiter: "", totalCost: "", workSiteId: "", mileage: "", notes: "" });
    setShowForm(false);
    setLoading(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("למחוק רשומה זו?")) return;
    await fetch(`/api/fuel-logs/${id}`, { method: "DELETE" });
    router.refresh();
  }

  // Group by site for summary
  const bySite: Record<string, { name: string; liters: number; cost: number }> = {};
  logs.forEach(l => {
    const key = l.workSiteId || "__none__";
    const name = l.workSite?.name || "לא משויך לאתר";
    if (!bySite[key]) bySite[key] = { name, liters: 0, cost: 0 };
    bySite[key].liters += l.liters;
    bySite[key].cost += l.totalCost;
  });

  return (
    <div>
      {/* Summary */}
      {logs.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
            <p className="text-xs text-gray-400 mb-0.5">סה"כ ליטרים</p>
            <p className="text-lg font-bold text-orange-600">{totalLiters.toLocaleString("he-IL", { maximumFractionDigits: 1 })} ל'</p>
          </div>
          <div className="bg-red-50 rounded-xl p-3 border border-red-100">
            <p className="text-xs text-gray-400 mb-0.5">עלות דלק כוללת</p>
            <p className="text-lg font-bold text-red-600">{formatCurrency(totalCost)}</p>
          </div>
        </div>
      )}

      {/* By site breakdown */}
      {Object.keys(bySite).length > 1 && (
        <div className="mb-5">
          <h4 className="text-xs font-semibold text-gray-500 mb-2">דלק לפי אתר עבודה</h4>
          <div className="space-y-1.5">
            {Object.values(bySite).sort((a, b) => b.cost - a.cost).map((s, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-sm text-gray-700">{s.name}</span>
                <div className="flex gap-3 text-xs text-gray-500">
                  <span>{s.liters.toLocaleString("he-IL", { maximumFractionDigits: 1 })} ל'</span>
                  <span className="text-red-500 font-medium">{formatCurrency(s.cost)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">יומן תדלוקים ({logs.length})</h3>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-400 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            הוסף תדלוק
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">תאריך</label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" dir="ltr" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">אתר עבודה</label>
              <select value={form.workSiteId} onChange={e => setForm(p => ({ ...p, workSiteId: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
                <option value="">ללא שיוך</option>
                {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">ליטרים *</label>
              <input type="number" value={form.liters} onChange={e => handleLitersChange(e.target.value)} required min="0" step="0.1"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="50" dir="ltr" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">מחיר לליטר (₪) *</label>
              <input type="number" value={form.pricePerLiter} onChange={e => handlePriceChange(e.target.value)} required min="0" step="0.01"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="6.50" dir="ltr" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">עלות כוללת (₪) *</label>
              <input type="number" value={form.totalCost} onChange={e => setForm(p => ({ ...p, totalCost: e.target.value }))} required min="0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-orange-50" placeholder="325" dir="ltr" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">ק"מ / שעות</label>
              <input type="number" value={form.mileage} onChange={e => setForm(p => ({ ...p, mileage: e.target.value }))} min="0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="12500" dir="ltr" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">הערות</label>
              <input type="text" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="תחנת דלק, הערות..." />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="bg-orange-500 hover:bg-orange-400 disabled:bg-gray-200 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors">{loading ? "שומר..." : "שמור"}</button>
            <button type="button" onClick={() => setShowForm(false)} className="border border-gray-200 text-gray-600 text-sm px-4 py-1.5 rounded-lg hover:bg-gray-50">ביטול</button>
          </div>
        </form>
      )}

      {logs.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">אין רשומות תדלוק עדיין</p>
      ) : (
        <div className="space-y-2">
          {[...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((l: FuelLog) => (
            <div key={l.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-800">{l.liters} ל'</span>
                  <span className="text-xs text-gray-400">×</span>
                  <span className="text-xs text-gray-400">₪{l.pricePerLiter}/ל'</span>
                  <span className="text-xs font-bold text-orange-600">{formatCurrency(l.totalCost)}</span>
                </div>
                <div className="flex gap-3 text-xs text-gray-400">
                  <span>{formatDate(l.date)}</span>
                  {l.workSite && <span className="text-blue-500">{l.workSite.name}</span>}
                  {l.mileage && <span>{l.mileage.toLocaleString()} ק"מ</span>}
                  {l.notes && <span>{l.notes}</span>}
                </div>
              </div>
              {isAdmin && (
                <button onClick={() => handleDelete(l.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Expenses Tab ---
function ExpensesTab({ equipment, isAdmin, sites }: { equipment: Equipment; isAdmin: boolean; sites: WorkSite[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [form, setForm] = useState({ category: "", amount: "", description: "", date: new Date().toISOString().slice(0, 10), workSiteId: "" });
  const records = equipment.expenses || [];
  const total = records.reduce((s, e) => s + e.amount, 0);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    let receiptUrl: string | null = null;
    if (receiptFile) {
      try {
        setUploading(true);
        receiptUrl = await uploadReceipt(receiptFile, "equipment-expenses");
        setUploading(false);
      } catch {
        setLoading(false);
        setUploading(false);
        return;
      }
    }
    await fetch("/api/equipment-expense", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ equipmentId: equipment.id, category: form.category, amount: parseFloat(form.amount), description: form.description, date: form.date, receiptUrl, workSiteId: form.workSiteId || null }),
    });
    setForm({ category: "", amount: "", description: "", date: new Date().toISOString().slice(0, 10), workSiteId: "" });
    setReceiptFile(null);
    setShowForm(false);
    setLoading(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("למחוק הוצאה זו?")) return;
    await fetch(`/api/equipment-expense/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden"
        onChange={e => setReceiptFile(e.target.files?.[0] || null)} />
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-800">הוצאות ({records.length})</h3>
          {records.length > 0 && <p className="text-xs text-red-500 mt-0.5">סה"כ: {formatCurrency(total)}</p>}
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            הוסף הוצאה
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">קטגוריה *</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white">
                <option value="">בחר קטגוריה</option>
                {["דלק", "ביטוח", "טיפול", "חלקים", "שכירות", "אחר"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">סכום (₪) *</label>
              <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required min="0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" placeholder="300" dir="ltr" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">תיאור *</label>
              <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" placeholder="תיאור ההוצאה" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">תאריך</label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" dir="ltr" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">אתר עבודה (אופציונלי)</label>
              <select value={form.workSiteId} onChange={e => setForm(p => ({ ...p, workSiteId: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white">
                <option value="">ללא שיוך לאתר</option>
                {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">קבלה (אופציונלי)</label>
              {receiptFile ? (
                <div className="flex items-center gap-2 border border-green-200 bg-green-50 rounded-lg px-3 py-2">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs text-green-700 flex-1 truncate">{receiptFile.name}</span>
                  <button type="button" onClick={() => setReceiptFile(null)} className="text-xs text-green-400 hover:text-red-500">הסר</button>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 w-full border border-dashed border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  צלם או העלה קבלה
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="bg-red-400 hover:bg-red-300 disabled:bg-gray-200 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors">
              {uploading ? "מעלה קבלה..." : loading ? "שומר..." : "שמור"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="border border-gray-200 text-gray-600 text-sm px-4 py-1.5 rounded-lg hover:bg-gray-50">ביטול</button>
          </div>
        </form>
      )}

      {records.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">אין הוצאות רשומות</p>
      ) : (
        <div className="space-y-2">
          {[...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((exp: EquipmentExpense) => (
            <div key={exp.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{exp.category}</span>
                  <p className="font-medium text-gray-800 text-sm">{exp.description}</p>
                </div>
                <div className="flex gap-3 mt-1 text-xs text-gray-400">
                  <span>{formatDate(exp.date)}</span>
                  <span className="text-red-500 font-medium">{formatCurrency(exp.amount)}</span>
                  {exp.receiptUrl && (
                    <a href={exp.receiptUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-0.5 text-blue-400 hover:text-blue-600">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      קבלה
                    </a>
                  )}
                </div>
              </div>
              {isAdmin && (
                <button onClick={() => handleDelete(exp.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Documents Tab ---
const DOC_TYPE_LABELS: Record<string, string> = {
  LICENSE: "רישיון רכב", MANDATORY_INSURANCE: "ביטוח חובה", COMPREHENSIVE_INSURANCE: "ביטוח מקיף",
  ITURAN: "איתוראן", OWNERSHIP_TRANSFER: "אישור העברת בעלות", INSURANCE: "ביטוח",
  PERMIT: "אישור", CONTRACT: "חוזה", RECEIPT: "קבלה", OTHER: "אחר",
};
const DOC_TYPE_COLORS: Record<string, string> = {
  LICENSE: "bg-blue-100 text-blue-700", MANDATORY_INSURANCE: "bg-orange-100 text-orange-700",
  COMPREHENSIVE_INSURANCE: "bg-purple-100 text-purple-700", ITURAN: "bg-cyan-100 text-cyan-700",
  OWNERSHIP_TRANSFER: "bg-green-100 text-green-700", INSURANCE: "bg-orange-100 text-orange-700",
  PERMIT: "bg-yellow-100 text-yellow-700", CONTRACT: "bg-gray-100 text-gray-700",
  RECEIPT: "bg-gray-100 text-gray-600", OTHER: "bg-gray-100 text-gray-600",
};

function DocumentsTab({ equipment, isAdmin }: { equipment: Equipment; isAdmin: boolean }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [form, setForm] = useState({ title: "", type: "LICENSE" as Document["type"], expiryDate: "", notes: "" });
  const records = equipment.documents || [];

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    let fileUrl: string | null = null;
    if (docFile) {
      setUploading(true);
      try { fileUrl = await uploadReceipt(docFile, "equipment-expenses"); } catch { setLoading(false); setUploading(false); return; }
      setUploading(false);
    }
    await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ equipmentId: equipment.id, title: form.title, type: form.type, expiryDate: form.expiryDate || null, notes: form.notes || null, fileUrl }),
    });
    setForm({ title: "", type: "LICENSE", expiryDate: "", notes: "" });
    setDocFile(null);
    setShowForm(false);
    setLoading(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("למחוק מסמך זה?")) return;
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    router.refresh();
  }

  function handleTypeChange(type: string) {
    setForm(p => ({ ...p, type: type as Document["type"], title: p.title || DOC_TYPE_LABELS[type] || "" }));
  }

  return (
    <div>
      <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="hidden"
        onChange={e => setDocFile(e.target.files?.[0] || null)} />
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">מסמכים ({records.length})</h3>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            הוסף מסמך
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">סוג מסמך *</label>
              <select value={form.type} onChange={e => handleTypeChange(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white">
                <option value="LICENSE">רישיון רכב</option>
                <option value="MANDATORY_INSURANCE">ביטוח חובה</option>
                <option value="COMPREHENSIVE_INSURANCE">ביטוח מקיף</option>
                <option value="ITURAN">איתוראן</option>
                <option value="OWNERSHIP_TRANSFER">אישור העברת בעלות</option>
                <option value="PERMIT">אישור</option>
                <option value="CONTRACT">חוזה</option>
                <option value="OTHER">אחר</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">תאריך תפוגה</label>
              <input type="date" value={form.expiryDate} onChange={e => setForm(p => ({ ...p, expiryDate: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" dir="ltr" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">שם / תיאור</label>
              <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" placeholder="תיאור המסמך" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">העלאת קובץ (PDF, תמונה)</label>
              {docFile ? (
                <div className="flex items-center gap-2 border border-green-200 bg-green-50 rounded-lg px-3 py-2">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs text-green-700 flex-1 truncate">{docFile.name}</span>
                  <button type="button" onClick={() => setDocFile(null)} className="text-xs text-green-400 hover:text-red-500">הסר</button>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 w-full border border-dashed border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-400 hover:border-purple-400 hover:text-purple-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  לחץ לצירוף קובץ
                </button>
              )}
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">הערות</label>
              <input type="text" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" placeholder="מספר פוליסה, הערות..." />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading}
              className="bg-purple-500 hover:bg-purple-400 disabled:bg-gray-200 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors">
              {uploading ? "מעלה קובץ..." : loading ? "שומר..." : "שמור"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="border border-gray-200 text-gray-600 text-sm px-4 py-1.5 rounded-lg hover:bg-gray-50">ביטול</button>
          </div>
        </form>
      )}

      {records.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">אין מסמכים רשומים</p>
      ) : (
        <div className="space-y-2">
          {[...records].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((doc: Document) => {
            const expired = doc.expiryDate && isExpired(doc.expiryDate);
            const expiring = doc.expiryDate && !expired && isExpiringSoon(doc.expiryDate);
            return (
              <div key={doc.id} className={`bg-white border rounded-xl p-4 flex items-start justify-between gap-3 ${expired ? "border-red-200" : expiring ? "border-yellow-200" : "border-gray-100"}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${DOC_TYPE_COLORS[doc.type] || "bg-gray-100 text-gray-600"}`}>
                      {DOC_TYPE_LABELS[doc.type] || doc.type}
                    </span>
                    <p className="font-medium text-gray-800 text-sm truncate">{doc.title}</p>
                    {expired && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded flex-shrink-0">פג תוקף</span>}
                    {expiring && <span className="text-xs bg-yellow-100 text-yellow-600 px-1.5 py-0.5 rounded flex-shrink-0">פג בקרוב</span>}
                  </div>
                  <div className="flex gap-3 text-xs text-gray-400 flex-wrap">
                    {doc.expiryDate && <span>תפוגה: {formatDate(doc.expiryDate)}</span>}
                    {doc.notes && <span>{doc.notes}</span>}
                    {doc.fileUrl && (
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-0.5 text-blue-500 hover:text-blue-700 font-medium">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        פתח קובץ
                      </a>
                    )}
                  </div>
                </div>
                {isAdmin && (
                  <button onClick={() => handleDelete(doc.id)} className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- Analytics Tab ---
function AnalyticsTab({ equipment }: { equipment: Equipment }) {
  const fuelLogs = equipment.fuelLogs || [];
  const expenses = equipment.expenses || [];
  const maintenance = equipment.maintenance || [];
  const insurances = equipment.insurances || [];

  const totalFuel = fuelLogs.reduce((s, l) => s + l.totalCost, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalMaint = maintenance.reduce((s, m) => s + (m.cost || 0), 0);
  const totalInsurance = insurances.reduce((s, i) => s + i.cost, 0);
  const grandTotal = totalFuel + totalExpenses + totalMaint + totalInsurance;

  // Cost breakdown by category
  const categories = [
    { label: "דלק", amount: totalFuel, color: "bg-orange-400" },
    { label: "תחזוקה", amount: totalMaint, color: "bg-green-500" },
    { label: "הוצאות", amount: totalExpenses, color: "bg-red-400" },
    { label: "ביטוחים", amount: totalInsurance, color: "bg-blue-400" },
  ].filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);

  // Fuel by site
  const fuelBySite: Record<string, { name: string; liters: number; cost: number }> = {};
  fuelLogs.forEach(l => {
    const key = l.workSiteId || "__none__";
    const name = l.workSite?.name || "לא משויך";
    if (!fuelBySite[key]) fuelBySite[key] = { name, liters: 0, cost: 0 };
    fuelBySite[key].liters += l.liters;
    fuelBySite[key].cost += l.totalCost;
  });

  const fuelSites = Object.values(fuelBySite).sort((a, b) => b.cost - a.cost);

  if (grandTotal === 0) {
    return <p className="text-gray-400 text-sm text-center py-8">אין נתונים עדיין — הוסף הוצאות, תדלוקים וביטוחים</p>;
  }

  return (
    <div className="space-y-6">
      {/* Grand total */}
      <div className="bg-gray-900 rounded-2xl p-5 text-white">
        <p className="text-sm text-gray-400 mb-1">עלות כוללת לכלי</p>
        <p className="text-3xl font-bold">{formatCurrency(grandTotal)}</p>
      </div>

      {/* Category breakdown */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">פירוט לפי קטגוריה</h4>
        <div className="space-y-2">
          {categories.map(c => (
            <div key={c.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700">{c.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{grandTotal > 0 ? Math.round(c.amount / grandTotal * 100) : 0}%</span>
                  <span className="text-sm font-medium text-gray-800">{formatCurrency(c.amount)}</span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${c.color} rounded-full`} style={{ width: `${grandTotal > 0 ? c.amount / grandTotal * 100 : 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fuel by work site */}
      {fuelSites.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">דלק לפי אתר עבודה</h4>
          <div className="space-y-2">
            {fuelSites.map((s, i) => (
              <div key={i} className="flex items-center justify-between bg-orange-50 border border-orange-100 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">{s.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.liters.toLocaleString("he-IL", { maximumFractionDigits: 1 })} ליטרים</p>
                </div>
                <p className="text-sm font-bold text-orange-600">{formatCurrency(s.cost)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
          <p className="text-xs text-gray-400">מספר טיפולים</p>
          <p className="text-xl font-bold text-gray-800 mt-0.5">{maintenance.length}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
          <p className="text-xs text-gray-400">מספר תדלוקים</p>
          <p className="text-xl font-bold text-gray-800 mt-0.5">{fuelLogs.length}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
          <p className="text-xs text-gray-400">סה"כ ליטרים</p>
          <p className="text-xl font-bold text-orange-600 mt-0.5">{fuelLogs.reduce((s, l) => s + l.liters, 0).toLocaleString("he-IL", { maximumFractionDigits: 1 })}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
          <p className="text-xs text-gray-400">ביטוחים פעילים</p>
          <p className="text-xl font-bold text-blue-600 mt-0.5">{insurances.filter(i => !isExpired(i.endDate)).length}</p>
        </div>
      </div>
    </div>
  );
}

// --- Main Tabs Component ---
const TABS = [
  { id: "maintenance", label: "טיפולים" },
  { id: "fuel", label: "תדלוקים" },
  { id: "insurance", label: "ביטוחים" },
  { id: "expenses", label: "הוצאות" },
  { id: "documents", label: "מסמכים" },
  { id: "analytics", label: "ניתוח" },
];

export default function EquipmentTabs({ equipment, isAdmin }: { equipment: Equipment; isAdmin: boolean }) {
  const [activeTab, setActiveTab] = useState("maintenance");
  const [sites, setSites] = useState<WorkSite[]>([]);

  useEffect(() => {
    fetch("/api/sites").then(r => r.json()).then(data => setSites(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-gray-100">
      <div className="flex border-b border-gray-100 overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab.id ? "text-green-600 border-b-2 border-green-600" : "text-gray-400 hover:text-gray-600"}`}>
            {tab.label}
          </button>
        ))}
      </div>
      <div className="p-5">
        {activeTab === "maintenance" && <MaintenanceTab equipment={equipment} isAdmin={isAdmin} />}
        {activeTab === "fuel" && <FuelTab equipment={equipment} isAdmin={isAdmin} sites={sites} />}
        {activeTab === "insurance" && <InsuranceTab equipment={equipment} isAdmin={isAdmin} />}
        {activeTab === "expenses" && <ExpensesTab equipment={equipment} isAdmin={isAdmin} sites={sites} />}
        {activeTab === "documents" && <DocumentsTab equipment={equipment} isAdmin={isAdmin} />}
        {activeTab === "analytics" && <AnalyticsTab equipment={equipment} />}
      </div>
    </div>
  );
}
