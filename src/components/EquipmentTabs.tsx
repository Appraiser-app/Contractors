"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { uploadReceipt } from "@/lib/upload";
import type { Equipment, MaintenanceRecord, Insurance, EquipmentExpense, Document } from "@/lib/db";

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
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ description: "", cost: "", date: new Date().toISOString().slice(0, 10), mileage: "", notes: "" });
  const records = equipment.maintenance || [];

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ equipmentId: equipment.id, description: form.description, cost: form.cost ? parseFloat(form.cost) : null, date: form.date, mileage: form.mileage ? parseInt(form.mileage) : null, notes: form.notes || null }),
    });
    if (res.ok) {
      setForm({ description: "", cost: "", date: new Date().toISOString().slice(0, 10), mileage: "", notes: "" });
      setShowForm(false);
      router.refresh();
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("למחוק רשומה זו?")) return;
    await fetch(`/api/maintenance/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">רשומות תחזוקה ({records.length})</h3>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          הוסף טיפול
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">תיאור הטיפול *</label>
              <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="החלפת שמן + פילטר" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">תאריך</label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" dir="ltr" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">עלות (₪)</label>
              <input type="number" value={form.cost} onChange={e => setForm(p => ({ ...p, cost: e.target.value }))} min="0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="500" dir="ltr" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">קילומטראז'</label>
              <input type="number" value={form.mileage} onChange={e => setForm(p => ({ ...p, mileage: e.target.value }))} min="0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="120000" dir="ltr" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">הערות</label>
              <input type="text" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="פרטים נוספים..." />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="bg-amber-500 hover:bg-amber-400 disabled:bg-gray-200 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors">{loading ? "שומר..." : "שמור"}</button>
            <button type="button" onClick={() => setShowForm(false)} className="border border-gray-200 text-gray-600 text-sm px-4 py-1.5 rounded-lg hover:bg-gray-50">ביטול</button>
          </div>
        </form>
      )}

      {records.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">אין רשומות תחזוקה עדיין</p>
      ) : (
        <div className="space-y-2">
          {[...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(r => (
            <div key={r.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-start justify-between">
              <div>
                <p className="font-medium text-gray-800 text-sm">{r.description}</p>
                <div className="flex gap-3 mt-1 text-xs text-gray-400">
                  <span>{formatDate(r.date)}</span>
                  {r.cost != null && <span className="text-red-500">{formatCurrency(r.cost)}</span>}
                  {r.mileage && <span>{r.mileage.toLocaleString()} ק"מ</span>}
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
    const res = await fetch("/api/insurance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ equipmentId: equipment.id, type: form.type, company: form.company || null, policyNumber: form.policyNumber || null, startDate: form.startDate, endDate: form.endDate, cost: parseFloat(form.cost) || 0, isPaid: form.isPaid }),
    });
    if (res.ok) {
      setForm({ type: "", company: "", policyNumber: "", startDate: new Date().toISOString().slice(0, 10), endDate: "", cost: "", isPaid: false });
      setShowForm(false);
      router.refresh();
    }
    setLoading(false);
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
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          הוסף ביטוח
        </button>
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
          {[...records].sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()).map(ins => {
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

// --- Expenses Tab ---
function ExpensesTab({ equipment, isAdmin }: { equipment: Equipment; isAdmin: boolean }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [form, setForm] = useState({ category: "", amount: "", description: "", date: new Date().toISOString().slice(0, 10) });
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
    const res = await fetch("/api/equipment-expense", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ equipmentId: equipment.id, category: form.category, amount: parseFloat(form.amount), description: form.description, date: form.date, receiptUrl }),
    });
    if (res.ok) {
      setForm({ category: "", amount: "", description: "", date: new Date().toISOString().slice(0, 10) });
      setReceiptFile(null);
      setShowForm(false);
      router.refresh();
    }
    setLoading(false);
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
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          הוסף הוצאה
        </button>
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
          {[...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(exp => (
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
function DocumentsTab({ equipment, isAdmin }: { equipment: Equipment; isAdmin: boolean }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: "", type: "LICENSE" as Document["type"], expiryDate: "", notes: "" });
  const records = equipment.documents || [];

  const docTypeLabel: Record<string, string> = {
    LICENSE: "רישיון", INSURANCE: "ביטוח", PERMIT: "אישור", CONTRACT: "חוזה", RECEIPT: "קבלה", OTHER: "אחר"
  };

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ equipmentId: equipment.id, title: form.title, type: form.type, expiryDate: form.expiryDate || null, notes: form.notes || null, fileUrl: null }),
    });
    if (res.ok) {
      setForm({ title: "", type: "LICENSE", expiryDate: "", notes: "" });
      setShowForm(false);
      router.refresh();
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("למחוק מסמך זה?")) return;
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">מסמכים ({records.length})</h3>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          הוסף מסמך
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">שם המסמך *</label>
              <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" placeholder="רישיון רכב" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">סוג</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as Document["type"] }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white">
                {Object.entries(docTypeLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">תאריך תפוגה</label>
              <input type="date" value={form.expiryDate} onChange={e => setForm(p => ({ ...p, expiryDate: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" dir="ltr" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">הערות</label>
              <input type="text" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="bg-purple-500 hover:bg-purple-400 disabled:bg-gray-200 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors">{loading ? "שומר..." : "שמור"}</button>
            <button type="button" onClick={() => setShowForm(false)} className="border border-gray-200 text-gray-600 text-sm px-4 py-1.5 rounded-lg hover:bg-gray-50">ביטול</button>
          </div>
        </form>
      )}

      {records.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">אין מסמכים רשומים</p>
      ) : (
        <div className="space-y-2">
          {[...records].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(doc => {
            const expired = doc.expiryDate && isExpired(doc.expiryDate);
            const expiring = doc.expiryDate && !expired && isExpiringSoon(doc.expiryDate);
            return (
              <div key={doc.id} className={`bg-white border rounded-xl p-4 flex items-start justify-between ${expired ? "border-red-200" : expiring ? "border-yellow-200" : "border-gray-100"}`}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">{docTypeLabel[doc.type]}</span>
                    <p className="font-medium text-gray-800 text-sm">{doc.title}</p>
                    {expired && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">פג תוקף</span>}
                    {expiring && <span className="text-xs bg-yellow-100 text-yellow-600 px-1.5 py-0.5 rounded">פג בקרוב</span>}
                  </div>
                  <div className="flex gap-3 text-xs text-gray-400">
                    {doc.expiryDate && <span>תפוגה: {formatDate(doc.expiryDate)}</span>}
                    {doc.notes && <span>{doc.notes}</span>}
                  </div>
                </div>
                {isAdmin && (
                  <button onClick={() => handleDelete(doc.id)} className="text-gray-300 hover:text-red-500 transition-colors">
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

// --- Main Tabs Component ---
const TABS = [
  { id: "maintenance", label: "תחזוקות" },
  { id: "insurance", label: "ביטוחים" },
  { id: "expenses", label: "הוצאות" },
  { id: "documents", label: "מסמכים" },
];

export default function EquipmentTabs({ equipment, isAdmin }: { equipment: Equipment; isAdmin: boolean }) {
  const [activeTab, setActiveTab] = useState("maintenance");

  return (
    <div className="bg-white rounded-2xl border border-gray-100">
      <div className="flex border-b border-gray-100">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === tab.id ? "text-amber-600 border-b-2 border-amber-500" : "text-gray-400 hover:text-gray-600"}`}>
            {tab.label}
          </button>
        ))}
      </div>
      <div className="p-5">
        {activeTab === "maintenance" && <MaintenanceTab equipment={equipment} isAdmin={isAdmin} />}
        {activeTab === "insurance" && <InsuranceTab equipment={equipment} isAdmin={isAdmin} />}
        {activeTab === "expenses" && <ExpensesTab equipment={equipment} isAdmin={isAdmin} />}
        {activeTab === "documents" && <DocumentsTab equipment={equipment} isAdmin={isAdmin} />}
      </div>
    </div>
  );
}
