"use client";

import { useMemo, useState } from "react";

type FuelLog = {
  id: string;
  equipmentId: string;
  equipmentName?: string | null;
  date: string;
  liters: number;
  pricePerLiter: number;
  totalCost: number;
  workSiteId: string | null;
  workSite?: { id: string; name: string; location?: string | null } | null;
  mileage?: number | null;
  notes?: string | null;
};

type Equipment = { id: string; name: string; type: string };
type Site = { id: string; name: string; location?: string | null };

const NIS = (n: number) =>
  new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(n);

function fmt(ts: string) {
  return new Date(ts).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function isoWeek(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const wn = Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7) + 1;
  return `${d.getFullYear()}-W${String(wn).padStart(2, "0")}`;
}

function BarChart({ data }: { data: { label: string; liters: number; cost: number }[] }) {
  const max = Math.max(...data.map(d => d.liters), 1);
  return (
    <div className="space-y-2">
      {data.map(d => (
        <div key={d.label}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-600 font-medium">{d.label}</span>
            <span className="text-slate-500">{d.liters.toFixed(0)} ל׳ · {NIS(d.cost)}</span>
          </div>
          <div className="h-5 bg-slate-100 rounded-lg overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-lg transition-all"
              style={{ width: `${(d.liters / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FuelClient({ initialLogs, equipment, sites }: {
  initialLogs: FuelLog[];
  equipment: Equipment[];
  sites: Site[];
}) {
  const [logs, setLogs] = useState<FuelLog[]>(initialLogs);
  const [tab, setTab] = useState<"stats" | "site" | "equipment" | "log">("stats");
  const [period, setPeriod] = useState<"week" | "month">("month");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ equipmentId: "", date: new Date().toISOString().slice(0, 10), liters: "", pricePerLiter: "", workSiteId: "", mileage: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filterEquip, setFilterEquip] = useState("all");
  const [filterSite, setFilterSite] = useState("all");

  const totalCost = useMemo(() => logs.reduce((s, l) => s + l.totalCost, 0), [logs]);
  const totalLiters = useMemo(() => logs.reduce((s, l) => s + l.liters, 0), [logs]);
  const avgPrice = totalLiters > 0 ? totalCost / totalLiters : 0;

  // This month stats
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const thisWeek = isoWeek(now);
  const monthLogs = logs.filter(l => l.date.slice(0, 7) === thisMonth);
  const weekLogs = logs.filter(l => isoWeek(new Date(l.date)) === thisWeek);

  // Monthly chart data (last 6 months)
  const monthlyData = useMemo(() => {
    const map: Record<string, { liters: number; cost: number }> = {};
    logs.forEach(l => {
      const m = l.date.slice(0, 7);
      if (!map[m]) map[m] = { liters: 0, cost: 0 };
      map[m].liters += l.liters;
      map[m].cost += l.totalCost;
    });
    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([m, v]) => ({
        label: new Date(`${m}-01`).toLocaleDateString("he-IL", { month: "short", year: "2-digit" }),
        ...v,
      }));
  }, [logs]);

  // Weekly chart data (last 8 weeks)
  const weeklyData = useMemo(() => {
    const map: Record<string, { liters: number; cost: number }> = {};
    logs.forEach(l => {
      const w = isoWeek(new Date(l.date));
      if (!map[w]) map[w] = { liters: 0, cost: 0 };
      map[w].liters += l.liters;
      map[w].cost += l.totalCost;
    });
    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-8)
      .map(([w, v]) => ({ label: `שבוע ${w.split("-W")[1]}`, ...v }));
  }, [logs]);

  // Per-site breakdown
  const siteBreakdown = useMemo(() => {
    const map: Record<string, { siteId: string; siteName: string; liters: number; cost: number; days: Set<string>; entries: number }> = {};
    logs.forEach(l => {
      const key = l.workSiteId || "__none__";
      const name = l.workSite?.name || "ללא אתר";
      if (!map[key]) map[key] = { siteId: key, siteName: name, liters: 0, cost: 0, days: new Set(), entries: 0 };
      map[key].liters += l.liters;
      map[key].cost += l.totalCost;
      map[key].days.add(l.date);
      map[key].entries++;
    });
    return Object.values(map)
      .map(v => ({ ...v, days: v.days.size }))
      .sort((a, b) => b.cost - a.cost);
  }, [logs]);

  // Per-equipment breakdown
  const equipBreakdown = useMemo(() => {
    const map: Record<string, { equipId: string; name: string; liters: number; cost: number; entries: number; lastDate: string }> = {};
    logs.forEach(l => {
      const name = l.equipmentName || l.equipmentId;
      if (!map[l.equipmentId]) map[l.equipmentId] = { equipId: l.equipmentId, name, liters: 0, cost: 0, entries: 0, lastDate: l.date };
      map[l.equipmentId].liters += l.liters;
      map[l.equipmentId].cost += l.totalCost;
      map[l.equipmentId].entries++;
      if (l.date > map[l.equipmentId].lastDate) map[l.equipmentId].lastDate = l.date;
    });
    return Object.values(map).sort((a, b) => b.cost - a.cost);
  }, [logs]);

  // Filtered log
  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      if (filterEquip !== "all" && l.equipmentId !== filterEquip) return false;
      if (filterSite !== "all" && (l.workSiteId || "__none__") !== filterSite) return false;
      return true;
    });
  }, [logs, filterEquip, filterSite]);

  const totalCostCalc = Number.parseFloat(form.liters || "0") * Number.parseFloat(form.pricePerLiter || "0");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.equipmentId || !form.liters || !form.pricePerLiter) return;
    setSaving(true);
    const res = await fetch("/api/fuel-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, liters: Number.parseFloat(form.liters), pricePerLiter: Number.parseFloat(form.pricePerLiter), totalCost: totalCostCalc, workSiteId: form.workSiteId || null, mileage: form.mileage || null }),
    });
    if (res.ok) {
      const newLog = await res.json();
      const equip = equipment.find(e => e.id === newLog.equipmentId);
      const site = sites.find(s => s.id === newLog.workSiteId);
      setLogs(prev => [{ ...newLog, equipmentName: equip?.name || null, workSite: site ? { id: site.id, name: site.name } : null }, ...prev]);
      setForm({ equipmentId: "", date: new Date().toISOString().slice(0, 10), liters: "", pricePerLiter: "", workSiteId: "", mileage: "", notes: "" });
      setShowForm(false);
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("למחוק רשומת תדלוק?")) return;
    setDeleting(id);
    const res = await fetch(`/api/fuel-logs/${id}`, { method: "DELETE" });
    if (res.ok) setLogs(prev => prev.filter(l => l.id !== id));
    setDeleting(null);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ניהול דלק ותדלוקים</h1>
          <p className="text-slate-500 text-sm mt-0.5">{logs.length} רשומות תדלוק</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          תדלוק חדש
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleAdd} className="bg-white border border-blue-200 rounded-2xl p-5 mb-6 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">רישום תדלוק חדש</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">ציוד *</label>
              <select value={form.equipmentId} onChange={e => setForm(p => ({ ...p, equipmentId: e.target.value }))} required
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">בחר ציוד</option>
                {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">אתר עבודה</label>
              <select value={form.workSiteId} onChange={e => setForm(p => ({ ...p, workSiteId: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">ללא אתר</option>
                {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">תאריך *</label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">ליטרים *</label>
              <input type="number" step="0.1" placeholder="0.0" value={form.liters} onChange={e => setForm(p => ({ ...p, liters: e.target.value }))} required
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">מחיר לליטר *</label>
              <input type="number" step="0.01" placeholder="0.00" value={form.pricePerLiter} onChange={e => setForm(p => ({ ...p, pricePerLiter: e.target.value }))} required
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">ק״מ / שעות מד</label>
              <input type="number" placeholder="אופציונלי" value={form.mileage} onChange={e => setForm(p => ({ ...p, mileage: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2 sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-500 mb-1">הערות</label>
              <input type="text" placeholder="אופציונלי" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          {form.liters && form.pricePerLiter && (
            <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-2 rounded-xl">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              עלות כוללת: {NIS(totalCostCalc)}
            </div>
          )}
          <div className="flex gap-2 mt-4">
            <button type="submit" disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
              {saving ? "שומר..." : "שמור תדלוק"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="border border-slate-200 text-slate-500 hover:bg-slate-50 px-5 py-2.5 rounded-xl text-sm transition-colors">
              ביטול
            </button>
          </div>
        </form>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "החודש — ליטרים", value: `${monthLogs.reduce((s, l) => s + l.liters, 0).toFixed(0)} ל׳`, sub: `${NIS(monthLogs.reduce((s, l) => s + l.totalCost, 0))}`, color: "text-blue-700", bg: "bg-blue-50" },
          { label: "השבוע — ליטרים", value: `${weekLogs.reduce((s, l) => s + l.liters, 0).toFixed(0)} ל׳`, sub: `${NIS(weekLogs.reduce((s, l) => s + l.totalCost, 0))}`, color: "text-purple-700", bg: "bg-purple-50" },
          { label: "סה״כ עלות", value: NIS(totalCost), sub: `${totalLiters.toFixed(0)} ליטרים`, color: "text-green-700", bg: "bg-green-50" },
          { label: "ממוצע לליטר", value: `₪${avgPrice.toFixed(2)}`, sub: `${logs.length} תדלוקים`, color: "text-amber-700", bg: "bg-amber-50" },
        ].map(c => (
          <div key={c.label} className={`${c.bg} rounded-xl border border-slate-200 p-4`}>
            <p className="text-xs text-slate-500 mb-1">{c.label}</p>
            <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-5 overflow-x-auto">
        {([["stats", "📊 סטטיסטיקות"], ["site", "🏗️ לפי אתר"], ["equipment", "🚜 לפי ציוד"], ["log", "📋 יומן תדלוקים"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${tab === key ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Stats tab */}
      {tab === "stats" && (
        <div className="space-y-5">
          <div className="flex gap-2 mb-2">
            {(["month", "week"] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${period === p ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-blue-300"}`}>
                {p === "month" ? "חודשי" : "שבועי"}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-bold text-slate-800 mb-4">
              {period === "month" ? "צריכת דלק לפי חודש (6 חודשים אחרונים)" : "צריכת דלק לפי שבוע (8 שבועות אחרונים)"}
            </h3>
            {(period === "month" ? monthlyData : weeklyData).length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">אין נתונים עדיין</p>
            ) : (
              <BarChart data={period === "month" ? monthlyData : weeklyData} />
            )}
          </div>

          {/* Top consumers */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-bold text-slate-800 mb-3">הציוד הכי צורכני</h3>
              <div className="space-y-2">
                {equipBreakdown.slice(0, 5).map((e, i) => (
                  <div key={e.equipId} className="flex items-center gap-3">
                    <span className="w-5 h-5 bg-slate-100 rounded-full text-xs font-bold text-slate-500 flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{e.name}</p>
                      <p className="text-xs text-slate-400">{e.liters.toFixed(0)} ל׳ · {e.entries} תדלוקים</p>
                    </div>
                    <span className="text-sm font-bold text-blue-700 flex-shrink-0">{NIS(e.cost)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-bold text-slate-800 mb-3">האתרים הכי יקרים בדלק</h3>
              <div className="space-y-2">
                {siteBreakdown.filter(s => s.siteId !== "__none__").slice(0, 5).map((s, i) => (
                  <div key={s.siteId} className="flex items-center gap-3">
                    <span className="w-5 h-5 bg-slate-100 rounded-full text-xs font-bold text-slate-500 flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{s.siteName}</p>
                      <p className="text-xs text-slate-400">{s.liters.toFixed(0)} ל׳ · {s.days} ימי עבודה</p>
                    </div>
                    <span className="text-sm font-bold text-green-700 flex-shrink-0">{NIS(s.cost)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Site tab */}
      {tab === "site" && (
        <div className="space-y-3">
          {siteBreakdown.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
              <p className="text-slate-400 text-sm">אין נתוני תדלוק מקושרים לאתרים</p>
            </div>
          ) : (
            siteBreakdown.map(s => {
              const pct = totalCost > 0 ? (s.cost / totalCost) * 100 : 0;
              const costPerDay = s.days > 0 ? s.cost / s.days : 0;
              return (
                <div key={s.siteId} className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-slate-800">{s.siteName}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{s.entries} תדלוקים · {s.days} ימי עבודה</p>
                    </div>
                    <div className="text-left">
                      <p className="text-lg font-bold text-blue-700">{NIS(s.cost)}</p>
                      <p className="text-xs text-slate-400">{s.liters.toFixed(0)} ליטרים</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center mb-3">
                    <div className="bg-slate-50 rounded-lg p-2">
                      <p className="text-xs text-slate-400">עלות ליום עבודה</p>
                      <p className="text-sm font-bold text-slate-700">{NIS(costPerDay)}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2">
                      <p className="text-xs text-slate-400">ממוצע לליטר</p>
                      <p className="text-sm font-bold text-slate-700">₪{s.liters > 0 ? (s.cost / s.liters).toFixed(2) : "—"}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2">
                      <p className="text-xs text-slate-400">% מסה״כ</p>
                      <p className="text-sm font-bold text-slate-700">{pct.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Equipment tab */}
      {tab === "equipment" && (
        <div className="space-y-3">
          {equipBreakdown.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
              <p className="text-slate-400 text-sm">אין נתוני תדלוק לציוד</p>
            </div>
          ) : (
            equipBreakdown.map(e => {
              const pct = totalCost > 0 ? (e.cost / totalCost) * 100 : 0;
              const eqLogs = logs.filter(l => l.equipmentId === e.equipId);
              const sites = [...new Set(eqLogs.filter(l => l.workSite).map(l => l.workSite?.name))];
              return (
                <div key={e.equipId} className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-slate-800">{e.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {e.entries} תדלוקים · תדלוק אחרון: {fmt(e.lastDate)}
                      </p>
                      {sites.length > 0 && (
                        <p className="text-xs text-slate-400 mt-0.5">אתרים: {sites.slice(0, 3).join(", ")}{sites.length > 3 ? ` +${sites.length - 3}` : ""}</p>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-lg font-bold text-blue-700">{NIS(e.cost)}</p>
                      <p className="text-xs text-slate-400">{e.liters.toFixed(0)} ל׳</p>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Log tab */}
      {tab === "log" && (
        <div>
          <div className="flex gap-2 mb-3 flex-wrap">
            <select value={filterEquip} onChange={e => setFilterEquip(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-1.5 bg-white focus:outline-none focus:border-blue-500">
              <option value="all">כל הציוד</option>
              {equipment.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <select value={filterSite} onChange={e => setFilterSite(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-1.5 bg-white focus:outline-none focus:border-blue-500">
              <option value="all">כל האתרים</option>
              <option value="__none__">ללא אתר</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <span className="text-xs text-slate-400 self-center mr-auto">{filteredLogs.length} רשומות</span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {filteredLogs.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-12">אין רשומות תדלוק</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {filteredLogs.map(log => (
                  <div key={log.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                    <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-800">{log.equipmentName || "ציוד"}</span>
                        {log.workSite && (
                          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">{log.workSite.name}</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {fmt(log.date)} · {log.liters} ל׳ · ₪{log.pricePerLiter}/ל
                        {log.mileage ? ` · ${log.mileage} ק״מ` : ""}
                        {log.notes ? ` · ${log.notes}` : ""}
                      </p>
                    </div>
                    <div className="text-left flex-shrink-0">
                      <p className="text-sm font-bold text-blue-700">{NIS(log.totalCost)}</p>
                    </div>
                    <button onClick={() => handleDelete(log.id)} disabled={deleting === log.id}
                      className="text-slate-300 hover:text-red-400 transition-colors p-1 flex-shrink-0">
                      {deleting === log.id ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
