"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Site = {
  id: string;
  name: string;
  location: string | null;
  description: string | null;
  clientName: string | null;
  clientPhone: string | null;
  contractValue: number | null;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  workOrderUrl?: string | null;
  lat?: number | null;
  lng?: number | null;
};

export default function SiteForm({ site }: { site?: Site }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [workOrderFile, setWorkOrderFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);

  const [vatIncluded, setVatIncluded] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    site?.lat != null && site?.lng != null ? { lat: site.lat, lng: site.lng } : null
  );
  const [form, setForm] = useState({
    name: site?.name || "",
    location: site?.location || "",
    description: site?.description || "",
    clientName: site?.clientName || "",
    clientPhone: site?.clientPhone || "",
    contractValue: site?.contractValue?.toString() || "",
    status: site?.status || "ACTIVE",
    startDate: site?.startDate ? new Date(site.startDate).toISOString().split("T")[0] : "",
    endDate: site?.endDate ? new Date(site.endDate).toISOString().split("T")[0] : "",
  });

  async function geocodeLocation() {
    if (!form.location.trim()) return;
    setGeocoding(true);
    try {
      const query = encodeURIComponent(form.location + ", ישראל");
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=il`,
        { headers: { "Accept-Language": "he" } }
      );
      const data = await res.json();
      if (data.length > 0) {
        setCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
      } else {
        setError("לא נמצא מיקום — נסה כתובת מדויקת יותר");
      }
    } catch {
      setError("שגיאה בחיפוש מיקום");
    } finally {
      setGeocoding(false);
    }
  }

  const VAT = 0.18;
  const enteredValue = parseFloat(form.contractValue) || 0;
  const contractNet = vatIncluded ? enteredValue / (1 + VAT) : enteredValue;
  const contractGross = contractNet * (1 + VAT);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let workOrderUrl: string | null = site?.workOrderUrl ?? null;

      if (workOrderFile) {
        setUploadProgress(true);
        try {
          const fd = new FormData();
          fd.append("file", workOrderFile);
          fd.append("folder", "work-orders");
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 30000);
          const uploadRes = await fetch("/api/upload", { method: "POST", body: fd, signal: controller.signal });
          clearTimeout(timeout);
          if (uploadRes.ok) {
            const { url } = await uploadRes.json();
            workOrderUrl = url;
          } else {
            const errBody = await uploadRes.json().catch(() => ({}));
            console.error("upload error:", uploadRes.status, errBody);
            setError(`שגיאה בהעלאת הקובץ (${uploadRes.status})`);
            return;
          }
        } catch (uploadErr) {
          console.error("upload exception:", uploadErr);
          setError("שגיאה בהעלאת הקובץ — נסה קובץ קטן יותר או המשך ללא קובץ");
          return;
        } finally {
          setUploadProgress(false);
        }
      }

      const body = {
        ...form,
        contractValue: form.contractValue ? contractNet : null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        workOrderUrl,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
      };

      const res = await fetch(site ? `/api/sites/${site.id}` : "/api/sites", {
        method: site ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/sites/${data.id}`);
        router.refresh();
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.error || `שגיאה בשמירה (${res.status})`);
      }
    } catch (err) {
      console.error("submit error:", err);
      setError("שגיאה בלתי צפויה — נסה שוב");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">שם האתר *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent text-sm"
              placeholder="פרויקט כביש 1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">מיקום</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.location}
                onChange={(e) => { update("location", e.target.value); setCoords(null); }}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent text-sm"
                placeholder="תל אביב, רחוב הרצל 1"
              />
              <button
                type="button"
                onClick={geocodeLocation}
                disabled={geocoding || !form.location.trim()}
                className="px-3 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:border-green-400 hover:text-green-600 disabled:opacity-40 transition-colors text-xs flex-shrink-0"
                title="איתור על המפה"
              >
                {geocoding ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
            {coords && (
              <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                מיקום נמצא: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">שם לקוח</label>
            <input
              type="text"
              value={form.clientName}
              onChange={(e) => update("clientName", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent text-sm"
              placeholder="חברת בנייה בע״מ"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">טלפון לקוח (WhatsApp)</label>
            <input
              type="tel"
              value={form.clientPhone}
              onChange={(e) => update("clientPhone", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent text-sm"
              placeholder="0501234567"
              dir="ltr"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">ערך חוזה (₪)</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={form.contractValue}
                onChange={(e) => update("contractValue", e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent text-sm"
                placeholder="500000"
                min="0"
                dir="ltr"
              />
              <div className="flex rounded-xl border border-gray-200 overflow-hidden text-xs font-medium flex-shrink-0">
                <button type="button" onClick={() => setVatIncluded(false)}
                  className={`px-3 py-2 transition-colors ${!vatIncluded ? "bg-green-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
                  ללא מע״מ
                </button>
                <button type="button" onClick={() => setVatIncluded(true)}
                  className={`px-3 py-2 transition-colors border-r border-gray-200 ${vatIncluded ? "bg-green-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
                  כולל מע״מ
                </button>
              </div>
            </div>
            {enteredValue > 0 && (
              <div className="mt-2 flex gap-4 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                <span>נטו: <span className="font-semibold text-gray-700">{new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(contractNet)}</span></span>
                <span>מע״מ 18%: <span className="font-semibold text-green-600">+{new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(contractGross - contractNet)}</span></span>
                <span>ברוטו: <span className="font-semibold text-green-700">{new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(contractGross)}</span></span>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">תאריך התחלה</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => update("startDate", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent text-sm"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">תאריך סיום</label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => update("endDate", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent text-sm"
              dir="ltr"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">סטטוס</label>
          <select
            value={form.status}
            onChange={(e) => update("status", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent text-sm bg-white"
          >
            <option value="ACTIVE">פעיל</option>
            <option value="COMPLETED">הושלם</option>
            <option value="ON_HOLD">מושהה</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">תיאור</label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent text-sm resize-none"
            placeholder="תיאור הפרויקט..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">הזמנת עבודה (קובץ)</label>
          {site?.workOrderUrl && !workOrderFile && (
            <div className="mb-2 flex items-center gap-2 text-sm text-gray-600">
              <span>קובץ קיים:</span>
              <a href={site.workOrderUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate max-w-xs">
                צפייה בהזמנה הנוכחית
              </a>
            </div>
          )}
          <div className="relative">
            <input
              type="file"
              id="workOrderFile"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => setWorkOrderFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <label
              htmlFor="workOrderFile"
              className="flex items-center gap-2 w-full border border-dashed border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-500 hover:border-green-400 hover:text-green-600 cursor-pointer transition-colors"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              {workOrderFile ? workOrderFile.name : "לחץ לבחירת קובץ (PDF, Word, תמונה)"}
            </label>
          </div>
          {workOrderFile && (
            <button
              type="button"
              onClick={() => setWorkOrderFile(null)}
              className="mt-1 text-xs text-gray-400 hover:text-red-500"
            >
              הסר קובץ
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-200 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
          >
            {loading ? (uploadProgress ? "מעלה קובץ..." : "שומר...") : site ? "עדכון אתר" : "הוספת אתר"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-2.5 rounded-xl transition-colors text-sm"
          >
            ביטול
          </button>
        </div>
      </form>
    </div>
  );
}
