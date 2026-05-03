"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Site = {
  id: string;
  name: string;
  location: string | null;
  description: string | null;
  clientName: string | null;
  clientPhone: string | null;
  contractValue: number | null;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
};

export default function SiteForm({ site }: { site?: Site }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: site?.name || "",
    location: site?.location || "",
    description: site?.description || "",
    clientName: site?.clientName || "",
    clientPhone: site?.clientPhone || "",
    contractValue: site?.contractValue?.toString() || "",
    status: site?.status || "ACTIVE",
    startDate: site?.startDate ? new Date(site.startDate).toISOString().split("T")[0] : "",
    endDate: site?.endDate ? new Date(site.endDate).toISOString().split("T")[0] : "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const body = {
      ...form,
      contractValue: form.contractValue ? parseFloat(form.contractValue) : null,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
    };

    const res = await fetch(site ? `/api/sites/${site.id}` : "/api/sites", {
      method: site ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      router.push(`/sites/${data.id}`);
      router.refresh();
    } else {
      const err = await res.json();
      setError(err.error || "שגיאה בשמירה");
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">שם האתר *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
              placeholder="פרויקט כביש 1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">מיקום</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
              placeholder="תל אביב"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">שם לקוח</label>
            <input
              type="text"
              value={form.clientName}
              onChange={(e) => update("clientName", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
              placeholder="חברת בנייה בע״מ"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">טלפון לקוח (WhatsApp)</label>
            <input
              type="tel"
              value={form.clientPhone}
              onChange={(e) => update("clientPhone", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
              placeholder="0501234567"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">ערך חוזה (₪)</label>
            <input
              type="number"
              value={form.contractValue}
              onChange={(e) => update("contractValue", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
              placeholder="500000"
              min="0"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">תאריך התחלה</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => update("startDate", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">תאריך סיום</label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => update("endDate", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
              dir="ltr"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">סטטוס</label>
          <select
            value={form.status}
            onChange={(e) => update("status", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm bg-white"
          >
            <option value="ACTIVE">פעיל</option>
            <option value="COMPLETED">הושלם</option>
            <option value="ON_HOLD">מושהה</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">תיאור</label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm resize-none"
            placeholder="תיאור הפרויקט..."
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-200 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
          >
            {loading ? "שומר..." : site ? "עדכון אתר" : "הוספת אתר"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-2.5 rounded-xl transition-colors text-sm"
          >
            ביטול
          </button>
        </div>
      </form>
    </div>
  );
}
