"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CompleteWorkButton({ siteId, createdAt }: { siteId: string; createdAt: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const hoursSinceCreation = (Date.now() - new Date(createdAt).getTime()) / 3600000;
  if (hoursSinceCreation < 24) return null;

  async function handleComplete() {
    if (!confirmed) { setConfirmed(true); return; }
    setLoading(true);
    await fetch(`/api/sites/${siteId}/complete`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    router.refresh();
  }

  return (
    <button
      onClick={handleComplete}
      disabled={loading}
      className={`flex items-center gap-1.5 font-medium px-3 py-2 rounded-xl transition-colors text-sm ${
        confirmed
          ? "bg-blue-600 text-white hover:bg-blue-500"
          : "bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      {loading ? "שומר..." : confirmed ? "לחץ לאישור סיום" : "סמן כהושלם"}
    </button>
  );
}
