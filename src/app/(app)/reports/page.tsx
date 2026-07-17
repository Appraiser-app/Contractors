"use client";

import { useCallback, useEffect, useState } from "react";

const VAT = 0.18;

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("he-IL");
}

type Period = "week" | "month" | "quarter" | "year" | "custom";

type SiteRow = {
  siteId: string; siteName: string; status: string;
  contractNet: number; txIncomeNet: number; incomeNet: number;
  vatAmount: number; incomeGross: number; expense: number; profit: number;
};

type MonthRow = {
  month: string; label: string;
  incomeNet: number; vatAmount: number; incomeGross: number;
  siteExpense: number; generalExpense: number; totalExpense: number; profit: number;
};

type ReportData = {
  summary: {
    totalIncomeNet: number; totalVat: number; totalIncomeGross: number;
    contractsNet: number; txIncomeNet: number;
    siteExpense: number; generalExpense: number;
    equipmentExpenseTotal: number; maintenanceTotal: number; insuranceTotal: number;
    totalExpense: number; operationalProfit: number;
  };
  bySite: SiteRow[];
  byMonth: MonthRow[];
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
  week: "שבוע", month: "חודש", quarter: "רבעון", year: "שנה", custom: "מותאם",
};

const STATUS_LABELS: Record<string, string> = { ACTIVE: "פעיל", COMPLETED: "הושלם", ON_HOLD: "מושהה" };
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700", COMPLETED: "bg-sky-100 text-sky-700", ON_HOLD: "bg-yellow-100 text-yellow-700",
};

function ProfitBadge({ value }: { value: number }) {
  return (
    <span className={`font-bold ${value >= 0 ? "text-green-700" : "text-red-600"}`}>
      {value >= 0 ? "+" : ""}{formatCurrency(value)}
    </span>
  );
}

