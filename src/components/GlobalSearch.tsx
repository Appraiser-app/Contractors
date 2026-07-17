"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type ResultType = "site" | "transaction" | "equipment" | "task" | "expense";

type SearchResult = {
  type: ResultType;
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

const TYPE_CONFIG: Record<ResultType, { label: string; icon: string; color: string; bg: string }> = {
  site:        { label: "אתר עבודה",   icon: "🏗",  color: "text-blue-600",   bg: "bg-blue-50"   },
  transaction: { label: "עסקה",        icon: "💰",  color: "text-green-600",  bg: "bg-green-50"  },
  equipment:   { label: "ציוד",        icon: "🔧",  color: "text-amber-600",  bg: "bg-amber-50"  },
  task:        { label: "משימה",       icon: "✅",  color: "text-purple-600", bg: "bg-purple-50" },
  expense:     { label: "הוצאה",      icon: "🧾",  color: "text-red-600",    bg: "bg-red-50"    },
};

function highlight(text: string, q: string) {
  if (!q || q.length < 2) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 text-yellow-900 rounded px-0.5 not-italic font-semibold">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

export default function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Open on "/" keypress globally
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
      setActive(0);
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results);
        setActive(0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 280);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!results.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    if (e.key === "Enter") {
      e.preventDefault();
      const r = results[active];
      if (r) { router.push(r.href); setOpen(false); }
    }
  }

  function handleSelect(href: string) {
    router.push(href);
    setOpen(false);
  }

  // Group results by type
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {});

  const totalCount = results.length;
  const showEmpty = query.length >= 2 && !loading && totalCount === 0;

  return (
    <>
      {/* Search button */}
      <button
        type="button"
        aria-label="חיפוש"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-full text-[13px] transition-all"
        title="חיפוש גלובלי  (/)"
      >
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="hidden sm:block font-medium">חיפוש</span>
        <kbd className="hidden sm:block text-[10px] bg-white border border-gray-200 rounded px-1 font-mono text-gray-400">/</kbd>
      </button>

      {/* Search panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4" dir="rtl">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          <div
            ref={panelRef}
            className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Input row */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
              <svg className="w-4.5 h-4.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="חפש אתרים, עסקאות, ציוד, משימות..."
                className="flex-1 text-sm text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none"
                autoComplete="off"
              />
              {loading && (
                <svg className="w-4 h-4 text-gray-400 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              <kbd
                className="text-[10px] bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 font-mono text-gray-400 flex-shrink-0 cursor-pointer"
                onClick={() => setOpen(false)}
              >
                Esc
              </kbd>
            </div>

            {/* Results */}
            {totalCount > 0 && (
              <div className="max-h-[420px] overflow-y-auto py-2">
                {(Object.entries(grouped) as [ResultType, SearchResult[]][]).map(([type, items]) => {
                  const cfg = TYPE_CONFIG[type];
                  return (
                    <div key={type} className="mb-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 pt-2 pb-1">
                        {cfg.label}
                      </p>
                      {items.map((r) => {
                        const globalIdx = results.indexOf(r);
                        const isActive = globalIdx === active;
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onMouseEnter={() => setActive(globalIdx)}
                            onClick={() => handleSelect(r.href)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-right transition-colors ${isActive ? "bg-green-50" : "hover:bg-gray-50"}`}
                          >
                            <div className={`w-8 h-8 ${cfg.bg} rounded-lg flex items-center justify-center flex-shrink-0 text-base`}>
                              {cfg.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold truncate ${isActive ? "text-green-700" : "text-gray-900"}`}>
                                {highlight(r.title, query)}
                              </p>
                              {r.subtitle && (
                                <p className="text-xs text-gray-400 truncate mt-0.5">{r.subtitle}</p>
                              )}
                            </div>
                            {isActive && (
                              <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty state */}
            {showEmpty && (
              <div className="py-12 text-center">
                <div className="text-3xl mb-2">🔍</div>
                <p className="text-sm font-medium text-gray-500">אין תוצאות עבור &quot;{query}&quot;</p>
                <p className="text-xs text-gray-300 mt-1">נסה מילה אחרת</p>
              </div>
            )}

            {/* Hint (initial state) */}
            {query.length < 2 && !loading && (
              <div className="py-8 px-4 text-center">
                <p className="text-xs text-gray-400 mb-3">חיפוש מהיר בכל הנתונים</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {Object.entries(TYPE_CONFIG).map(([, cfg]) => (
                    <span key={cfg.label} className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                      {cfg.icon} {cfg.label}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-gray-300 mt-4">השתמש בחצים ↑ ↓ לניווט, Enter לבחירה</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
