"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CollectButton({ siteId }: { siteId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  async function handleCollect() {
    if (!confirmed) { setConfirmed(true); return; }
    setLoading(true);
    await fetch(`/api/sites/${siteId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "collect" }),
    });
    router.refresh();
  }

  return (
    <button
      onClick={handleCollect}
      disabled={loading}
      className={`text-sm font-medium px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50 ${
        confirmed
          ? "bg-green-600 text-white hover:bg-green-500"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`}
    >
      {loading ? "..." : confirmed ? "אשר גבייה" : "סמן כנגבה"}
    </button>
  );
}