type Tab = "overview" | "bySite" | "byMonth";

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("year");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { from, to } = getDateRange(period, customFrom, customTo);
    const res = await fetch(`/api/reports?from=${from}&to=${to}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [period, customFrom, customTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const { from, to } = getDateRange(period, customFrom, customTo);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">דוחות כספיים</h1>
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
      <div className="flex flex-wrap gap-2 mb-5">
        {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${period === p ? "bg-green-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-green-300"}`}>
            {PERIOD_LABELS[p]}
          </button>
        ))}
        {period === "custom" && (
          <div className="flex items-center gap-2 mr-2">
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" dir="ltr" />
            <span className="text-gray-400 text-sm">עד</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" dir="ltr" />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 w-fit">
        {([
          { id: "overview", label: "סיכום" },
          { id: "bySite", label: "לפי אתר" },
          { id: "byMonth", label: "לפי חודש" },
        ] as { id: Tab; label: string }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === t.id ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-gray-400">טוען...</div>
      ) : data ? (
        <div className="space-y-6">

          {/* ── OVERVIEW TAB ── */}
          {tab === "overview" && (
            <>
              {/* Top summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Operational profit */}
                <div className={`sm:col-span-1 rounded-2xl p-5 text-white shadow-lg ${data.summary.operationalProfit >= 0 ? "bg-gradient-to-br from-green-600 to-green-700" : "bg-gradient-to-br from-red-500 to-red-600"}`}>
                  <p className="text-white/70 text-xs font-medium mb-2">רווח תפעולי</p>
                  <p className="text-3xl font-bold leading-none">{formatCurrency(data.summary.operationalProfit)}</p>
                  <div className="mt-3 pt-3 border-t border-white/20 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/60">הכנסות כולל מע״מ</span>
                      <span className="text-white/90">{formatCurrency(data.summary.totalIncomeGross)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/60">הוצאות</span>
                      <span className="text-white/90">−{formatCurrency(data.summary.totalExpense)}</span>
                    </div>
                  </div>
                </div>

                {/* Income breakdown */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <p className="text-xs text-gray-400 font-medium mb-3">פירוט הכנסות</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(data.summary.totalIncomeGross)}</p>
                  <div className="mt-3 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">ערכי חוזים (נטו)</span>
                      <span className="text-gray-600">{formatCurrency(data.summary.contractsNet)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">הכנסות עסקאות (נטו)</span>
                      <span className="text-gray-600">{formatCurrency(data.summary.txIncomeNet)}</span>
                    </div>
                    <div className="flex justify-between text-xs border-t border-gray-100 pt-1.5">
                      <span className="text-gray-400">מע״מ 18%</span>
                      <span className="text-green-500">+{formatCurrency(data.summary.totalVat)}</span>
                    </div>
                  </div>
                </div>

                {/* Expense breakdown */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <p className="text-xs text-gray-400 font-medium mb-3">פירוט הוצאות</p>
                  <p className="text-2xl font-bold text-red-500">{formatCurrency(data.summary.totalExpense)}</p>
                  <div className="mt-3 space-y-1.5">
                    {data.summary.siteExpense > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">הוצאות אתרים</span>
                        <span className="text-gray-600">{formatCurrency(data.summary.siteExpense)}</span>
                      </div>
                    )}
                    {data.summary.generalExpense > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">הוצאות כלליות</span>
                        <span className="text-gray-600">{formatCurrency(data.summary.generalExpense)}</span>
                      </div>
                    )}
                    {(data.summary.equipmentExpenseTotal + data.summary.maintenanceTotal + data.summary.insuranceTotal) > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">עלויות ציוד</span>
                        <span className="text-gray-600">{formatCurrency(data.summary.equipmentExpenseTotal + data.summary.maintenanceTotal + data.summary.insuranceTotal)}</span>
                      </div>
                    )}
                  </div>
                </div>
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
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                              <span className="text-xs text-green-600 font-medium">{formatCurrency(day.income)}</span>
                            </div>
                          )}
                          {(day.expense + day.equip) > 0 && (
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-red-400" />
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
            </>
          )}

          {/* ── BY SITE TAB ── */}
          {tab === "bySite" && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                <h2 className="font-bold text-gray-900">הכנסות לפי אתר</h2>
                <span className="text-xs text-gray-400">{data.bySite.length} אתרים</span>
              </div>
              {data.bySite.length === 0 ? (
                <div className="p-12 text-center text-gray-400 text-sm">אין נתונים לתקופה</div>
              ) : (
                <>
                  {/* Table header */}
                  <div className="hidden sm:grid grid-cols-6 gap-2 px-5 py-2 bg-slate-50 text-xs text-slate-500 font-semibold">
                    <div className="col-span-2">אתר</div>
                    <div className="text-left">חוזה (נטו)</div>
                    <div className="text-left">הכנסות כולל מע״מ</div>
                    <div className="text-left">הוצאות</div>
                    <div className="text-left">רווח</div>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {data.bySite.map(row => (
                      <div key={row.siteId} className="px-5 py-3.5 hover:bg-slate-50 transition-colors">
                        <div className="sm:grid sm:grid-cols-6 sm:gap-2 sm:items-center">
                          <div className="col-span-2 flex items-center gap-2 mb-2 sm:mb-0">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{row.siteName}</p>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[row.status] ?? "bg-gray-100 text-gray-600"}`}>
                                {STATUS_LABELS[row.status] ?? row.status}
                              </span>
                            </div>
                          </div>
                          {/* Mobile grid */}
                          <div className="sm:contents grid grid-cols-3 gap-2 text-xs sm:hidden mb-1">
                            <div><span className="text-gray-400 block">חוזה</span>{formatCurrency(row.contractNet)}</div>
                            <div><span className="text-gray-400 block">הכנסות</span><span className="text-green-600 font-semibold">{formatCurrency(row.incomeGross)}</span></div>
                            <div><span className="text-gray-400 block">הוצאות</span><span className="text-red-500">{formatCurrency(row.expense)}</span></div>
                          </div>
                          <div className="sm:hidden text-sm font-bold mt-1">
                            רווח: <ProfitBadge value={row.profit} />
                          </div>
                          {/* Desktop columns */}
                          <div className="hidden sm:block text-sm text-gray-600">{formatCurrency(row.contractNet)}</div>
                          <div className="hidden sm:block">
                            <span className="text-sm font-semibold text-green-700">{formatCurrency(row.incomeGross)}</span>
                            <span className="text-xs text-gray-400 block">מע״מ: {formatCurrency(row.vatAmount)}</span>
                          </div>
                          <div className="hidden sm:block text-sm text-red-500">{formatCurrency(row.expense)}</div>
                          <div className="hidden sm:block text-sm font-bold"><ProfitBadge value={row.profit} /></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Total row */}
                  <div className="px-5 py-4 bg-slate-50 border-t border-slate-200">
                    <div className="sm:grid sm:grid-cols-6 sm:gap-2 sm:items-center">
                      <div className="col-span-2 text-sm font-bold text-slate-700 mb-1 sm:mb-0">סה״כ</div>
                      <div className="hidden sm:block text-sm font-semibold">{formatCurrency(data.bySite.reduce((s, r) => s + r.contractNet, 0))}</div>
                      <div className="hidden sm:block text-sm font-semibold text-green-700">{formatCurrency(data.bySite.reduce((s, r) => s + r.incomeGross, 0))}</div>
                      <div className="hidden sm:block text-sm font-semibold text-red-500">{formatCurrency(data.bySite.reduce((s, r) => s + r.expense, 0))}</div>
                      <div className="text-sm font-bold">
                        <ProfitBadge value={data.bySite.reduce((s, r) => s + r.profit, 0)} />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── BY MONTH TAB ── */}
          {tab === "byMonth" && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                <h2 className="font-bold text-gray-900">הכנסות לפי חודש</h2>
                <span className="text-xs text-gray-400">{data.byMonth.length} חודשים</span>
              </div>
              {data.byMonth.length === 0 ? (
                <div className="p-12 text-center text-gray-400 text-sm">אין נתונים לתקופה</div>
              ) : (
                <>
                  {/* Table header */}
                  <div className="hidden sm:grid grid-cols-6 gap-2 px-5 py-2 bg-slate-50 text-xs text-slate-500 font-semibold">
                    <div className="col-span-2">חודש</div>
                    <div className="text-left">הכנסות נטו</div>
                    <div className="text-left">כולל מע״מ</div>
                    <div className="text-left">הוצאות</div>
                    <div className="text-left">רווח</div>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {data.byMonth.map(row => (
                      <div key={row.month} className="px-5 py-3.5 hover:bg-slate-50 transition-colors">
                        <div className="sm:grid sm:grid-cols-6 sm:gap-2 sm:items-center">
                          <div className="col-span-2 flex items-center gap-2 mb-2 sm:mb-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <p className="text-sm font-semibold text-gray-900">{row.label}</p>
                          </div>
                          {/* Mobile */}
                          <div className="sm:contents grid grid-cols-3 gap-2 text-xs sm:hidden mb-1">
                            <div><span className="text-gray-400 block">נטו</span>{formatCurrency(row.incomeNet)}</div>
                            <div><span className="text-gray-400 block">ברוטו</span><span className="text-green-600 font-semibold">{formatCurrency(row.incomeGross)}</span></div>
                            <div><span className="text-gray-400 block">הוצאות</span><span className="text-red-500">{formatCurrency(row.totalExpense)}</span></div>
                          </div>
                          <div className="sm:hidden text-sm font-bold mt-1">
                            רווח: <ProfitBadge value={row.profit} />
                          </div>
                          {/* Desktop */}
                          <div className="hidden sm:block text-sm text-gray-600">{formatCurrency(row.incomeNet)}</div>
                          <div className="hidden sm:block">
                            <span className="text-sm font-semibold text-green-700">{formatCurrency(row.incomeGross)}</span>
                            <span className="text-xs text-gray-400 block">מע״מ: +{formatCurrency(row.vatAmount)}</span>
                          </div>
                          <div className="hidden sm:block">
                            <span className="text-sm text-red-500">{formatCurrency(row.totalExpense)}</span>
                            {row.generalExpense > 0 && (
                              <span className="text-xs text-gray-400 block">כללי: {formatCurrency(row.generalExpense)}</span>
                            )}
                          </div>
                          <div className="hidden sm:block text-sm font-bold"><ProfitBadge value={row.profit} /></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Total row */}
                  <div className="px-5 py-4 bg-slate-50 border-t border-slate-200">
                    <div className="sm:grid sm:grid-cols-6 sm:gap-2 sm:items-center">
                      <div className="col-span-2 text-sm font-bold text-slate-700 mb-1 sm:mb-0">סה״כ</div>
                      <div className="hidden sm:block text-sm font-semibold">{formatCurrency(data.byMonth.reduce((s, r) => s + r.incomeNet, 0))}</div>
                      <div className="hidden sm:block text-sm font-semibold text-green-700">{formatCurrency(data.byMonth.reduce((s, r) => s + r.incomeGross, 0))}</div>
                      <div className="hidden sm:block text-sm font-semibold text-red-500">{formatCurrency(data.byMonth.reduce((s, r) => s + r.totalExpense, 0))}</div>
                      <div className="text-sm font-bold">
                        <ProfitBadge value={data.byMonth.reduce((s, r) => s + r.profit, 0)} />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
