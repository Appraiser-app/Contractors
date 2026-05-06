"use client";

import { useState } from "react";

export default function SetupAdminPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok?: boolean; name?: string; email?: string; error?: string } | null>(null);

  async function promote() {
    setLoading(true);
    const res = await fetch("/api/promote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: "contractors-setup-2024" }),
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-8 w-full max-w-sm text-center">
        <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
          </svg>
        </div>
        <h1 className="text-white font-bold text-lg mb-2">הגדרת מנהל</h1>
        <p className="text-stone-400 text-sm mb-6">לחץ להפוך את החשבון שלך למנהל מערכת</p>

        {!result && (
          <button
            onClick={promote}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? "מעדכן..." : "קדם אותי ל-ADMIN"}
          </button>
        )}

        {result?.ok && (
          <div className="space-y-4">
            <div className="bg-green-900/30 border border-green-800 rounded-xl p-4">
              <p className="text-green-400 font-semibold text-sm">הצלחה!</p>
              <p className="text-white text-sm mt-1">{result.name}</p>
              <p className="text-stone-400 text-xs">{result.email}</p>
            </div>
            <a
              href="/dashboard"
              className="block w-full bg-stone-800 hover:bg-stone-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              חזור לאפליקציה →
            </a>
          </div>
        )}

        {result?.error && (
          <div className="bg-red-900/30 border border-red-800 rounded-xl p-4">
            <p className="text-red-400 text-sm">{result.error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
