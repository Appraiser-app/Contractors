"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const categories = {
  INCOME: ["תשלום לקוח", "מקדמה", "סיום שלב", "אחר"],
  EXPENSE: ["ציוד", "דלק", "שכר עובדים", "חומרים", "שכירות", "ביטוח", "טיפול", "אחר"],
};

type Transaction = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  category: string | null;
  date: string;
};

export default function EditTransactionModal({
  transaction,
  onClose,
}: {
  transaction: Transaction;
  onClose: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    type: transaction.type,
    amount: String(transaction.amount),
    description: transaction.description,
    category: transaction.category || "",
    date: transaction.date.split("T")[0],
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch(`/api/transactions/${transaction.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: form.type,
        amount: Number.parseFloat(form.amount),
        description: form.description,
        category: form.category || null,
        date: form.date,
      }),
    });
    if (res.ok) {
      router.refresh();
      onClose();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "שגיאה");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">עריכת תנועה</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex gap-2">
            {(["INCOME", "EXPENSE"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => update("type", t)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  form.type === t
                    ? t === "INCOME" ? "bg-green-500 text-white" : "bg-red-500 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {t === "INCOME" ? "הכנסה" : "הוצאה"}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">סכום (₪) *</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => update("amount", e.target.value)}
                required
                min="0.01"
                step="0.01"
                dir="ltr"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">תאריך</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => update("date", e.target.value)}
                dir="ltr"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">תיאור *</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">קטגוריה</label>
            <select
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 bg-white"
            >
              <option value="">בחר קטגוריה</option>
              {categories[form.type].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-500 hover:bg-green-400 disabled:bg-gray-200 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
            >
              {loading ? "שומר..." : "שמור שינויים"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-xl text-sm transition-colors"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
