"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { InvoiceStatus } from "@/lib/db";

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: string }> = {
  NOT_ISSUED: { label: "לא הונפקה", color: "bg-gray-100 text-gray-500" },
  ISSUED: { label: "הונפקה", color: "bg-blue-100 text-blue-600" },
  SENT: { label: "נשלחה ללקוח", color: "bg-yellow-100 text-yellow-700" },
  PAID: { label: "שולמה", color: "bg-green-100 text-green-700" },
};

const STATUS_OPTIONS: InvoiceStatus[] = ["NOT_ISSUED", "ISSUED", "SENT", "PAID"];

export default function InvoiceStatusBadge({
  status,
  transactionId,
}: {
  status: InvoiceStatus;
  transactionId: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const cfg = STATUS_CONFIG[status];

  async function changeStatus(newStatus: InvoiceStatus) {
    if (newStatus === status) { setOpen(false); return; }
    setLoading(true);
    try {
      await fetch(`/api/transactions/${transactionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceStatus: newStatus }),
      });
      router.refresh();
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        className={`text-[11px] font-medium px-2 py-0.5 rounded-full transition-colors cursor-pointer hover:opacity-80 ${cfg.color}`}
        title="שנה סטטוס חשבונית"
      >
        🧾 {cfg.label}
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-6 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[140px]">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => changeStatus(s)}
                className={`block w-full text-right text-xs px-3 py-2 hover:bg-gray-50 transition-colors ${
                  s === status ? "font-bold" : ""
                }`}
              >
                <span className={`inline-block px-1.5 py-0.5 rounded-full ${STATUS_CONFIG[s].color}`}>
                  {STATUS_CONFIG[s].label}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
