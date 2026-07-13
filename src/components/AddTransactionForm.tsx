"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { uploadReceipt } from "@/lib/upload";

const categories = {
  INCOME: ["תשלום לקוח", "מקדמה", "סיום שלב", "אחר"],
  EXPENSE: ["ציוד", "דלק", "שכר עובדים", "חומרים", "שכירות", "ביטוח", "טיפול", "אחר"],
};

export default function AddTransactionForm({ siteId }: { siteId: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [vatIncluded, setVatIncluded] = useState(false);
  const [form, setForm] = useState({
    type: "INCOME",
    amount: "",
    description: "",
    category: "",
    date: new Date().toISOString().split("T")[0],
    invoiceStatus: "" as "" | "NOT_ISSUED" | "ISSUED" | "SENT" | "PAID",
  });

  const VAT = 0.18;
  const enteredAmount = parseFloat(form.amount) || 0;
  const amountNet = (form.type === "INCOME" && vatIncluded) ? enteredAmount / (1 + VAT) : enteredAmount;
  const amountGross = amountNet * (1 + VAT);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    let receiptUrl: string | null = null;
    if (receiptFile) {
      try {
        setUploading(true);
        receiptUrl = await uploadReceipt(receiptFile, "transactions");
        setUploading(false);
      } catch {
        setError("שגיאה בהעלאת הקבלה — בדוק הגדרות Firebase Storage");
        setLoading(false);
        setUploading(false);
        return;
      }
    }

    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, siteId, amount: amountNet, receiptUrl, invoiceStatus: form.invoiceStatus || null }),
    });

    if (res.ok) {
      setForm({ type: "INCOME", amount: "", description: "", category: "", date: new Date().toISOString().split("T")[0], invoiceStatus: "" });
      setReceiptFile(null);
      setOpen(false);
      router.refresh();
    } else {
      const err = await res.json();
      setError(err.error || "שגיאה");
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-white border border-dashed border-green-300 hover:border-green-500 text-green-600 hover:text-green-700 font-medium px-4 py-3 rounded-2xl w-full transition-colors text-sm"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        הוסף הכנסה / הוצאה
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-green-200 p-5">
      <h3 className="font-bold text-gray-900 mb-4">תנועה חדשה</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type toggle */}
        <div className="flex gap-2">
          {["INCOME", "EXPENSE"].map((t) => (
            <button key={t} type="button" onClick={() => update("type", t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                form.type === t
                  ? t === "INCOME" ? "bg-green-500 text-white" : "bg-red-500 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}>
              {t === "INCOME" ? "הכנסה" : "הוצאה"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">סכום (₪) *</label>
            <input type="number" value={form.amount} onChange={(e) => update("amount", e.target.value)}
              required min="0.01" step="0.01"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600"
              placeholder="1000" dir="ltr" />
            {form.type === "INCOME" && (
              <div className="mt-1.5 flex rounded-lg border border-gray-200 overflow-hidden text-[11px] font-medium">
                <button type="button" onClick={() => setVatIncluded(false)}
                  className={`flex-1 py-1.5 transition-colors ${!vatIncluded ? "bg-green-600 text-white" : "bg-white text-gray-500"}`}>
                  ללא מע״מ
                </button>
                <button type="button" onClick={() => setVatIncluded(true)}
                  className={`flex-1 py-1.5 transition-colors border-r border-gray-200 ${vatIncluded ? "bg-green-600 text-white" : "bg-white text-gray-500"}`}>
                  כולל מע״מ
                </button>
              </div>
            )}
            {form.type === "INCOME" && enteredAmount > 0 && (
              <div className="mt-1 text-[11px] text-gray-400 space-y-0.5">
                <div>נטו: <span className="text-gray-600 font-medium">₪{Math.round(amountNet).toLocaleString()}</span></div>
                <div>ברוטו כולל מע״מ: <span className="text-green-600 font-medium">₪{Math.round(amountGross).toLocaleString()}</span></div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">תאריך</label>
            <input type="date" value={form.date} onChange={(e) => update("date", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600"
              dir="ltr" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">תיאור *</label>
          <input type="text" value={form.description} onChange={(e) => update("description", e.target.value)} required
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600"
            placeholder={form.type === "INCOME" ? "תשלום עבור שלב א'" : "קנייה מדלק"} />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">קטגוריה</label>
          <select value={form.category} onChange={(e) => update("category", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 bg-white">
            <option value="">בחר קטגוריה</option>
            {categories[form.type as "INCOME" | "EXPENSE"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Invoice status */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">סטטוס חשבונית</label>
          <select value={form.invoiceStatus} onChange={(e) => update("invoiceStatus", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 bg-white">
            <option value="">לא רלוונטי</option>
            <option value="NOT_ISSUED">לא הונפקה</option>
            <option value="ISSUED">הונפקה</option>
            <option value="SENT">נשלחה ללקוח</option>
            <option value="PAID">שולמה</option>
          </select>
        </div>

        {/* Receipt upload */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">קבלה / תמונה (אופציונלי)</label>
          <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden"
            onChange={e => setReceiptFile(e.target.files?.[0] || null)} />
          {receiptFile ? (
            <div className="flex items-center gap-2 border border-green-200 bg-green-50 rounded-xl px-3 py-2">
              <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs text-green-700 flex-1 truncate">{receiptFile.name}</span>
              <button type="button" onClick={() => setReceiptFile(null)} className="text-green-400 hover:text-red-500 text-xs">הסר</button>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 w-full border border-dashed border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              צלם או העלה קבלה (תמונה / PDF)
            </button>
          )}
        </div>

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <div className="flex gap-2">
          <button type="submit" disabled={loading}
            className={`flex-1 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm ${
              form.type === "INCOME" ? "bg-green-500 hover:bg-green-400" : "bg-red-500 hover:bg-red-400"
            } disabled:bg-gray-200 disabled:cursor-not-allowed`}>
            {uploading ? "מעלה קבלה..." : loading ? "שומר..." : "הוסף"}
          </button>
          <button type="button" onClick={() => setOpen(false)}
            className="px-4 border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-xl text-sm transition-colors">
            ביטול
          </button>
        </div>
      </form>
    </div>
  );
}
