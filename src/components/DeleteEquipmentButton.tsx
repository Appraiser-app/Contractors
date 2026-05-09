"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteEquipmentButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const res = await fetch(`/api/equipment/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/equipment");
      router.refresh();
    } else {
      setLoading(false);
      setConfirm(false);
      alert("שגיאה במחיקה");
    }
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2 border border-red-200 bg-red-50 rounded-xl px-3 py-2">
        <span className="text-xs text-red-700 font-medium">למחוק את &quot;{name}&quot;?</span>
        <button onClick={handleDelete} disabled={loading}
          className="text-xs bg-red-600 hover:bg-red-500 text-white font-semibold px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50">
          {loading ? "..." : "מחק"}
        </button>
        <button onClick={() => setConfirm(false)} className="text-xs text-gray-500 hover:text-gray-700">ביטול</button>
      </div>
    );
  }

  return (
    <button onClick={() => setConfirm(true)}
      className="flex items-center gap-1.5 border border-red-100 text-red-500 hover:bg-red-50 font-medium px-3 py-2 rounded-xl transition-colors text-sm flex-shrink-0">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      מחק
    </button>
  );
}
