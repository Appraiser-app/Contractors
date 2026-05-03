"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Equipment } from "@/lib/db";

export default function EquipmentForm({ equipment }: { equipment?: Equipment }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: equipment?.name || "",
    type: equipment?.type || "TRUCK",
    licensePlate: equipment?.licensePlate || "",
    year: equipment?.year?.toString() || "",
    description: equipment?.description || "",
    status: equipment?.status || "ACTIVE",
  });

  function update(field: string, value: string) {
    setForm(p => ({ ...p, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const body = { ...form, year: form.year ? parseInt(form.year) : null, licensePlate: form.licensePlate || null, description: form.description || null };

    const res = await fetch(equipment ? `/api/equipment/${equipment.id}` : "/api/equipment", {
      method: equipment ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      router.push(`/equipment/${data.id}`);
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">שם הכלי *</label>
            <input type="text" value={form.name} onChange={e => update("name", e.target.value)} required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="משאית מן 18 טון" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">סוג</label>
            <select value={form.type} onChange={e => update("type", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
              <option value="TRUCK">🚛 משאית</option>
              <option value="MINI_EXCAVATOR">🏗️ מיני מחפרון</option>
              <option value="BOBCAT">🟡 בובקט</option>
              <option value="OTHER">⚙️ אחר</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">מספר רישוי</label>
            <input type="text" value={form.licensePlate} onChange={e => update("licensePlate", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="12-345-67" dir="ltr" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">שנת ייצור</label>
            <input type="number" value={form.year} onChange={e => update("year", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="2018" min="1980" max={new Date().getFullYear()} dir="ltr" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">סטטוס</label>
            <select value={form.status} onChange={e => update("status", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
              <option value="ACTIVE">פעיל</option>
              <option value="IN_REPAIR">בתיקון</option>
              <option value="INACTIVE">לא פעיל</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">תיאור</label>
          <textarea value={form.description} onChange={e => update("description", e.target.value)} rows={2}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="פרטים נוספים על הכלי..." />
        </div>

        {error && <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm">{error}</div>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-200 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">
            {loading ? "שומר..." : equipment ? "עדכון כלי" : "הוספת כלי"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-6 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-2.5 rounded-xl transition-colors text-sm">
            ביטול
          </button>
        </div>
      </form>
    </div>
  );
}
