"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Bidder = { id: string; name: string; avatarUrl?: string | null; trade?: string | null; rating: number; ratingCount: number; isVerified: boolean } | null;
type Bid = { id: string; bidderId: string; price: number; availability?: string | null; notes?: string | null; status: string; createdAt: string; bidder: Bidder };

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
      {rating > 0 && <span className="text-xs text-gray-500 ml-1">({rating.toFixed(1)})</span>}
    </div>
  );
}

export default function BidsClient({ projectId }: { projectId: string }) {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/public-projects/${projectId}/bids`);
    if (res.ok) { const d = await res.json(); setBids(d.bids); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function updateBidStatus(bidId: string, status: string) {
    setUpdating(bidId);
    await fetch(`/api/bids/${bidId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    await load();
    setUpdating(null);
  }

  const statusColor: Record<string, string> = {
    PENDING: "bg-yellow-50 text-yellow-700",
    REVIEWED: "bg-blue-50 text-blue-700",
    AWARDED: "bg-green-50 text-green-700",
    DECLINED: "bg-red-50 text-red-700",
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/marketplace" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Bids Received</h1>
        <span className="text-sm text-gray-400">({bids.length})</span>
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-32 animate-pulse" />)}</div>
      ) : bids.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-gray-500">No bids yet. Keep your project open!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bids.map(bid => (
            <div key={bid.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center flex-shrink-0">
                    {bid.bidder?.avatarUrl ? (
                      <img src={bid.bidder.avatarUrl} className="w-full h-full rounded-full object-cover" alt="" />
                    ) : (
                      <span className="text-white font-bold">{bid.bidder?.name?.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Link href={`/professionals/${bid.bidderId}`} className="font-semibold text-gray-900 text-sm hover:underline">{bid.bidder?.name}</Link>
                      {bid.bidder?.isVerified && <span className="text-blue-500 text-xs">✓</span>}
                    </div>
                    {bid.bidder?.trade && <p className="text-xs text-gray-400">{bid.bidder.trade}</p>}
                    {(bid.bidder?.rating || 0) > 0 && <Stars rating={bid.bidder?.rating || 0} />}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-600">${bid.price.toLocaleString()}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[bid.status] || "bg-gray-100 text-gray-600"}`}>{bid.status}</span>
                </div>
              </div>

              {bid.availability && <p className="text-xs text-gray-500 mb-1">📅 {bid.availability}</p>}
              {bid.notes && <p className="text-sm text-gray-700 leading-relaxed mb-4">{bid.notes}</p>}

              {bid.status === "PENDING" && (
                <div className="flex gap-2">
                  <button onClick={() => updateBidStatus(bid.id, "AWARDED")} disabled={!!updating} className="flex-1 py-2 bg-green-600 text-white rounded-xl text-xs font-medium hover:bg-green-700 disabled:opacity-50">
                    ✓ Award
                  </button>
                  <button onClick={() => updateBidStatus(bid.id, "REVIEWED")} disabled={!!updating} className="flex-1 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-medium hover:bg-blue-100 disabled:opacity-50">
                    Mark Reviewed
                  </button>
                  <button onClick={() => updateBidStatus(bid.id, "DECLINED")} disabled={!!updating} className="flex-1 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-medium hover:bg-red-100 disabled:opacity-50">
                    Decline
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
