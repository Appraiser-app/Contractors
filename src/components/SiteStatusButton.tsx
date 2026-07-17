"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Status = "ACTIVE" | "COMPLETED" | "ON_HOLD";

const options: { value: Status; label: string; color: string; dot: string }[] = [
  { value: "ACTIVE",    label: "פעיל",   color: "bg-green-100 text-green-700 hover:bg-green-200",  dot: "bg-green-500" },
  { value: "COMPLETED", label: "הושלם",  color: "bg-blue-100 text-blue-700 hover:bg-blue-200",    dot: "bg-blue-500" },
  { value: "ON_HOLD",   label: "מושהה",  color: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200", dot: "bg-yellow-500" },
];

export default function SiteStatusButton({
  siteId,
  currentStatus,
  isAdmin,
}: {
  siteId: string;
  currentStatus: Status;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = options.find((o) => o.value === status)!;

  async function changeStatus(newStatus: Status) {
    if (newStatus === status) { setOpen(false); return; }
    setLoading(true);
    setOpen(false);
    const res = await fetch(`/api/sites/${siteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setStatus(newStatus);
      router.refresh();
    }
    setLoading(false);
  }

  if (!isAdmin) {
    return (
      <span className={`text-xs font-medium px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${current.color}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
        {current.label}
      </span>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        className={`text-xs font-medium px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${current.color} ${loading ? "opacity-60" : ""}`}
        title="שנה סטטוס"
      >
        <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
        {loading ? "..." : current.label}
        <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full mt-1 right-0 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 min-w-[110px]">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => changeStatus(opt.value)}
              className={`w-full text-right px-3 py-2 text-xs font-medium flex items-center gap-2 transition-colors ${
                opt.value === status ? "bg-gray-50 cursor-default" : "hover:bg-gray-50"
              }`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${opt.dot}`} />
              {opt.label}
              {opt.value === status && (
                <svg className="w-3 h-3 text-gray-400 mr-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
