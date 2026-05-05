"use client";

import { useState, useRef } from "react";
import { uploadReceipt } from "@/lib/upload";
import * as XLSX from "xlsx";

type ExpenseEntity = "דור" | "שגיא" | "חברה של שגיא" | "חברה של דור";
type PaymentMethod = "מזומן" | "העברה בנקאית" | "כרטיס אשראי" | "צ'ק";

type Expense = {
  id: string;
  entity: ExpenseEntity;
  amount: number;
  description: string;
  category: string | null;
  paymentMethod: PaymentMethod | null;
  vatIncluded: boolean | null;
  expenseType: "CASH" | "INVOICE" | null;
  invoiceUrl: string | null;
  date: string;
  receiptUrl: string | null;
  notes: string | null;
  createdAt: string;
};

const ENTITIES: ExpenseEntity[] = ["דור", "שגיא", "חברה של שגיא", "חברה של דור"];

const ENTITY_COLORS: Record<ExpenseEntity, string> = {
  "דור": "bg-blue-100 text-blue-700",
  "שגיא": "bg-purple-100 text-purple-700",
  "חברה של שגיא": "bg-orange-100 text-orange-700",
  "חברה של דור": "bg-cyan-100 text-cyan-700",
};

const PAYMENT_METHODS: PaymentMethod[] = ["מזומן", "העברה בנקאית", "כרטיס אשראי", "צ'ק"];

const PAYMENT_ICONS: Record<PaymentMethod, string> = {
  "מזומן": "💵",
  "העברה בנקאית": "🏦",
  "כרטיס אשראי": "💳",
  "צ'ק": "📄",
};

const CATEGORIES = ["חומרים", "ציוד", "דלק", "שכר", "תחזוקה", "משרד", "ביטוח", "אחר"];
const VAT_RATE = 0.17;

function formatCurrency(n: number) {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(n);
}

function formatDate(d: string) {
  return new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
}

function today() {
  return new Date().toISOString().split("T")[0];
}

const emptyForm = () => ({
  entity: "דור" as ExpenseEntity,
  amount: "",
  description: "",
  category: "",
  paymentMethod: "" as PaymentMethod | "",
  vatIncluded: true,          // true = sum includes VAT, false = sum is net (ex-VAT)
  expenseType: "" as "CASH" | "INVOICE" | "",  // only when vatIncluded=false
  invoiceUrl: "",
  invoiceFileName: "",
  date: today(),
  notes: "",
  receiptUrl: "",
  receiptFileName: "",
});

