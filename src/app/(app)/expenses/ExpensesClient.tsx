"use client";

import { useState, useRef } from "react";
import { uploadReceipt } from "@/lib/upload";

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

export default function ExpensesClient({ initialExpenses }: { initialExpenses: Expense[] }) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [showForm, setShowForm] = useState(false);
  const [filterEntity, setFilterEntity] = useState<ExpenseEntity | "הכל">("הכל");
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

  const filtered = filterEntity === "הכל" ? expenses : expenses.filter((e) => e.entity === filterEntity);

  const totals = ENTITIES.map((entity) => ({
    entity,
    total: expenses.filter((e) => e.entity === entity).reduce((s, e) => s + e.amount, 0),
  }));

  const grandTotal = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">הוצאות</h1>
          <p className="text-gray-500 text-sm mt-1">מעקב הוצאות לפי ישות</p>
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
