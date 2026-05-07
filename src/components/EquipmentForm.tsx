"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { uploadReceipt } from "@/lib/upload";
import type { Equipment } from "@/lib/db";

export default function EquipmentForm({ equipment }: { equipment?: Equipment }) {
  const router = useRouter();
  const licenseFileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [licenseExpiry, setLicenseExpiry] = useState("");
  const [showInsurance, setShowInsurance] = useState(false);
  const [insurance, setInsurance] = useState({
    type: "MANDATORY",
    company: "",
    policyNumber: "",
    startDate: "",
    endDate: "",
    cost: "",
    isPaid: false,
  });

  const [form, setForm] = useState({
    name: equipment?.name || "",
    type: equipment?.type || "TRUCK",
    licensePlate: equipment?.licensePlate || "",
    year: equipment?.year?.toString() || "",
    description: equipment?.description || "",
    status: equipment?.status || "ACTIVE",
    registeredOwner: equipment?.registeredOwner || "",
    registeredAt: equipment?.registeredAt || "",
    currentMileage: equipment?.currentMileage?.toString() || "",
    nextServiceMileage: equipment?.nextServiceMileage?.toString() || "",
  });

  function update(field: string, value: string) {
    setForm(p => ({ ...p, [field]: value }));
  }

  function updateInsurance(field: string, value: string | boolean) {
    setInsurance(p => ({ ...p, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const body = {
      ...form,
      year: form.year ? parseInt(form.year) : null,
      licensePlate: form.licensePlate || null,
      description: form.description || null,
      registeredOwner: form.registeredOwner || null,
      registeredAt: form.registeredAt || null,
      currentMileage: form.currentMileage ? parseInt(form.currentMileage) : null,
      nextServiceMileage: form.nextServiceMileage ? parseInt(form.nextServiceMileage) : null,
    };

    const res = await fetch(equipment ? `/api/equipment/${equipment.id}` : "/api/equipment", {
      method: equipment ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      setError(err.error || "שגיאה בשמירה");
      setLoading(false);
      return;
    }

    const data = await res.json();
    const equipmentId = data.id;

    // Upload license file if provided
    if (licenseFile) {
      try {
        const fileUrl = await uploadReceipt(licenseFile, "equipment-expenses");
        await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            equipmentId,
            title: "רישיון רכב",
            type: "LICENSE",
            expiryDate: licenseExpiry || null,
            notes: null,
            fileUrl,
          }),
        });
      } catch {
        // Non-fatal — equipment was created, document upload failed
        setError("הכלי נשמר אך העלאת קובץ הרישיון נכשלה");
      }
    }

    // Create insurance if provided
    if (showInsurance && insurance.startDate && insurance.endDate) {
      const insRes = await fetch("/api/insurance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipmentId,
          type: insurance.type,
          company: insurance.company || null,
          policyNumber: insurance.policyNumber || null,
          startDate: insurance.startDate,
          endDate: insurance.endDate,
          cost: insurance.cost ? parseFloat(insurance.cost) : null,
          isPaid: insurance.isPaid,
        }),
      });
      if (!insRes.ok) {
        setError("הכלי נשמר אך שמירת הביטוח נכשלה");
        setLoading(false);
        return;
      }
    }

    router.push(`/equipment/${equipmentId}`);
    router.refresh();
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">שם הכלי *</label>
            <input type="text" value={form.name} onChange={e => update("name", e.target.value)} required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              placeholder="משאית מן 18 טון" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">סוג</label>
            <select value={form.type} onChange={e => update("type", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 bg-white">
              <option value="TRUCK">🚛 משאית</option>
              <option value="MINI_EXCAVATOR">🏗️ מיני מחפרון</option>
              <option value="BOBCAT">🟡 בובקט</option>
              <option value="OTHER">⚙️ אחר</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">מספר רישוי</label>
            <input type="text" value={form.licensePlate} onChange={e => update("licensePlate", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              placeholder="12-345-67" dir="ltr" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">שנת ייצור</label>
            <input type="number" value={form.year} onChange={e => update("year", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              placeholder="2018" min="1980" max={new Date().getFullYear()} dir="ltr" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">סטטוס</label>
            <select value={form.status} onChange={e => update("status", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 bg-white">
              <option value="ACTIVE">פעיל</option>
              <option value="IN_REPAIR">בתיקון</option>
              <option value="INACTIVE">לא פעיל</option>
            </select>
          </div>
        </div>

        {/* Registration section */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">רישום בעלות</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">רשום על שם</label>
              <input type="text" value={form.registeredOwner} onChange={e => update("registeredOwner", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                placeholder="שם הבעלים הרשום" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">רשום במשרד</label>
              <select value={form.registeredAt} onChange={e => update("registeredAt", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 bg-white">
                <option value="">לא צוין</option>
                <option value="VEHICLE_LICENSING">משרד הרישוי</option>
                <option value="LABOR_MINISTRY">משרד העבודה</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mileage section */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">קילומטרז׳</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">מד קילומטרים נוכחי</label>
              <div className="relative">
                <input type="number" value={form.currentMileage} onChange={e => update("currentMileage", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 pl-12"
                  placeholder="125000" min="0" dir="ltr" />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">ק״מ</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">טיפול הבא בקילומטר</label>
              <div className="relative">
                <input type="number" value={form.nextServiceMileage} onChange={e => update("nextServiceMileage", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 pl-12"
                  placeholder="130000" min="0" dir="ltr" />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">ק״מ</span>
              </div>
              {form.currentMileage && form.nextServiceMileage && parseInt(form.nextServiceMileage) > parseInt(form.currentMileage) && (
                <p className="text-xs text-gray-400 mt-1">
                  עוד {(parseInt(form.nextServiceMileage) - parseInt(form.currentMileage)).toLocaleString("he-IL")} ק״מ לטיפול
                </p>
              )}
            </div>
          </div>
        </div>

        {/* License file section */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">רישיון</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">קובץ רישיון (אופציונלי)</label>
              <input ref={licenseFileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                onChange={e => setLicenseFile(e.target.files?.[0] || null)} />
              {licenseFile ? (
                <div className="flex items-center gap-2 border border-green-200 bg-green-50 rounded-xl px-3 py-2">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs text-green-700 flex-1 truncate">{licenseFile.name}</span>
                  <button type="button" onClick={() => setLicenseFile(null)} className="text-green-400 hover:text-red-500 text-xs">הסר</button>
                </div>
              ) : (
                <button type="button" onClick={() => licenseFileRef.current?.click()}
                  className="flex items-center gap-2 w-full border border-dashed border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  העלה רישיון (PDF / תמונה)
                </button>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">תאריך תפוגת רישיון</label>
              <input type="date" value={licenseExpiry} onChange={e => setLicenseExpiry(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                dir="ltr" />
            </div>
          </div>
        </div>

        {/* Insurance section */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">ביטוח</p>
            <button type="button" onClick={() => setShowInsurance(v => !v)}
              className={`text-xs font-medium px-3 py-1 rounded-lg transition-colors ${showInsurance ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
              {showInsurance ? "הסתר" : "הוסף ביטוח"}
            </button>
          </div>

          {showInsurance && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">סוג ביטוח</label>
                  <select value={insurance.type} onChange={e => updateInsurance("type", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 bg-white">
                    <option value="MANDATORY">חובה</option>
                    <option value="COMPREHENSIVE">מקיף</option>
                    <option value="THIRD_PARTY">צד שלישי</option>
                    <option value="WORK_ACCIDENT">תאונות עבודה</option>
                    <option value="OTHER">אחר</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">חברת ביטוח</label>
                  <input type="text" value={insurance.company} onChange={e => updateInsurance("company", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                    placeholder="מגדל, הפניקס..." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">מספר פוליסה</label>
                  <input type="text" value={insurance.policyNumber} onChange={e => updateInsurance("policyNumber", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                    dir="ltr" placeholder="123456789" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">עלות (₪)</label>
                  <input type="number" value={insurance.cost} onChange={e => updateInsurance("cost", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                    min="0" dir="ltr" placeholder="2500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">תאריך התחלה *</label>
                  <input type="date" value={insurance.startDate} onChange={e => updateInsurance("startDate", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                    dir="ltr" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">תאריך סיום *</label>
                  <input type="date" value={insurance.endDate} onChange={e => updateInsurance("endDate", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                    dir="ltr" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={insurance.isPaid} onChange={e => updateInsurance("isPaid", e.target.checked)}
                  className="w-4 h-4 rounded accent-green-600" />
                <span className="text-sm text-gray-700">שולם</span>
              </label>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">תיאור</label>
          <textarea value={form.description} onChange={e => update("description", e.target.value)} rows={2}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-600"
            placeholder="פרטים נוספים על הכלי..." />
        </div>

        {error && <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm">{error}</div>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-200 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">
            {loading ? "שומר..." : equipment ? "עדכון כלי" : "הוספת כלי"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-6 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-2.5 rounded-xl transition-colors text-sm">
            ביטול
          </button>
        </div>
      </form>
    </div>
  );
}
