"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const TRADES = ["All", "Electrical", "Plumbing", "HVAC", "Roofing", "Framing", "Concrete", "Excavation", "Painting", "Drywall", "Flooring", "Landscaping"];

type Professional = {
  id: string; name: string; businessName?: string | null; avatarUrl?: string | null; trade?: string | null;
  userRole: string; zipCode?: string | null; rating: number; ratingCount: number; isVerified: boolean; bio?: string | null;
};

function Stars({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map(i => (
          <svg key={i} className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        ))}
      </div>
      {count > 0 && <span className="text-xs text-gray-400">({count})</span>}
    </div>
  );
}

function ProfessionalCard({ pro }: { pro: Professional }) {
  return (
    <Link href={`/professionals/${pro.id}`} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 block">
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center flex-shrink-0">
          {pro.avatarUrl ? (
            <img src={pro.avatarUrl} className="w-full h-full rounded-2xl object-cover" alt={pro.name} />
          ) : (
            <span className="text-white text-xl font-bold">{pro.name.charAt(0)}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h3 className="font-bold text-gray-900 text-sm truncate">{pro.businessName || pro.name}</h3>
            {pro.isVerified && <span className="text-blue-500 text-sm">✓</span>}
          </div>
          {pro.businessName && <p className="text-xs text-gray-400 mb-1">{pro.name}</p>}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${pro.userRole === "GC" ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"}`}>
              {pro.userRole}
            </span>
            {pro.trade && <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full border border-orange-100">{pro.trade}</span>}
            {pro.zipCode && <span className="text-[10px] text-gray-400">📍 {pro.zipCode}</span>}
          </div>
          {pro.rating > 0 ? <Stars rating={pro.rating} count={pro.ratingCount} /> : <p className="text-xs text-gray-300">No reviews yet</p>}
          {pro.bio && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{pro.bio}</p>}
        </div>
      </div>
    </Link>
  );
}

export default function DirectoryClient() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [trade, setTrade] = useState("All");
  const [userRole, setUserRole] = useState("All");
  const [q, setQ] = useState("");
  const [zipCode, setZipCode] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (trade !== "All") params.set("trade", trade);
    if (userRole !== "All") params.set("userRole", userRole);
    if (q) params.set("q", q);
    if (zipCode) params.set("zipCode", zipCode);
    const res = await fetch(`/api/directory?${params}`);
    if (res.ok) { const d = await res.json(); setProfessionals(d.professionals); }
    setLoading(false);
  }, [trade, userRole, q, zipCode]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Professional Directory</h1>
        <p className="text-sm text-gray-500">Find contractors and subcontractors near you</p>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5 shadow-sm space-y-3">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name or trade..." className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-green-400" />
          </div>
          <input value={zipCode} onChange={e => setZipCode(e.target.value)} placeholder="Zip code" className="w-28 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400" />
        </div>

        <div className="flex gap-2">
          {["All", "GC", "SUB"].map(r => (
            <button key={r} onClick={() => setUserRole(r)} className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all ${userRole === r ? "bg-green-600 text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}>
              {r === "All" ? "All Types" : r === "GC" ? "General Contractors" : "Subcontractors"}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {TRADES.map(t => (
            <button key={t} onClick={() => setTrade(t)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${trade === t ? "bg-green-600 text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <p className="text-sm text-gray-400 mb-3">{professionals.length} professional{professionals.length !== 1 ? "s" : ""} found</p>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">{[1,2,3,4,5,6].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-28 animate-pulse" />)}</div>
      ) : professionals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-gray-500 font-medium">No professionals found</p>
          <p className="text-gray-400 text-sm mt-1">Try different filters or a different zip code</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {professionals.map(p => <ProfessionalCard key={p.id} pro={p} />)}
        </div>
      )}
    </div>
  );
}
