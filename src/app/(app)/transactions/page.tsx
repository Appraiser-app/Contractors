"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { uploadReceipt } from "@/lib/upload";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "short", year: "numeric" }).format(new Date(date));
}

function formatMonth(ym: string) {
  const [y, m] = ym.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("he-IL", { month: "long", year: "numeric" });
}

type Transaction = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  category: string | null;
  date: string;
  receiptUrl: string | null;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  createdById: string | null;
  workSiteId: string;
  workSite?: { id: string; name: string };
};

type Site = {
  id: string;
  name: string;
  status: string;
  transactions?: { type: string; amount: number; approvalStatus: string }[];
};

const approvalLabel = { PENDING: "ממתין לאישור", APPROVED: "מאושר", REJECTED: "נדחה" };
const approvalColor = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-600",
};

const INCOME_CATEGORIES = ["תשלום לקוח", "מקדמה", "סיום שלב", "אחר"];
const EXPENSE_CATEGORIES = ["ציוד", "דלק", "שכר עובדים", "חומרים", "שכירות", "ביטוח", "טיפול", "אחר"];

type Archive = { id: string; name: string; createdAt: string; totalIncome: number; totalExpenses: number };

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "list">("dashboard");

  // Archive fallback — when no active transactions, show most recent archive
  const [viewingArchive, setViewingArchive] = useState<Archive | null>(null);
  const [archiveTx, setArchiveTx] = useState<Transaction[]>([]);

  // Add transaction modal
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    type: "INCOME",
    siteId: "",
    amount: "",
    description: "",
    category: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const [txRes, meRes, sitesRes] = await Promise.all([
      fetch("/api/transactions"),
      fetch("/api/auth/me"),
      fetch("/api/sites"),
    ]);
    const txData: Transaction[] = txRes.ok ? await txRes.json() : [];
    if (meRes.ok) { const me = await meRes.json(); setCurrentUserId(me.id); }
    if (sitesRes.ok) setSites(await sitesRes.json());
    setTransactions(txData);

    // If no active transactions, load the most recent archive automatically
    if (txData.length === 0) {
      const archRes = await fetch("/api/expenses/archives");
      if (archRes.ok) {
        const archives: Archive[] = await archRes.json();
        if (archives.length > 0) {
          const latest = archives.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
          setViewingArchive(latest);
          const detailRes = await fetch(`/api/expenses/archives/${latest.id}`);
          if (detailRes.ok) {
            const detail = await detailRes.json();
            const txList: Transaction[] = Array.isArray(detail) ? detail : (detail.transactions || []);
            setArchiveTx(txList);
          }
        }
      }
    } else {
      setViewingArchive(null);
      setArchiveTx([]);
    }

    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    setAddError("");
    let receiptUrl: string | null = null;
    if (receiptFile) {
      try { receiptUrl = await uploadReceipt(receiptFile, "transactions"); }
      catch { setAddError("שגיאה בהעלאת הקבלה"); setAddLoading(false); return; }
    }
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...addForm, amount: parseFloat(addForm.amount), receiptUrl }),
    });
    setAddLoading(false);
    if (res.ok) {
      setShowAdd(false);
      setAddForm({ type: "INCOME", siteId: "", amount: "", description: "", category: "", date: new Date().toISOString().split("T")[0] });
      setReceiptFile(null);
      await load();
    } else {
      const err = await res.json();
      setAddError(err.error || "שגיאה בשמירה");
    }
  }

  async function handleApproval(transactionId: string, action: "approve" | "reject") {
    setActionLoading(transactionId + action);
    await fetch("/api/transactions/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactionId, action }),
    });
    await load();
    setActionLoading(null);
  }

  // ── Computed summaries ───────────────────────────────────────────────────
  // Use archive data when no active transactions
  const displayTx = transactions.length > 0 ? transactions : archiveTx;
  // Include all non-rejected transactions in totals (approved + pending = real financial activity)
  const active = displayTx.filter(t => t.approvalStatus !== "REJECTED");
  const approvedOnly = displayTx.filter(t => t.approvalStatus === "APPROVED");
  const pendingCount = transactions.filter(t => t.approvalStatus === "PENDING").length;

  const totalIncome = active.filter(t => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const totalExpense = active.filter(t => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
  const approvedIncome = approvedOnly.filter(t => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const approvedExpense = approvedOnly.filter(t => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // Monthly breakdown (last 6 months) — all non-rejected
  const monthlyMap: Record<string, { income: number; expense: number }> = {};
  active.forEach(t => {
    const ym = t.date.slice(0, 7);
    if (!monthlyMap[ym]) monthlyMap[ym] = { income: 0, expense: 0 };
    if (t.type === "INCOME") monthlyMap[ym].income += t.amount;
    else monthlyMap[ym].expense += t.amount;
  });
  const months = Object.keys(monthlyMap).sort().reverse().slice(0, 6);
  const maxMonthVal = Math.max(...months.map(m => Math.max(monthlyMap[m].income, monthlyMap[m].expense)), 1);

  // By site breakdown — all non-rejected
  const siteMap: Record<string, { name: string; income: number; expense: number }> = {};
  active.forEach(t => {
    const siteName = t.workSite?.name || t.workSiteId;
    if (!siteMap[t.workSiteId]) siteMap[t.workSiteId] = { name: siteName, income: 0, expense: 0 };
    if (t.type === "INCOME") siteMap[t.workSiteId].income += t.amount;
    else siteMap[t.workSiteId].expense += t.amount;
  });
  const siteRows = Object.entries(siteMap)
    .map(([id, v]) => ({ id, ...v, profit: v.income - v.expense }))
    .sort((a, b) => b.income - a.income)
    .slice(0, 5);

  // By category (expenses)
  const catMap: Record<string, number> = {};
  active.filter(t => t.type === "EXPENSE").forEach(t => {
    const cat = t.category || "אחר";
    catMap[cat] = (catMap[cat] || 0) + t.amount;
  });
  const catRows = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
  const maxCat = Math.max(...catRows.map(c => c[1]), 1);

  if (loading) return <div className="p-8 text-gray-400">טוען...</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">הכנסות והוצאות</h1>
          <p className="text-gray-400 text-sm mt-1">
            {viewingArchive
              ? `ארכיון: ${viewingArchive.name} · ${displayTx.length} תנועות`
              : `${transactions.length} תנועות בתקופה הנוכחית`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex bg-gray-100 rounded-xl p-1 text-xs font-semibold">
            <button onClick={() => setActiveTab("dashboard")}
              className={`px-4 py-1.5 rounded-lg transition-all ${activeTab === "dashboard" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              דשבורד
            </button>
            <button onClick={() => setActiveTab("list")}
              className={`px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              רשימה
              {pendingCount > 0 && <span className="bg-amber-400 text-white rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none">{pendingCount}</span>}
            </button>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm shadow-sm shadow-green-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            הוסף תנועה
          </button>
        </div>
      </div>

      {/* Archive banner */}
      {viewingArchive && (
        <div className="mb-4 bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 12a2 2 0 002 2h8a2 2 0 002-2L19 8M10 12v4M14 12v4" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-800">מציג ארכיון: {viewingArchive.name}</p>
            <p className="text-xs text-blue-500 mt-0.5">אין תנועות פעילות בתקופה הנוכחית — מוצגות תנועות מהארכיון האחרון</p>
          </div>
          <Link href="/expenses" className="text-xs text-blue-600 hover:underline flex-shrink-0">כל הארכיונים →</Link>
        </div>
      )}

      {/* Pending approvals banner */}
      {pendingCount > 0 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center gap-3 cursor-pointer"
          onClick={() => setActiveTab("list")}>
          <div className="w-8 h-8 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-yellow-800">
            {pendingCount} תנועות ממתינות לאישורך — לחץ לרשימה
          </p>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="bg-green-50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-green-700/60">סה״כ הכנסות</p>
            <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-green-700">{formatCurrency(totalIncome)}</p>
          <div className="flex gap-2 mt-1.5 text-xs">
            <span className="text-green-600 font-medium">{formatCurrency(approvedIncome)} מאושר</span>
            {totalIncome - approvedIncome > 0 && <span className="text-amber-600">· {formatCurrency(totalIncome - approvedIncome)} ממתין</span>}
          </div>
        </div>
        <div className="bg-red-50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-red-700/60">סה״כ הוצאות</p>
            <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</p>
          <div className="flex gap-2 mt-1.5 text-xs">
            <span className="text-red-500 font-medium">{formatCurrency(approvedExpense)} מאושר</span>
            {totalExpense - approvedExpense > 0 && <span className="text-amber-600">· {formatCurrency(totalExpense - approvedExpense)} ממתין</span>}
          </div>
        </div>
        <div className={`rounded-2xl p-5 text-white ${balance >= 0 ? "bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-sm shadow-emerald-200" : "bg-gradient-to-br from-red-500 to-red-700 shadow-sm shadow-red-200"}`}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-white/60">רווח נקי</p>
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(balance)}</p>
          {totalIncome > 0 && (
            <p className="text-xs text-white/70 mt-1.5 font-medium">{Math.round((balance / totalIncome) * 100)}% מרווח</p>
          )}
        </div>
      </div>

      {/* Mobile tab switcher */}
      <div className="sm:hidden flex rounded-xl border border-gray-200 overflow-hidden text-sm font-medium mb-5">
        <button onClick={() => setActiveTab("dashboard")}
          className={`flex-1 py-2.5 transition-colors ${activeTab === "dashboard" ? "bg-green-600 text-white" : "bg-white text-gray-500"}`}>
          דשבורד
        </button>
        <button onClick={() => setActiveTab("list")}
          className={`flex-1 py-2.5 border-r border-gray-200 transition-colors ${activeTab === "list" ? "bg-green-600 text-white" : "bg-white text-gray-500"}`}>
          רשימה {pendingCount > 0 && `(${pendingCount})`}
        </button>
      </div>

      {/* ── DASHBOARD TAB ── */}
      {activeTab === "dashboard" && (
        <div className="space-y-5">
          {displayTx.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <p className="text-gray-600 font-semibold">אין תנועות בתקופה הנוכחית</p>
              <p className="text-gray-400 text-sm mt-1 mb-5">לאחר איפוס חשבון, הנתונים ההיסטוריים שמורים בארכיון</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setShowAdd(true)}
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  הוסף תנועה ראשונה
                </button>
                <Link href="/expenses"
                  className="inline-flex items-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium px-5 py-2.5 rounded-xl text-sm transition-colors">
                  צפה בארכיון
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Monthly trend */}
              {months.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-bold text-gray-900">מגמה חודשית</h2>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />הכנסות</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-300 inline-block" />הוצאות</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {months.map(ym => {
                      const { income, expense } = monthlyMap[ym];
                      const profit = income - expense;
                      const incomeW = Math.round((income / maxMonthVal) * 100);
                      const expenseW = Math.round((expense / maxMonthVal) * 100);
                      return (
                        <div key={ym}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-gray-700">{formatMonth(ym)}</span>
                            <span className={`text-sm font-bold ${profit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                              {profit >= 0 ? "+" : ""}{formatCurrency(profit)}
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-gray-400 w-12 flex-shrink-0 text-left">{formatCurrency(income).replace("₪", "").trim()}</span>
                              <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${incomeW}%` }} />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-gray-400 w-12 flex-shrink-0 text-left">{formatCurrency(expense).replace("₪", "").trim()}</span>
                              <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-red-300 rounded-full transition-all" style={{ width: `${expenseW}%` }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Site breakdown + category breakdown side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* By site */}
                {siteRows.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h2 className="font-bold text-gray-900 text-sm mb-4">פירוט לפי אתר</h2>
                    <div className="space-y-3">
                      {siteRows.map(s => (
                        <Link key={s.id} href={`/sites/${s.id}`}
                          className="block hover:bg-gray-50 -mx-2 px-2 py-1.5 rounded-xl transition-colors">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-800 truncate ml-2">{s.name}</span>
                            <span className={`text-xs font-bold flex-shrink-0 ${s.profit >= 0 ? "text-green-600" : "text-red-500"}`}>
                              {s.profit >= 0 ? "+" : ""}{formatCurrency(s.profit)}
                            </span>
                          </div>
                          <div className="flex gap-3 text-xs text-gray-400">
                            <span>↑ {formatCurrency(s.income)}</span>
                            <span>↓ {formatCurrency(s.expense)}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* By category */}
                {catRows.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h2 className="font-bold text-gray-900 text-sm mb-4">הוצאות לפי קטגוריה</h2>
                    <div className="space-y-2.5">
                      {catRows.map(([cat, amount]) => (
                        <div key={cat}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-medium text-gray-700">{cat}</span>
                            <span className="text-red-500 font-semibold">{formatCurrency(amount)}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-red-300 rounded-full"
                              style={{ width: `${Math.round((amount / maxCat) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── LIST TAB ── */}
      {activeTab === "list" && (
        <>
          {/* Mobile card list */}
          <div className="sm:hidden space-y-2">
            {transactions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                <p className="text-4xl mb-3">💸</p>
                <p className="text-gray-400 text-sm">אין תנועות עדיין</p>
              </div>
            ) : transactions.map(t => {
              const canApprove = t.approvalStatus === "PENDING" && t.createdById !== currentUserId;
              return (
                <div key={t.id} className={`bg-white rounded-2xl border p-4 ${t.approvalStatus === "PENDING" ? "border-yellow-200 bg-yellow-50/30" : "border-gray-100"}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${t.type === "INCOME" ? "bg-green-100" : "bg-red-100"}`}>
                        <svg className={`w-4 h-4 ${t.type === "INCOME" ? "text-green-600" : "text-red-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={t.type === "INCOME" ? "M7 11l5-5m0 0l5 5m-5-5v12" : "M17 13l-5 5m0 0l-5-5m5 5V6"} />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{t.description}</p>
                        {t.category && <p className="text-xs text-gray-400">{t.category}</p>}
                      </div>
                    </div>
                    <span className={`text-sm font-bold flex-shrink-0 ${t.type === "INCOME" ? "text-green-600" : "text-red-500"}`}>
                      {t.type === "INCOME" ? "+" : "-"}{formatCurrency(t.amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-400">{formatDate(t.date)}</span>
                      <Link href={`/sites/${t.workSiteId}`} className="text-xs text-green-600 font-medium">{t.workSite?.name}</Link>
                      {t.receiptUrl && <a href={t.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400">📎</a>}
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${approvalColor[t.approvalStatus]}`}>
                      {approvalLabel[t.approvalStatus]}
                    </span>
                  </div>
                  {canApprove && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => handleApproval(t.id, "approve")} disabled={actionLoading === t.id + "approve"}
                        className="flex-1 text-xs bg-green-600 hover:bg-green-500 text-white font-semibold py-2 rounded-xl transition-colors disabled:opacity-50">
                        {actionLoading === t.id + "approve" ? "..." : "✓ אשר"}
                      </button>
                      <button onClick={() => handleApproval(t.id, "reject")} disabled={actionLoading === t.id + "reject"}
                        className="flex-1 text-xs bg-red-100 hover:bg-red-200 text-red-600 font-semibold py-2 rounded-xl transition-colors disabled:opacity-50">
                        {actionLoading === t.id + "reject" ? "..." : "✕ דחה"}
                      </button>
                    </div>
                  )}
                  {t.approvalStatus === "PENDING" && t.createdById === currentUserId && (
                    <p className="text-xs text-yellow-600 font-medium mt-2 text-center">ממתין לאישור שותף</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block bg-white rounded-2xl border border-gray-100 overflow-x-auto">
            {transactions.length === 0 ? (
              <div className="p-16 text-center">
                <p className="text-5xl mb-4">💸</p>
                <p className="text-gray-400 mb-4">אין תנועות בתקופה הנוכחית</p>
                <Link href="/expenses" className="text-sm text-green-600 hover:underline">צפה בארכיון →</Link>
              </div>
            ) : (
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="bg-gray-50/70">
                    <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">תאריך</th>
                    <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">תיאור</th>
                    <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">אתר</th>
                    <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">סטטוס</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">סכום</th>
                    <th className="px-4 py-3.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transactions.map(t => {
                    const canApprove = t.approvalStatus === "PENDING" && t.createdById !== currentUserId;
                    return (
                      <tr key={t.id} className={`hover:bg-green-50/30 transition-colors ${t.approvalStatus === "PENDING" ? "bg-yellow-50/30" : ""}`}>
                        <td className="px-4 py-4 text-sm text-gray-400 whitespace-nowrap">{formatDate(t.date)}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${t.type === "INCOME" ? "bg-green-100" : "bg-red-100"}`}>
                              <svg className={`w-3 h-3 ${t.type === "INCOME" ? "text-green-600" : "text-red-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={t.type === "INCOME" ? "M7 11l5-5m0 0l5 5m-5-5v12" : "M17 13l-5 5m0 0l-5-5m5 5V6"} />
                              </svg>
                            </div>
                            <div>
                              <span className="text-sm text-gray-800 font-medium">{t.description}</span>
                              {t.receiptUrl && <a href={t.receiptUrl} target="_blank" rel="noopener noreferrer" className="mr-2 text-xs text-blue-400 hover:text-blue-600">📎</a>}
                              {t.category && <p className="text-xs text-gray-400">{t.category}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Link href={`/sites/${t.workSiteId}`} className="text-sm text-green-600 hover:text-green-700 font-medium hover:underline">
                            {t.workSite?.name || ""}
                          </Link>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${approvalColor[t.approvalStatus]}`}>
                            {approvalLabel[t.approvalStatus]}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-left">
                          <span className={`text-sm font-bold ${t.type === "INCOME" ? "text-green-600" : "text-red-500"}`}>
                            {t.type === "INCOME" ? "+" : "-"}{formatCurrency(t.amount)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {canApprove && (
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => handleApproval(t.id, "approve")} disabled={actionLoading === t.id + "approve"}
                                className="text-xs bg-green-600 hover:bg-green-500 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                                {actionLoading === t.id + "approve" ? "..." : "אשר"}
                              </button>
                              <button onClick={() => handleApproval(t.id, "reject")} disabled={actionLoading === t.id + "reject"}
                                className="text-xs bg-red-100 hover:bg-red-200 text-red-600 font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                                {actionLoading === t.id + "reject" ? "..." : "דחה"}
                              </button>
                            </div>
                          )}
                          {t.approvalStatus === "PENDING" && t.createdById === currentUserId && (
                            <span className="text-xs text-yellow-600 font-medium">ממתין לאישור שותף</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Add transaction modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="font-bold text-gray-900">הוספת תנועה</h2>
              <button onClick={() => { setShowAdd(false); setAddError(""); }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-5 space-y-4">
              <div className="flex gap-2">
                {["INCOME", "EXPENSE"].map((t) => (
                  <button key={t} type="button"
                    onClick={() => setAddForm(p => ({ ...p, type: t, category: "" }))}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      addForm.type === t
                        ? t === "INCOME" ? "bg-green-500 text-white" : "bg-red-500 text-white"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}>
                    {t === "INCOME" ? "הכנסה" : "הוצאה"}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">אתר עבודה *</label>
                <select value={addForm.siteId} onChange={e => setAddForm(p => ({ ...p, siteId: e.target.value }))} required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-600">
                  <option value="">בחר אתר...</option>
                  {sites.filter(s => s.status === "ACTIVE").map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  {sites.filter(s => s.status !== "ACTIVE").length > 0 && (
                    <optgroup label="לא פעילים">
                      {sites.filter(s => s.status !== "ACTIVE").map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </optgroup>
                  )}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">סכום (₪) *</label>
                  <input type="number" value={addForm.amount} onChange={e => setAddForm(p => ({ ...p, amount: e.target.value }))}
                    required min="0.01" step="0.01" placeholder="0" dir="ltr"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">תאריך</label>
                  <input type="date" value={addForm.date} onChange={e => setAddForm(p => ({ ...p, date: e.target.value }))} dir="ltr"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">תיאור *</label>
                <input type="text" value={addForm.description} onChange={e => setAddForm(p => ({ ...p, description: e.target.value }))}
                  required placeholder={addForm.type === "INCOME" ? "תשלום עבור שלב א'" : "קנייה מדלק"}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">קטגוריה</label>
                <select value={addForm.category} onChange={e => setAddForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-600">
                  <option value="">ללא קטגוריה</option>
                  {(addForm.type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">קבלה / אסמכתא</label>
                <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden"
                  onChange={e => setReceiptFile(e.target.files?.[0] || null)} />
                {receiptFile ? (
                  <div className="flex items-center gap-2 border border-green-200 bg-green-50 rounded-xl px-4 py-2.5">
                    <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-green-700 truncate flex-1">{receiptFile.name}</span>
                    <button type="button" onClick={() => setReceiptFile(null)} className="text-green-500 hover:text-red-400 text-xs">הסר</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-200 hover:border-green-400 rounded-xl px-4 py-3 text-sm text-gray-400 hover:text-green-600 transition-colors flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    צרף קבלה / תמונה
                  </button>
                )}
              </div>
              {addError && <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm">{addError}</div>}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={addLoading}
                  className={`flex-1 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm disabled:bg-gray-200 ${
                    addForm.type === "INCOME" ? "bg-green-600 hover:bg-green-500" : "bg-red-500 hover:bg-red-400"
                  }`}>
                  {addLoading ? "שומר..." : addForm.type === "INCOME" ? "הוסף הכנסה" : "הוסף הוצאה"}
                </button>
                <button type="button" onClick={() => { setShowAdd(false); setAddError(""); }}
                  className="px-5 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-2.5 rounded-xl text-sm">
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