function exportToXlsx(rows: Expense[], label: string) {
  const data: Record<string, string | number>[] = rows.map(e => ({
    "תאריך": formatDate(e.date),
    "ישות": e.entity,
    "תיאור": e.description,
    "קטגוריה": e.category || "",
    "אופן תשלום": e.paymentMethod || "",
    "כולל מעמ": e.vatIncluded === false ? "לא" : "כן",
    "סוג": e.expenseType === "INVOICE" ? "חשבונית" : e.expenseType === "CASH" ? "מזומן" : "",
    "סכום ₪": e.amount,
  }));
  // Total row
  data.push({ "תאריך": "", "ישות": "", "תיאור": "סה\"כ", "קטגוריה": "", "אופן תשלום": "", "כולל מעמ": "", "סוג": "", "סכום ₪": rows.reduce((s, e) => s + e.amount, 0) });

  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [{ wch: 14 }, { wch: 16 }, { wch: 30 }, { wch: 12 }, { wch: 18 }, { wch: 10 }, { wch: 10 }, { wch: 12 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "הוצאות");
  XLSX.writeFile(wb, `הוצאות-${label}.xlsx`);
}

function exportToPdf(rows: Expense[], label: string, entityFilter: string) {
  const total = rows.reduce((s, e) => s + e.amount, 0);
  const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<title>הוצאות ${label}</title>
<style>
  body { font-family: Arial, sans-serif; direction: rtl; margin: 24px; color: #111; font-size: 13px; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  .meta { color: #666; margin-bottom: 16px; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #1a1a1a; color: white; padding: 8px 10px; text-align: right; font-size: 12px; }
  td { padding: 7px 10px; border-bottom: 1px solid #eee; }
  tr:nth-child(even) td { background: #f9f9f9; }
  .amount { font-weight: bold; color: #dc2626; }
  .total-row td { background: #f0fdf4 !important; font-weight: bold; border-top: 2px solid #16a34a; }
  .total-amount { color: #16a34a; font-size: 15px; }
  @media print { body { margin: 0; } }
</style>
</head>
<body>
<h1>רשימת הוצאות</h1>
<div class="meta">תקופה: ${label}${entityFilter !== "הכל" ? ` · ישות: ${entityFilter}` : ""} · ${rows.length} רשומות</div>
<table>
  <thead><tr>
    <th>תאריך</th><th>ישות</th><th>תיאור</th><th>קטגוריה</th><th>אופן תשלום</th><th>מעמ</th><th>סכום</th>
  </tr></thead>
  <tbody>
    ${rows.map(e => `<tr>
      <td>${formatDate(e.date)}</td>
      <td>${e.entity}</td>
      <td>${e.description}${e.notes ? `<br><small style="color:#888">${e.notes}</small>` : ""}</td>
      <td>${e.category || "—"}</td>
      <td>${e.paymentMethod || "—"}</td>
      <td>${e.vatIncluded === false ? `לא${e.expenseType === "INVOICE" ? " (חשב׳)" : ""}` : "כן"}</td>
      <td class="amount">${new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(e.amount)}</td>
    </tr>`).join("")}
    <tr class="total-row">
      <td colspan="6" style="text-align:left">סה"כ</td>
      <td class="total-amount">${new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(total)}</td>
    </tr>
  </tbody>
</table>
</body></html>`;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 500);
}

type ExpenseArchive = {
  id: string; name: string; notes: string | null;
  totalAmount: number; expenseCount: number; createdAt: string;
};

export default function ExpensesClient({
  initialExpenses,
  initialArchives,
  isAdmin,
}: {
  initialExpenses: Expense[];
  initialArchives: ExpenseArchive[];
  isAdmin: boolean;
}) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [archives, setArchives] = useState<ExpenseArchive[]>(initialArchives);
  const [showForm, setShowForm] = useState(false);
  const [filterEntity, setFilterEntity] = useState<ExpenseEntity | "הכל">("הכל");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  // Archive state
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveName, setArchiveName] = useState("");
  const [archiveNotes, setArchiveNotes] = useState("");
  const [archiving, setArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState("");
  // History view state
  const [viewingArchive, setViewingArchive] = useState<ExpenseArchive | null>(null);
  const [archiveExpenses, setArchiveExpenses] = useState<Expense[]>([]);
  const [loadingArchive, setLoadingArchive] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [saving, setSaving] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<"receipt" | "invoice" | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const receiptRef = useRef<HTMLInputElement>(null);
  const invoiceRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState(emptyForm());

  function update<K extends keyof ReturnType<typeof emptyForm>>(field: K, value: ReturnType<typeof emptyForm>[K]) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  // VAT calculation (only meaningful when vatIncluded=false)
  const numericAmount = parseFloat(form.amount) || 0;
  const vatAmount = Math.round(numericAmount * VAT_RATE);
  const totalWithVat = numericAmount + vatAmount;

  async function handleFileUpload(file: File, type: "receipt" | "invoice") {
    setUploadingFile(type);
    try {
      const url = await uploadReceipt(file, "expenses");
      if (type === "receipt") {
        setForm((p) => ({ ...p, receiptUrl: url, receiptFileName: file.name }));
      } else {
        setForm((p) => ({ ...p, invoiceUrl: url, invoiceFileName: file.name }));
      }
    } catch {
      setError("שגיאה בהעלאת הקובץ");
    } finally {
      setUploadingFile(null);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: form.entity,
        amount: form.amount,
        description: form.description,
        category: form.category || null,
        paymentMethod: form.paymentMethod || null,
        vatIncluded: form.vatIncluded,
        expenseType: !form.vatIncluded ? (form.expenseType || null) : null,
        invoiceUrl: !form.vatIncluded && form.expenseType === "INVOICE" ? (form.invoiceUrl || null) : null,
        date: form.date,
        notes: form.notes || null,
        receiptUrl: form.receiptUrl || null,
      }),
    });

    setSaving(false);
    if (res.ok) {
      const newExpense = await res.json();
      setExpenses((p) => [newExpense, ...p]);
      setForm(emptyForm());
      setShowForm(false);
    } else {
      const err = await res.json();
      setError(err.error || "שגיאה בשמירה");
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    setExpenses((p) => p.filter((e) => e.id !== id));
    setDeleting(null);
  }

  async function handleArchive(e: React.FormEvent) {
    e.preventDefault();
    if (!archiveName.trim()) return;
    setArchiving(true);
    setArchiveError("");
    const res = await fetch("/api/expenses/archive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: archiveName.trim(), notes: archiveNotes || null }),
    });
    if (res.ok) {
      const newArchive = await res.json();
      setArchives((p) => [newArchive, ...p]);
      setExpenses([]);
      setShowArchiveModal(false);
      setArchiveName("");
      setArchiveNotes("");
    } else {
      const err = await res.json();
      setArchiveError(err.error || "שגיאה");
    }
    setArchiving(false);
  }

  async function viewArchive(archive: ExpenseArchive) {
    setViewingArchive(archive);
    setLoadingArchive(true);
    const res = await fetch(`/api/expenses/archives/${archive.id}`);
    if (res.ok) setArchiveExpenses(await res.json());
    setLoadingArchive(false);
  }

  const filtered = expenses
    .filter((e) => filterEntity === "הכל" || e.entity === filterEntity)
    .filter((e) => !filterFrom || e.date >= filterFrom)
    .filter((e) => !filterTo || e.date <= filterTo);

  const totals = ENTITIES.map((entity) => ({
    entity,
    total: expenses.filter((e) => e.entity === entity).reduce((s, e) => s + e.amount, 0),
  }));

  const grandTotal = expenses.reduce((s, e) => s + e.amount, 0);

  const exportLabel = filterFrom || filterTo
    ? `${filterFrom || ""}${filterFrom && filterTo ? " עד " : ""}${filterTo || ""}`
    : new Date().toLocaleDateString("he-IL", { month: "long", year: "numeric" });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">הוצאות</h1>
          <p className="text-gray-500 text-sm mt-1">מעקב הוצאות לפי ישות</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* History button */}
          {archives.length > 0 && (
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium px-3 py-2.5 rounded-xl transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              היסטוריה
            </button>
          )}
          {/* Reset / Archive button — admin only */}
          {isAdmin && expenses.length > 0 && (
            <button
              onClick={() => setShowArchiveModal(true)}
              className="flex items-center gap-1.5 border border-orange-200 text-orange-600 hover:bg-orange-50 font-medium px-3 py-2.5 rounded-xl transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 12a2 2 0 002 2h8a2 2 0 002-2L19 8" />
              </svg>
              איפוס חשבון
            </button>
          )}
          {/* Export dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium px-3 py-2.5 rounded-xl transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              ייצוא
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                <div className="absolute left-0 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                  <button
                    onClick={() => { exportToXlsx(filtered, exportLabel); setShowExportMenu(false); }}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    ייצוא ל-Excel
                  </button>
                  <button
                    onClick={() => { exportToPdf(filtered, exportLabel, filterEntity); setShowExportMenu(false); }}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    ייצוא ל-PDF
                  </button>
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            הוספת הוצאה
          </button>
        </div>
      </div>

      {/* Date range filter */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-xs text-gray-400">תקופה:</span>
        <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} dir="ltr"
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-600" />
        <span className="text-xs text-gray-400">עד</span>
        <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} dir="ltr"
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-600" />
        {(filterFrom || filterTo) && (
          <button onClick={() => { setFilterFrom(""); setFilterTo(""); }}
            className="text-xs text-gray-400 hover:text-red-400 transition-colors">× נקה</button>
        )}
        {(filterFrom || filterTo) && (
          <span className="text-xs text-gray-400 mr-auto">{filtered.length} רשומות</span>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {totals.map(({ entity, total }) => (
          <button
            key={entity}
            onClick={() => setFilterEntity(filterEntity === entity ? "הכל" : entity)}
            className={`bg-white rounded-2xl border p-4 text-right transition-all ${
              filterEntity === entity ? "border-green-400 shadow-md shadow-green-100" : "border-gray-100 hover:border-gray-200"
            }`}
          >
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ENTITY_COLORS[entity]}`}>{entity}</span>
            <p className="text-lg font-bold text-gray-900 mt-2">{formatCurrency(total)}</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 mb-2 px-5 py-3 flex items-center justify-between">
        <span className="text-sm text-gray-500">סה"כ {filterEntity === "הכל" ? "כולל" : filterEntity}</span>
        <span className="font-bold text-gray-900">
          {formatCurrency(filterEntity === "הכל" ? grandTotal : filtered.reduce((s, e) => s + e.amount, 0))}
        </span>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap mb-4 mt-4">
        {(["הכל", ...ENTITIES] as const).map((e) => (
          <button
            key={e}
            onClick={() => setFilterEntity(e as ExpenseEntity | "הכל")}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              filterEntity === e
                ? "bg-gray-900 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {e}
          </button>
        ))}
      </div>

      {/* Expenses list */}
      <div className="bg-white rounded-2xl border border-gray-100">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">אין הוצאות עדיין</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((expense) => (
              <div key={expense.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${ENTITY_COLORS[expense.entity]}`}>
                      {expense.entity}
                    </span>
                    <p className="text-sm font-medium text-gray-900 truncate">{expense.description}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-gray-400">{formatDate(expense.date)}</span>
                    {expense.category && <span className="text-xs text-gray-400">· {expense.category}</span>}
                    {expense.paymentMethod && (
                      <span className="text-xs text-gray-400">· {PAYMENT_ICONS[expense.paymentMethod]} {expense.paymentMethod}</span>
                    )}
                    {expense.vatIncluded === false && (
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        expense.expenseType === "INVOICE"
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {expense.expenseType === "INVOICE" ? "📋 חשבונית" : "💵 מזומן"} ללא מעמ
                      </span>
                    )}
                    {expense.notes && <span className="text-xs text-gray-400 truncate">· {expense.notes}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-bold text-red-600">{formatCurrency(expense.amount)}</span>
                  {expense.invoiceUrl && (
                    <a href={expense.invoiceUrl} target="_blank" rel="noopener noreferrer" title="פתח חשבונית"
                      className="text-indigo-300 hover:text-indigo-600 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </a>
                  )}
                  {expense.receiptUrl && (
                    <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer" title="פתח קבלה"
                      className="text-gray-300 hover:text-blue-500 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(expense.id)}
                    disabled={deleting === expense.id}
                    className="text-gray-300 hover:text-red-400 transition-colors disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Archive / Reset modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-gray-900">איפוס חשבון</h2>
                <p className="text-xs text-gray-400 mt-0.5">{expenses.length} הוצאות יועברו להיסטוריה</p>
              </div>
              <button onClick={() => { setShowArchiveModal(false); setArchiveError(""); }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleArchive} className="p-5 space-y-4">
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-xs text-orange-700">
                כל ההוצאות הנוכחיות יישמרו בארכיון ולא יימחקו. לאחר האיפוס תוכל לצפות בהן תחת "היסטוריה".
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">שם לתקופה זו *</label>
                <input
                  type="text"
                  value={archiveName}
                  onChange={e => setArchiveName(e.target.value)}
                  required
                  placeholder="לדוגמה: 2024, ינואר-יוני 2025..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">הערות (אופציונלי)</label>
                <input
                  type="text"
                  value={archiveNotes}
                  onChange={e => setArchiveNotes(e.target.value)}
                  placeholder="פרטים נוספים..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              {archiveError && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 text-red-600 text-sm">{archiveError}</div>
              )}
              <div className="flex gap-3">
                <button type="submit" disabled={archiving || !archiveName.trim()}
                  className="flex-1 bg-orange-500 hover:bg-orange-400 disabled:bg-gray-200 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">
                  {archiving ? "מעביר לארכיון..." : "אפס וארכב"}
                </button>
                <button type="button" onClick={() => { setShowArchiveModal(false); setArchiveError(""); }}
                  className="px-5 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-2.5 rounded-xl text-sm">
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-gray-900">היסטוריית חשבונות</h2>
                <p className="text-xs text-gray-400 mt-0.5">{archives.length} תקופות בארכיון</p>
              </div>
              <button onClick={() => { setShowHistory(false); setViewingArchive(null); }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5">
              {viewingArchive ? (
                /* Archived expenses list */
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <button onClick={() => setViewingArchive(null)} className="text-gray-400 hover:text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <div>
                      <h3 className="font-semibold text-gray-800">{viewingArchive.name}</h3>
                      <p className="text-xs text-gray-400">{viewingArchive.expenseCount} הוצאות · {formatCurrency(viewingArchive.totalAmount)}</p>
                    </div>
                    <div className="mr-auto flex gap-2">
                      <button onClick={() => exportToXlsx(archiveExpenses, viewingArchive.name)}
                        className="flex items-center gap-1 text-xs border border-gray-200 text-gray-600 hover:bg-gray-50 px-2.5 py-1.5 rounded-lg transition-colors">
                        <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Excel
                      </button>
                      <button onClick={() => exportToPdf(archiveExpenses, viewingArchive.name, "הכל")}
                        className="flex items-center gap-1 text-xs border border-gray-200 text-gray-600 hover:bg-gray-50 px-2.5 py-1.5 rounded-lg transition-colors">
                        <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        PDF
                      </button>
                    </div>
                  </div>
                  {loadingArchive ? (
                    <div className="text-center py-8 text-gray-400 text-sm">טוען...</div>
                  ) : (
                    <div className="space-y-2">
                      {archiveExpenses.map(expense => (
                        <div key={expense.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${ENTITY_COLORS[expense.entity]}`}>{expense.entity}</span>
                              <p className="text-sm text-gray-800 truncate">{expense.description}</p>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">{formatDate(expense.date)}{expense.category ? ` · ${expense.category}` : ""}</p>
                          </div>
                          <span className="text-sm font-bold text-red-600 flex-shrink-0">{formatCurrency(expense.amount)}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between bg-green-50 border border-green-100 rounded-xl px-4 py-3 mt-2">
                        <span className="text-sm font-semibold text-gray-700">סה"כ</span>
                        <span className="font-bold text-green-700">{formatCurrency(archiveExpenses.reduce((s, e) => s + e.amount, 0))}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Archives list */
                <div className="space-y-3">
                  {archives.map(archive => (
                    <button key={archive.id} onClick={() => viewArchive(archive)}
                      className="w-full text-right bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-xl px-4 py-3.5 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="text-right">
                          <p className="font-semibold text-gray-800">{archive.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {archive.expenseCount} הוצאות · {new Date(archive.createdAt).toLocaleDateString("he-IL")}
                          </p>
                          {archive.notes && <p className="text-xs text-gray-400">{archive.notes}</p>}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-900">{formatCurrency(archive.totalAmount)}</span>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add expense modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-bold text-gray-900">הוספת הוצאה</h2>
              <button onClick={() => { setShowForm(false); setForm(emptyForm()); }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAdd} className="p-5 space-y-4">
              {/* Entity selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">מי הוציא *</label>
                <div className="grid grid-cols-2 gap-2">
                  {ENTITIES.map((entity) => (
                    <button key={entity} type="button" onClick={() => update("entity", entity)}
                      className={`text-sm font-medium py-2.5 px-3 rounded-xl border transition-all ${
                        form.entity === entity
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                      }`}>
                      {entity}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">תיאור ההוצאה *</label>
                <input type="text" value={form.description} onChange={(e) => update("description", e.target.value)}
                  required placeholder="קניית חומרים, דלק..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent" />
              </div>

              {/* Amount + VAT toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">סכום (₪) *</label>
                <input type="number" value={form.amount} onChange={(e) => update("amount", e.target.value)}
                  required min="0" step="0.01" placeholder="0" dir="ltr"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent" />

                {/* VAT status toggle */}
                <div className="flex gap-2 mt-2">
                  <button type="button" onClick={() => update("vatIncluded", true)}
                    className={`flex-1 text-xs font-medium py-2 rounded-xl border transition-all ${
                      form.vatIncluded
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}>
                    כולל מעמ
                  </button>
                  <button type="button" onClick={() => update("vatIncluded", false)}
                    className={`flex-1 text-xs font-medium py-2 rounded-xl border transition-all ${
                      !form.vatIncluded
                        ? "border-orange-400 bg-orange-50 text-orange-700"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}>
                    לא כולל מעמ
                  </button>
                </div>

                {/* VAT breakdown (shown when NOT including VAT and amount is entered) */}
                {!form.vatIncluded && numericAmount > 0 && (
                  <div className="mt-3 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 space-y-1.5">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>סכום נטו (ללא מעמ)</span>
                      <span dir="ltr">{formatCurrency(numericAmount)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>מעמ 17%</span>
                      <span dir="ltr">{formatCurrency(vatAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-orange-800 pt-1 border-t border-orange-200">
                      <span>סה"כ לתשלום</span>
                      <span dir="ltr">{formatCurrency(totalWithVat)}</span>
                    </div>
                  </div>
                )}

                {/* Expense type — only when NOT including VAT */}
                {!form.vatIncluded && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">סוג הוצאה *</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => update("expenseType", "CASH")}
                        className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2.5 rounded-xl border transition-all ${
                          form.expenseType === "CASH"
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}>
                        <span>💵</span> מזומן
                      </button>
                      <button type="button" onClick={() => update("expenseType", "INVOICE")}
                        className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2.5 rounded-xl border transition-all ${
                          form.expenseType === "INVOICE"
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}>
                        <span>📋</span> כנגד חשבונית
                      </button>
                    </div>

                    {/* Invoice upload — only for INVOICE type */}
                    {form.expenseType === "INVOICE" && (
                      <div className="mt-2">
                        <input ref={invoiceRef} type="file" accept="image/*,.pdf" className="hidden"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, "invoice"); }} />
                        {form.invoiceUrl ? (
                          <div className="flex items-center gap-2 border border-indigo-200 bg-indigo-50 rounded-xl px-3 py-2">
                            <svg className="w-4 h-4 text-indigo-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-xs text-indigo-700 truncate flex-1">{form.invoiceFileName || "חשבונית הועלתה"}</span>
                            <button type="button" onClick={() => setForm((p) => ({ ...p, invoiceUrl: "", invoiceFileName: "" }))}
                              className="text-indigo-400 hover:text-red-400 flex-shrink-0">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => invoiceRef.current?.click()}
                            disabled={uploadingFile === "invoice"}
                            className="w-full border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-xl px-4 py-2.5 text-xs text-indigo-500 hover:text-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                            {uploadingFile === "invoice" ? (
                              <><svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>מעלה...</>
                            ) : (
                              <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                              </svg>צרף חשבונית (תמונה / PDF)</>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">תאריך *</label>
                  <input type="date" value={form.date} onChange={(e) => update("date", e.target.value)}
                    required dir="ltr"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">קטגוריה</label>
                  <select value={form.category} onChange={(e) => update("category", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent">
                    <option value="">ללא קטגוריה</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">אופן תשלום</label>
                <select value={form.paymentMethod} onChange={(e) => update("paymentMethod", e.target.value as PaymentMethod | "")}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent">
                  <option value="">בחר...</option>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{PAYMENT_ICONS[m]} {m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">הערות</label>
                <input type="text" value={form.notes} onChange={(e) => update("notes", e.target.value)}
                  placeholder="פרטים נוספים..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent" />
              </div>

              {/* Receipt upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">אסמכתא / קבלה</label>
                <input ref={receiptRef} type="file" accept="image/*,.pdf" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, "receipt"); }} />
                {form.receiptUrl ? (
                  <div className="flex items-center gap-2 border border-green-200 bg-green-50 rounded-xl px-4 py-2.5">
                    <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-green-700 truncate flex-1">{form.receiptFileName || "קובץ הועלה"}</span>
                    <button type="button" onClick={() => setForm((p) => ({ ...p, receiptUrl: "", receiptFileName: "" }))}
                      className="text-green-500 hover:text-red-400 transition-colors flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => receiptRef.current?.click()}
                    disabled={uploadingFile === "receipt"}
                    className="w-full border-2 border-dashed border-gray-200 hover:border-green-400 rounded-xl px-4 py-3 text-sm text-gray-500 hover:text-green-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                    {uploadingFile === "receipt" ? (
                      <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>מעלה קובץ...</>
                    ) : (
                      <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>צרף קבלה / אסמכתא</>
                    )}
                  </button>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm">{error}</div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving || uploadingFile !== null}
                  className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-200 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">
                  {saving ? "שומר..." : "הוסף הוצאה"}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm()); }}
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
