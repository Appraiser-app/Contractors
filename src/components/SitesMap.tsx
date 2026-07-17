"use client";

import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icons broken by webpack
(L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl = undefined;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#16a34a",
  COMPLETED: "#6b7280",
  ON_HOLD: "#d97706",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "פעיל",
  COMPLETED: "הושלם",
  ON_HOLD: "מושהה",
};

function makeIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width: 28px; height: 28px; border-radius: 50% 50% 50% 0;
      background: ${color}; border: 3px solid white;
      transform: rotate(-45deg);
      box-shadow: 2px 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  });
}

function FitBounds({ sites }: { sites: SitePin[] }) {
  const map = useMap();
  useEffect(() => {
    const withCoords = sites.filter((s) => s.lat != null && s.lng != null);
    if (withCoords.length === 0) return;
    if (withCoords.length === 1) {
      map.setView([withCoords[0].lat!, withCoords[0].lng!], 13);
      return;
    }
    const bounds = L.latLngBounds(withCoords.map((s) => [s.lat!, s.lng!]));
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [map, sites]);
  return null;
}

type SitePin = {
  id: string;
  name: string;
  location: string | null;
  status: string;
  clientName: string | null;
  lat: number | null;
  lng: number | null;
};

export default function SitesMap({ sites }: { sites: SitePin[] }) {
  const mappable = sites.filter((s) => s.lat != null && s.lng != null);
  const unmapped = sites.filter((s) => s.lat == null || s.lng == null);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm" style={{ height: 520 }}>
        <MapContainer
          center={[31.5, 34.85]}
          zoom={8}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds sites={mappable} />
          {mappable.map((site) => (
            <Marker
              key={site.id}
              position={[site.lat!, site.lng!]}
              icon={makeIcon(STATUS_COLORS[site.status] || "#6b7280")}
            >
              <Popup>
                <div className="text-right" dir="rtl" style={{ minWidth: 160 }}>
                  <div className="font-semibold text-gray-900 mb-1">{site.name}</div>
                  {site.location && (
                    <div className="text-xs text-gray-500 mb-1">{site.location}</div>
                  )}
                  {site.clientName && (
                    <div className="text-xs text-gray-600 mb-1">👤 {site.clientName}</div>
                  )}
                  <div
                    className="text-xs font-medium inline-block px-2 py-0.5 rounded-full mb-2"
                    style={{
                      background: `${STATUS_COLORS[site.status]}22`,
                      color: STATUS_COLORS[site.status],
                    }}
                  >
                    {STATUS_LABELS[site.status] || site.status}
                  </div>
                  <div>
                    <a
                      href={`/sites/${site.id}`}
                      className="text-xs text-green-600 hover:underline"
                    >
                      פתח אתר ←
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {unmapped.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-700">
          <span className="font-medium">{unmapped.length} אתרים ללא מיקום על המפה:</span>{" "}
          {unmapped.map((s) => s.name).join(", ")} — ערוך כל אתר והוסף כתובת כדי שיופיע על המפה.
        </div>
      )}

      <div className="flex items-center gap-4 text-xs text-gray-500 px-1">
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <span key={key} className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ background: STATUS_COLORS[key] }}
            />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
