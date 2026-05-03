"use client";

import { useState, useEffect, useCallback } from "react";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("he-IL");
}

type Period = "week" | "month" | "quarter" | "year" | "custom";

type ReportData = {
  summary: {
    siteIncome: number;
    siteExpense: number;
    equipmentExpenseTotal: number;
    maintenanceTotal: number;
    insuranceTotal: number;
    totalExpense: number;
    netBalance: number;
  };
  siteCategoryBreakdown: Record<string, number>;
  equipCategoryBreakdown: Record<string, number>;
  daily: { date: string; income: number; expense: number; equip: number }[];
  transactions: { id: string; type: string; amount: number; description: string; category: string | null; date: string; receiptUrl?: string | null }[];
};

function getDateRange(period: Period, customFrom?: string, customTo?: string): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);

  if (period === "custom") return { from: customFrom || to, to: customTo || to };

  const from = new Date(now);
  if (period === "week") from.setDate(now.getDate() - 7);
  else if (period === "month") from.setMonth(now.getMonth() - 1);
  else if (period === "quarter") from.setMonth(now.getMonth() - 3);
  else from.setFullYear(now.getFullYear() - 1);

  return { from: from.toISOString().slice(0, 10), to };
}

const PERIOD_LABELS: Record<Period, string> = {
  week: "שבוע אחרון",
  month: "חודש אחרון",
  quarter: "רבעון",
  year: "שנה",
  custom: "מותאם אישית",
};

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-16 text-left">{formatCurrency(value)}</span>
    </div>
  );
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { from, to } = getDateRange(period, customFrom, customTo);
    const res = await fetch(`/api/reports?from=${from}&to=${to}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [period, customFrom, customTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const { from, to } = getDateRange(period, customFrom, customTo);

  const maxDailyIncome = data ? Math.max(...data.daily.map(d => d.income), 1) : 1;
  const maxDailyExpense = data ? Math.max(...data.daily.map(d => d.expense + d.equip), 1) : 1;

  const siteCatEntries = data ? Object.entries(data.siteCategoryBreakdown).sort((a, b) => b[1] - a[1]) : [];
  const equipCatEntries = data ? Object.entries(data.equipCategoryBreakdown).sort((a, b) => b[1] - a[1]) : [];
  const maxCat = Math.max(...siteCatEntries.map(e => e[1]), ...equipCatEntries.map(e => e[1]), 1);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">דוחות והוצאות</h1>
          <p className="text-gray-400 text-sm mt-0.5">{formatDate(from)} — {formatDate(to)}</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-1.5 border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm px-3 py-1.5 rounded-lg transition-colors">
          <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          רענן
        </button>
      </div>

      {/* Period selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${period === p ? "bg-amber-500 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-amber-300"}`}>
            {PERIOD_LABELS[p]}
          </button>
        ))}
        {period === "custom" && (
          <div className="flex items-center gap-2 mr-2">
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" dir="ltr" />
            <span className="text-gray-400 text-sm">עד</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" dir="ltr" />
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-gray-400">טוען...</div>
      ) : data ? (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-xs text-gray-400 mb-1">הכנסות אתרים</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(data.summary.siteIncome)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-xs text-gray-400 mb-1">הוצאות אתרים</p>
              <p className="text-xl font-bold text-red-500">{formatCurrency(data.summary.siteExpense)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-xs text-gray-400 mb-1">עלויות ציוד</p>
              <p className="text-xl font-bold text-orange-500">{formatCurrency(data.summary.equipmentExpenseTotal + data.summary.maintenanceTotal + data.summary.insuranceTotal)}</p>
              <div className="text-xs text-gray-400 mt-1 space-y-0.5">
                <div>דלק/הוצאות: {formatCurrency(data.summary.equipmentExpenseTotal)}</div>
                <div>טיפולים: {formatCurrency(data.summary.maintenanceTotal)}</div>
                <div>ביטוחים: {formatCurrency(data.summary.insuranceTotal)}</div>
              </div>
            </div>
            <div className={`rounded-2xl border p-5 ${data.summary.netBalance >= 0 ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"}`}>
              <p className="text-xs text-gray-400 mb-1">רווח / הפסד נקי</p>
              <p className={`text-xl font-bold ${data.summary.netBalance >= 0 ? "text-green-700" : "text-red-700"}`}>
                {formatCurrency(data.summary.netBalance)}
              </p>
              <p className="text-xs text-gray-400 mt-1">סה"כ הוצאות: {formatCurrency(data.summary.totalExpense)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Site category breakdown */}
            {siteCatEntries.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="font-bold text-gray-900 mb-4 text-sm">הוצאות אתרים לפי קטגוריה</h2>
                <div className="space-y-3">
                  {siteCatEntries.map(([cat, amt]) => (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">{cat}</span>
                      </div>
                      <Bar value={amt} max={maxCat} color="bg-red-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Equipment category breakdown */}
            {equipCatEntries.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="font-bold text-gray-900 mb-4 text-sm">הוצאות ציוד לפי קטגוריה</h2>
                <div className="space-y-3">
                  {equipCatEntries.map(([cat, amt]) => (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">{cat}</span>
                      </div>
                      <Bar value={amt} max={maxCat} color="bg-orange-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Daily timeline */}
          {data.daily.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-bold text-gray-900 mb-4 text-sm">פעילות יומית</h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {[...data.daily].reverse().map(day => (
                  <div key={day.date} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
                    <span className="text-xs text-gray-400 w-24 flex-shrink-0">{formatDate(day.date)}</span>
                    <div className="flex-1 flex items-center gap-3">
                      {day.income > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="text-xs text-green-600 font-medium">{formatCurrency(day.income)}</span>
                        </div>
                      )}
                      {(day.expense + day.equip) > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-red-400"></div>
                          <span className="text-xs text-red-500 font-medium">{formatCurrency(day.expense + day.equip)}</span>
                        </div>
                      )}
                    </div>
                    <span className={`text-xs font-bold w-20 text-left ${day.income - day.expense - day.equip >= 0 ? "text-green-600" : "text-red-500"}`}>
                      {formatCurrency(day.income - day.expense - day.equip)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transactions list */}
          {data.transactions.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100">
              <div className="p-5 border-b border-gray-50">
                <h2 className="font-bold text-gray-900 text-sm">תנועות ({data.transactions.length})</h2>
              </div>
              <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
                {data.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
                  <div key={t.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${t.type === "INCOME" ? "bg-green-100" : "bg-red-100"}`}>
                        <svg className={`w-3.5 h-3.5 ${t.type === "INCOME" ? "text-green-600" : "text-red-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.type === "INCOME" ? "M7 11l5-5m0 0l5 5m-5-5v12" : "M17 13l-5 5m0 0l-5-5m5 5V6"} />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-800">{t.description}</p>
                        <div className="flex gap-2 text-xs text-gray-400">
                          {t.category && <span>{t.category}</span>}
                          <span>{formatDate(t.date)}</span>
                          {t.receiptUrl && (
                            <a href={t.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-600">קבלה</a>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${t.type === "INCOME" ? "text-green-600" : "text-red-500"}`}>
                      {t.type === "INCOME" ? "+" : "-"}{formatCurrency(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.transactions.length === 0 && data.daily.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
              <p className="text-gray-400 text-sm">אין נתונים לתקופה שנבחרה</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
