"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const TRADES = ["All", "Electrical", "Plumbing", "HVAC", "Roofing", "Framing", "Concrete", "Excavation", "Painting", "Drywall", "Flooring", "Landscaping"];

type Profile = { id: string; name: string; avatarUrl?: string | null; trade?: string | null; userRole: string; isVerified: boolean; businessName?: string | null } | null;
type Post = {
  id: string; authorId: string; content?: string | null; imageUrls: string[]; trade?: string | null; zipCode?: string | null;
  likesCount: number; createdAt: string; author: Profile; isLiked: boolean;
};

function Avatar({ name, url, size = 10 }: { name?: string | null; url?: string | null; size?: number }) {
  if (url) return <img src={url} className={`w-${size} h-${size} rounded-full object-cover`} alt={name || ""} />;
  return (
    <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center flex-shrink-0`}>
      <span className="text-white font-bold text-sm">{name?.charAt(0)?.toUpperCase() || "?"}</span>
    </div>
  );
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function PostCard({ post, currentUserId, onLike }: { post: Post; currentUserId: string; onLike: (id: string) => void }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<{ id: string; content: string; author: Profile; createdAt: string }[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  async function toggleComments() {
    if (!showComments && comments.length === 0) {
      setLoadingComments(true);
      const res = await fetch(`/api/posts/${post.id}/comments`);
      if (res.ok) { const d = await res.json(); setComments(d.comments); }
      setLoadingComments(false);
    }
    setShowComments(v => !v);
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    const res = await fetch(`/api/posts/${post.id}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: newComment }) });
    if (res.ok) { const d = await res.json(); setComments(p => [...p, d.comment]); setNewComment(""); }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <Link href={`/professionals/${post.author?.id}`}>
          <Avatar name={post.author?.name} url={post.author?.avatarUrl} size={10} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Link href={`/professionals/${post.author?.id}`} className="font-semibold text-gray-900 text-sm hover:underline">
              {post.author?.businessName || post.author?.name}
            </Link>
            {post.author?.isVerified && <span className="text-blue-500 text-xs">✓</span>}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${post.author?.userRole === "GC" ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"}`}>
              {post.author?.userRole}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            {post.author?.trade && <span>{post.author.trade}</span>}
            {post.zipCode && <span>• {post.zipCode}</span>}
            <span>• {timeAgo(post.createdAt)}</span>
          </div>
        </div>
        {post.trade && (
          <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-1 rounded-full font-medium border border-orange-100">{post.trade}</span>
        )}
      </div>

      {/* Images */}
      {post.imageUrls.length > 0 && (
        <div className={`grid gap-0.5 ${post.imageUrls.length === 1 ? "grid-cols-1" : post.imageUrls.length === 2 ? "grid-cols-2" : "grid-cols-2"}`}>
          {post.imageUrls.slice(0, 4).map((url, i) => (
            <div key={i} className={`relative ${post.imageUrls.length === 1 ? "aspect-[4/3]" : "aspect-square"} ${i === 3 && post.imageUrls.length > 4 ? "relative" : ""}`}>
              <img src={url} className="w-full h-full object-cover" alt="" />
              {i === 3 && post.imageUrls.length > 4 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-xl font-bold">+{post.imageUrls.length - 4}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      {post.content && <p className="px-4 pt-3 pb-1 text-sm text-gray-800 leading-relaxed">{post.content}</p>}

      {/* Actions */}
      <div className="flex items-center gap-1 px-3 py-2 border-t border-gray-50">
        <button
          onClick={() => onLike(post.id)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${post.isLiked ? "text-red-500 bg-red-50" : "text-gray-500 hover:bg-gray-50"}`}
        >
          <svg className="w-4 h-4" fill={post.isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {post.likesCount > 0 && <span>{post.likesCount}</span>}
        </button>
        <button
          onClick={toggleComments}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Comment
        </button>
        <Link
          href={`/messages?userId=${post.author?.id}`}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 transition-all mr-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Message
        </Link>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t border-gray-50 px-4 pb-4">
          {loadingComments ? (
            <div className="py-4 text-center text-gray-400 text-sm">Loading...</div>
          ) : (
            <div className="space-y-3 mt-3">
              {comments.map(c => (
                <div key={c.id} className="flex gap-2.5">
                  <Avatar name={c.author?.name} url={c.author?.avatarUrl} size={7} />
                  <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                    <p className="text-xs font-semibold text-gray-800">{c.author?.name}</p>
                    <p className="text-xs text-gray-700 mt-0.5">{c.content}</p>
                  </div>
                </div>
              ))}
              <form onSubmit={addComment} className="flex gap-2 mt-2">
                <input
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 text-xs border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-green-400"
                />
                <button type="submit" className="px-3 py-2 bg-green-600 text-white rounded-xl text-xs font-medium">Post</button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CreatePostModal({ onClose, onCreated, profile }: { onClose: () => void; onCreated: () => void; profile: { id: string; name: string; zipCode?: string | null; trade?: string | null } | null }) {
  const [content, setContent] = useState("");
  const [trade, setTrade] = useState(profile?.trade || "");
  const [zipCode, setZipCode] = useState(profile?.zipCode || "");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    setUploading(false);
    if (res.ok) { const d = await res.json(); return d.url as string; }
    return null;
  }

  async function handleFiles(files: FileList) {
    for (const file of Array.from(files)) {
      const url = await uploadFile(file);
      if (url) setImageUrls(prev => [...prev, url]);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() && imageUrls.length === 0) return;
    setSubmitting(true);
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, imageUrls, trade: trade || null, zipCode: zipCode || null }),
    });
    setSubmitting(false);
    if (res.ok) { onCreated(); onClose(); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">New Post</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Share your work, a project update, or a tip..."
            rows={4}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 resize-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Trade</label>
              <select value={trade} onChange={e => setTrade(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-400">
                <option value="">Select trade</option>
                {TRADES.slice(1).map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Zip Code</label>
              <input value={zipCode} onChange={e => setZipCode(e.target.value)} placeholder="90210" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-400" />
            </div>
          </div>

          {imageUrls.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {imageUrls.map((url, i) => (
                <div key={i} className="relative w-20 h-20">
                  <img src={url} className="w-full h-full object-cover rounded-xl" alt="" />
                  <button type="button" onClick={() => setImageUrls(p => p.filter((_, j) => j !== i))} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">×</button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              {uploading ? "Uploading..." : "Add Photos"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && handleFiles(e.target.files)} />
            <button type="submit" disabled={submitting || (!content.trim() && imageUrls.length === 0)} className="mr-auto px-6 py-2 bg-green-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-green-700">
              {submitting ? "Posting..." : "Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FeedClient({ profile }: { profile: { id: string; name: string; zipCode?: string | null; trade?: string | null; avatarUrl?: string | null } | null }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [scope, setScope] = useState<"local" | "national">("national");
  const [trade, setTrade] = useState("All");

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ scope });
    if (trade !== "All") params.set("trade", trade);
    if (scope === "local" && profile?.zipCode) params.set("zipCode", profile.zipCode);
    const res = await fetch(`/api/posts?${params}`);
    if (res.ok) { const d = await res.json(); setPosts(d.posts); }
    setLoading(false);
  }

  useEffect(() => { load(); }, [scope, trade]);

  async function handleLike(postId: string) {
    const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
    if (res.ok) {
      const { liked } = await res.json();
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, isLiked: liked, likesCount: p.likesCount + (liked ? 1 : -1) } : p));
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Portfolio Feed</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Post
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5 shadow-sm space-y-3">
        <div className="flex gap-2">
          {(["local", "national"] as const).map(s => (
            <button key={s} onClick={() => setScope(s)} className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${scope === s ? "bg-green-600 text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}>
              {s === "local" ? "📍 Local" : "🌎 National"}
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

      {/* Posts */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-64 animate-pulse" />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          </div>
          <p className="text-gray-500 font-medium">No posts yet</p>
          <p className="text-gray-400 text-sm mt-1">Be the first to share your work!</p>
          <button onClick={() => setShowCreate(true)} className="mt-4 px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium">Create Post</button>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(p => <PostCard key={p.id} post={p} currentUserId={profile?.id || ""} onLike={handleLike} />)}
        </div>
      )}

      {showCreate && <CreatePostModal onClose={() => setShowCreate(false)} onCreated={load} profile={profile} />}
    </div>
  );
}
