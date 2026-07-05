"use client";

import { useState } from "react";
import Link from "next/link";

type Post = { id: string; imageUrls: string[]; content?: string | null; trade?: string | null; likesCount: number; createdAt: string };
type Review = { id: string; rating: number; comment?: string | null; createdAt: string; reviewer: { id: string; name: string; avatarUrl?: string | null } | null };
type Profile = {
  id: string; name: string; businessName?: string | null; avatarUrl?: string | null; trade?: string | null;
  userRole: string; zipCode?: string | null; rating: number; ratingCount: number; isVerified: boolean;
  bio?: string | null; serviceRadius: number; website?: string | null; phone?: string | null; createdAt: Date;
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className={`w-4 h-4 ${i <= Math.round(rating) ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  );
}

function ReviewModal({ revieweeId, onClose, onDone }: { revieweeId: string; onClose: () => void; onDone: () => void }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/reviews", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ revieweeId, rating, comment }),
    });
    setSubmitting(false);
    if (res.ok) { onDone(); onClose(); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Leave a Review</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-2 block">Rating</label>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(i => (
                <button key={i} type="button" onClick={() => setRating(i)} className="focus:outline-none">
                  <svg className={`w-8 h-8 transition-colors ${i <= rating ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Comments</label>
            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} placeholder="Describe your experience..." className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400 resize-none" />
          </div>
          <button type="submit" disabled={submitting} className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50">
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ProfessionalProfileClient({ profile, posts, reviews, isOwnProfile, currentUserId }: {
  profile: Profile; posts: Post[]; reviews: Review[]; isOwnProfile: boolean; currentUserId: string;
}) {
  const [activeTab, setActiveTab] = useState<"portfolio" | "reviews">("portfolio");
  const [showReview, setShowReview] = useState(false);
  const [localReviews, setLocalReviews] = useState(reviews);

  async function reloadReviews() {
    const res = await fetch(`/api/reviews?userId=${profile.id}`);
    if (res.ok) { const d = await res.json(); setLocalReviews(d.reviews); }
  }

  function timeAgo(d: Date | string) {
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(d).toLocaleDateString();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Back */}
      <Link href="/directory" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 mb-5">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
        Directory
      </Link>

      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-5">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center flex-shrink-0 shadow-lg">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} className="w-full h-full rounded-2xl object-cover" alt={profile.name} />
            ) : (
              <span className="text-white text-3xl font-bold">{profile.name.charAt(0)}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{profile.businessName || profile.name}</h1>
              {profile.isVerified && (
                <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-xs font-medium">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  Verified
                </div>
              )}
            </div>
            {profile.businessName && <p className="text-sm text-gray-500">{profile.name}</p>}
            <div className="flex items-center gap-2 flex-wrap mt-1.5">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${profile.userRole === "GC" ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"}`}>
                {profile.userRole === "GC" ? "General Contractor" : profile.userRole === "SUB" ? "Subcontractor" : "Community"}
              </span>
              {profile.trade && <span className="text-xs bg-orange-50 text-orange-600 px-2.5 py-1 rounded-full border border-orange-100">{profile.trade}</span>}
              {profile.zipCode && <span className="text-xs text-gray-400 flex items-center gap-1">📍 {profile.zipCode} · {profile.serviceRadius}mi radius</span>}
            </div>
            {profile.rating > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <Stars rating={profile.rating} />
                <span className="text-sm font-semibold text-gray-700">{profile.rating.toFixed(1)}</span>
                <span className="text-sm text-gray-400">({profile.ratingCount} review{profile.ratingCount !== 1 ? "s" : ""})</span>
              </div>
            )}
          </div>
        </div>

        {profile.bio && <p className="text-sm text-gray-700 leading-relaxed mt-4 pt-4 border-t border-gray-50">{profile.bio}</p>}

        <div className="flex gap-3 mt-4 flex-wrap">
          {profile.website && (
            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-green-600 hover:underline">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
              Website
            </a>
          )}
        </div>

        {!isOwnProfile && (
          <div className="flex gap-3 mt-4">
            <Link href={`/messages?userId=${profile.id}`} className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
              Message
            </Link>
            <button onClick={() => setShowReview(true)} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              Leave Review
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
        {(["portfolio", "reviews"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {tab === "portfolio" ? `Portfolio (${posts.length})` : `Reviews (${localReviews.length})`}
          </button>
        ))}
      </div>

      {/* Portfolio */}
      {activeTab === "portfolio" && (
        posts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-gray-400">No portfolio posts yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {posts.map(post => (
              <div key={post.id} className="aspect-square rounded-xl overflow-hidden bg-gray-100 relative group">
                {post.imageUrls[0] ? (
                  <img src={post.imageUrls[0]} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 p-3 text-xs text-center">{post.content?.slice(0, 60)}</div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <span className="text-white text-xs font-semibold flex items-center gap-1">❤️ {post.likesCount}</span>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Reviews */}
      {activeTab === "reviews" && (
        localReviews.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-gray-400">No reviews yet</p>
            {!isOwnProfile && <button onClick={() => setShowReview(true)} className="mt-4 px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium">Be the first to review</button>}
          </div>
        ) : (
          <div className="space-y-3">
            {localReviews.map(review => (
              <div key={review.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">{review.reviewer?.name?.charAt(0)}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{review.reviewer?.name}</p>
                    <p className="text-xs text-gray-400">{timeAgo(review.createdAt)}</p>
                  </div>
                  <Stars rating={review.rating} />
                </div>
                {review.comment && <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>}
              </div>
            ))}
          </div>
        )
      )}

      {showReview && <ReviewModal revieweeId={profile.id} onClose={() => setShowReview(false)} onDone={reloadReviews} />}
    </div>
  );
}
