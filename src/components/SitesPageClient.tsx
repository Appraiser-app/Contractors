"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const SitesMap = dynamic(() => import("./SitesMap"), { ssr: false, loading: () => (
  <div className="rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-center" style={{ height: 520 }}>
    <span className="text-gray-400 text-sm">טוען מפה...</span>
  </div>
) });

type Site = {
  id: string;
  name: string;
  location: string | null;
  status: string;
  clientName: string | null;
  contractValue: number | null;
  lat: number | null;
  lng: number | null;
  transactions?: Array<{ type: string; amount: number }>;
};

const statusLabel: Record<string, string> = { ACTIVE: "פעיל", COMPLETED: "הושלם", ON_HOLD: "מושהה" };
const statusColor: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  COMPLETED: "bg-sky-100 text-sky-700",
  ON_HOLD: "bg-green-100 text-green-700",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(amount);
}

export default function SitesPageClient({ sites }: { sites: Site[] }) {
  const [view, setView] = useState<"list" | "map">("list");
  const activeSites = sites.filter((s) => s.status === "ACTIVE");
  const completedSites = sites.filter((s) => s.status === "COMPLETED");
  const mappableSites = sites.filter((s) => s.lat != null && s.lng != null);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-start justify-between mb-6 sm:mb-8 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">אתרי עבודה</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs bg-emerald-100 text-emerald-700 font-medium px-2.5 py-1 rounded-full">{activeSites.length} פעילים</span>
            <span className="text-xs bg-gray-100 text-gray-500 font-medium px-2.5 py-1 rounded-full">{completedSites.length} הושלמו</span>
            <span className="text-xs text-gray-400">{sites.length} סה"כ</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {sites.length > 0 && (
            <div className="flex bg-gray-100 rounded-xl p-1 text-xs font-semibold">
              <button
                onClick={() => setView("list")}
                className={`px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${view === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                רשימה
              </button>
              <button
                onClick={() => setView("map")}
                className={`px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${view === "map" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                מפה
                {mappableSites.length > 0 && (
                  <span className={`text-[10px] font-bold leading-none px-1.5 py-0.5 rounded-full ${view === "map" ? "bg-gray-100 text-gray-600" : "bg-emerald-100 text-emerald-700"}`}>
                    {mappableSites.length}
                  </span>
                )}
              </button>
            </div>
          )}
          <Link href="/sites/new"
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm shadow-md shadow-green-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            הוספת פרוייקט חדש
          </Link>
        </div>
      </div>

      {sites.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-20 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-gray-600 font-semibold">אין אתרים עדיין</p>
          <p className="text-gray-400 text-sm mt-1 mb-5">הוסף את אתר העבודה הראשון שלך</p>
          <Link href="/sites/new"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            הוסף אתר
          </Link>
        </div>
      ) : view === "map" ? (
        <SitesMap sites={sites.map(s => ({ id: s.id, name: s.name, location: s.location, status: s.status, clientName: s.clientName, lat: s.lat, lng: s.lng }))} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sites.map((site) => {
            const income = ((site.contractValue || 0) + (site.transactions || []).filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0)) * 1.18;
            const expense = (site.transactions || []).filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
            const balance = income - expense;
            const txCount = (site.transactions || []).length;
            return (
              <Link key={site.id} href={`/sites/${site.id}`}
                className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-green-200 hover:shadow-lg hover:shadow-green-50 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0 ml-2">
                    <h3 className="font-bold text-gray-900 text-base group-hover:text-green-700 transition-colors truncate">{site.name}</h3>
                    {site.location && (
                      <p className="text-gray-400 text-xs mt-0.5 flex items-center gap-1">
                        <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {site.location}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${statusColor[site.status]}`}>
                    {statusLabel[site.status]}
                  </span>
                </div>

                {site.clientName && (
                  <p className="text-xs text-gray-500 mb-3 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {site.clientName}
                  </p>
                )}

                <div className={`rounded-xl px-3 py-2.5 mb-3 ${balance >= 0 ? "bg-green-50" : "bg-red-50"}`}>
                  <p className="text-xs text-gray-400 mb-0.5">יתרה</p>
                  <p className={`text-lg font-bold ${balance >= 0 ? "text-green-700" : "text-red-600"}`}>
                    {formatCurrency(balance)}
                  </p>
                </div>

                <div className="flex gap-3 pt-3 border-t border-gray-50 text-xs">
                  <div className="flex-1">
                    <p className="text-gray-400">הכנסות</p>
                    <p className="font-semibold text-green-600 mt-0.5">{formatCurrency(income)}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-400">הוצאות</p>
                    <p className="font-semibold text-red-500 mt-0.5">{formatCurrency(expense)}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-400">תנועות</p>
                    <p className="font-semibold text-gray-600 mt-0.5">{txCount}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
