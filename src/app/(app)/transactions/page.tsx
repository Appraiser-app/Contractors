"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "short", year: "numeric" }).format(new Date(date));
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

const approvalLabel = { PENDING: "ממתין לאישור", APPROVED: "מאושר", REJECTED: "נדחה" };
const approvalColor = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-600",
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [txRes, meRes] = await Promise.all([
      fetch("/api/transactions"),
      fetch("/api/auth/me"),
    ]);
    if (txRes.ok) setTransactions(await txRes.json());
    if (meRes.ok) {
      const me = await meRes.json();
      setCurrentUserId(me.id);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

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

  const totalIncome = transactions.filter(t => t.type === "INCOME" && t.approvalStatus === "APPROVED").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "EXPENSE" && t.approvalStatus === "APPROVED").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const pendingCount = transactions.filter(t => t.approvalStatus === "PENDING").length;

  if (loading) return <div className="p-8 text-gray-400">טוען...</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl font-bold text-gray-900">הכנסות והוצאות</h1>
        <p className="text-gray-400 text-sm mt-1">{transactions.length} תנועות בסך הכל</p>
      </div>

      {/* Pending approvals banner */}
      {pendingCount > 0 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-yellow-800">
            {pendingCount} תנועות ממתינות לאישורך
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
            </div>
            <p className="text-xs text-gray-400 font-medium">סה"כ הכנסות (מאושרות)</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
            </div>
            <p className="text-xs text-gray-400 font-medium">סה"כ הוצאות (מאושרות)</p>
          </div>
          <p className="text-2xl font-bold text-red-500">{formatCurrency(totalExpense)}</p>
        </div>
        <div className={`rounded-2xl border p-5 hover:shadow-md transition-shadow ${balance >= 0 ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${balance >= 0 ? "bg-green-200" : "bg-red-200"}`}>
              <svg className={`w-3.5 h-3.5 ${balance >= 0 ? "text-green-700" : "text-red-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xs text-gray-400 font-medium">יתרה</p>
          </div>
          <p className={`text-2xl font-bold ${balance >= 0 ? "text-green-700" : "text-red-700"}`}>{formatCurrency(balance)}</p>
        </div>
      </div>

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
            <p className="text-gray-400">אין תנועות עדיין</p>
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
    </div>
  );
}
