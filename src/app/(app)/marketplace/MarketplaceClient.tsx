"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const TRADES = ["All", "Electrical", "Plumbing", "HVAC", "Roofing", "Framing", "Concrete", "Excavation", "Painting", "Drywall", "Flooring", "Landscaping"];

type Profile = { id: string; name: string; avatarUrl?: string | null; businessName?: string | null; rating: number; isVerified: boolean; zipCode?: string | null } | null;
type Project = {
  id: string; authorId: string; title: string; description?: string | null; trade: string; zipCode: string;
  budget?: number | null; timeline?: string | null; status: string; createdAt: string; author: Profile; bidCount: number;
};

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className={`w-3 h-3 ${i <= rating ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  );
}

function ProjectCard({ project, isOwner, onBid }: { project: Project; isOwner: boolean; onBid: (id: string) => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full border border-orange-100">{project.trade}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${project.status === "OPEN" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>{project.status}</span>
          </div>
          <h3 className="font-bold text-gray-900 text-sm leading-tight">{project.title}</h3>
        </div>
        {project.budget && (
          <div className="text-right flex-shrink-0">
            <p className="text-lg font-bold text-green-600">${project.budget.toLocaleString()}</p>
            <p className="text-[10px] text-gray-400">budget</p>
          </div>
        )}
      </div>

      {project.description && <p className="text-sm text-gray-600 leading-relaxed mb-3 line-clamp-2">{project.description}</p>}

      <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          {project.zipCode}
        </span>
        {project.timeline && <span>📅 {project.timeline}</span>}
        <span>{project.bidCount} bid{project.bidCount !== 1 ? "s" : ""}</span>
        <span>{timeAgo(project.createdAt)}</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
            <span className="text-white text-xs font-bold">{project.author?.name?.charAt(0) || "?"}</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700">{project.author?.businessName || project.author?.name}</p>
            {(project.author?.rating || 0) > 0 && <Stars rating={Math.round(project.author?.rating || 0)} />}
          </div>
          {project.author?.isVerified && <span className="text-blue-500 text-xs">✓</span>}
        </div>

        {isOwner ? (
          <Link href={`/marketplace/${project.id}`} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-50">
            View Bids ({project.bidCount})
          </Link>
        ) : (
          <button
            onClick={() => onBid(project.id)}
            className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-medium hover:bg-green-700 disabled:opacity-50"
            disabled={project.status !== "OPEN"}
          >
            Submit Bid
          </button>
        )}
      </div>
    </div>
  );
}

function PostProjectModal({ onClose, onCreated, profile }: {
  onClose: () => void; onCreated: () => void;
  profile: { zipCode?: string | null } | null;
}) {
  const [form, setForm] = useState({ title: "", description: "", trade: "", zipCode: profile?.zipCode || "", budget: "", timeline: "" });
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.trade || !form.zipCode) return;
    setSubmitting(true);
    const res = await fetch("/api/public-projects", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, budget: form.budget ? Number.parseFloat(form.budget) : null }),
    });
    setSubmitting(false);
    if (res.ok) { onCreated(); onClose(); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="font-bold text-gray-900">Post a Project</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Project Title *</label>
            <input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} placeholder="e.g. Commercial electrical rough-in" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400" required />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} rows={3} placeholder="Describe the scope of work..." className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Trade *</label>
              <select value={form.trade} onChange={e => setForm(p => ({...p, trade: e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400" required>
                <option value="">Select trade</option>
                {TRADES.slice(1).map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Zip Code *</label>
              <input value={form.zipCode} onChange={e => setForm(p => ({...p, zipCode: e.target.value}))} placeholder="90210" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Budget ($)</label>
              <input type="number" value={form.budget} onChange={e => setForm(p => ({...p, budget: e.target.value}))} placeholder="15000" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Timeline</label>
              <input value={form.timeline} onChange={e => setForm(p => ({...p, timeline: e.target.value}))} placeholder="e.g. 2 weeks" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400" />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50">
            {submitting ? "Posting..." : "Post Project"}
          </button>
        </form>
      </div>
    </div>
  );
}

function BidModal({ projectId, onClose, onDone }: { projectId: string; onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({ price: "", availability: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.price) return;
    setSubmitting(true);
    const res = await fetch(`/api/public-projects/${projectId}/bids`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price: Number.parseFloat(form.price), availability: form.availability || null, notes: form.notes || null }),
    });
    setSubmitting(false);
    if (res.ok) { onDone(); onClose(); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Submit a Bid</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Your Price ($) *</label>
            <input type="number" value={form.price} onChange={e => setForm(p => ({...p, price: e.target.value}))} placeholder="12500" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400" required />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Availability</label>
            <input value={form.availability} onChange={e => setForm(p => ({...p, availability: e.target.value}))} placeholder="e.g. Available next week" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} rows={3} placeholder="Describe your approach, experience, etc." className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400 resize-none" />
          </div>
          <button type="submit" disabled={submitting} className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50">
            {submitting ? "Submitting..." : "Submit Bid"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function MarketplaceClient({ profile }: { profile: { id: string; userRole: string; zipCode?: string | null } | null }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [trade, setTrade] = useState("All");
  const [showPost, setShowPost] = useState(false);
  const [bidProjectId, setBidProjectId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ status: "OPEN" });
    if (trade !== "All") params.set("trade", trade);
    const res = await fetch(`/api/public-projects?${params}`);
    if (res.ok) { const d = await res.json(); setProjects(d.projects); }
    setLoading(false);
  }

  useEffect(() => { load(); }, [trade]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Marketplace</h1>
          <p className="text-sm text-gray-500">Open projects looking for bids</p>
        </div>
        <button onClick={() => setShowPost(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Post Project
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 mb-5 no-scrollbar">
        {TRADES.map(t => (
          <button key={t} onClick={() => setTrade(t)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${trade === t ? "bg-green-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-48 animate-pulse" />)}</div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <p className="text-gray-500 font-medium">No open projects</p>
          <p className="text-gray-400 text-sm mt-1">Be the first to post a project!</p>
          <button onClick={() => setShowPost(true)} className="mt-4 px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium">Post Project</button>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map(p => (
            <ProjectCard key={p.id} project={p} isOwner={p.authorId === profile?.id} onBid={setBidProjectId} />
          ))}
        </div>
      )}

      {showPost && <PostProjectModal onClose={() => setShowPost(false)} onCreated={load} profile={profile} />}
      {bidProjectId && <BidModal projectId={bidProjectId} onClose={() => setBidProjectId(null)} onDone={load} />}
    </div>
  );
}
