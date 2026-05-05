"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

type Extracted = {
  orderNumber?: string;
  clientName?: string;
  projectName?: string;
  location?: string;
  description?: string;
  contractValueBeforeVat?: number;
  contractValueWithVat?: number;
  date?: string;
  clientPhone?: string;
};

export default function UploadWorkOrderPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"upload" | "review" | "saving">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");

  const [form, setForm] = useState({
    name: "",
    location: "",
    description: "",
    clientName: "",
    clientPhone: "",
    contractValue: "",
    startDate: "",
    endDate: "",
    status: "ACTIVE",
    orderNumber: "",
  });

  const [saveError, setSaveError] = useState("");

  function update(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleFileSelect(f: File) {
    setFile(f);
    setExtractError("");
    setExtracting(true);

    const fd = new FormData();
    fd.append("file", f);

    const res = await fetch("/api/work-orders/extract", { method: "POST", body: fd });
    setExtracting(false);

    if (!res.ok) {
      let errMsg = "לא הצלחנו לקרוא את הקובץ.";
      try {
        const errData = await res.json();
        if (errData.detail) errMsg += ` (${errData.detail})`;
        else if (errData.error) errMsg += ` ${errData.error}`;
      } catch { /* ignore */ }
      setExtractError(errMsg);
      return;
    }

    const data: Extracted = await res.json();

    setForm({
      name: data.projectName || "",
      location: data.location || "",
      description: data.description || "",
      clientName: data.clientName || "",
      clientPhone: data.clientPhone || "",
      contractValue: data.contractValueBeforeVat?.toString() || data.contractValueWithVat?.toString() || "",
      startDate: data.date || "",
      endDate: "",
      status: "ACTIVE",
      orderNumber: data.orderNumber || "",
    });

    setStep("review");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStep("saving");
    setSaveError("");

    let workOrderUrl: string | null = null;
    if (file) {
      const fileRef = ref(storage, `work-orders/${crypto.randomUUID()}-${file.name}`);
      await uploadBytes(fileRef, file);
      workOrderUrl = await getDownloadURL(fileRef);
    }

    const body = {
      name: form.name,
      location: form.location || null,
      description: form.description || null,
      clientName: form.clientName || null,
      clientPhone: form.clientPhone || null,
      contractValue: form.contractValue ? parseFloat(form.contractValue) : null,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      status: "ACTIVE",
      workOrderUrl,
      orderNumber: form.orderNumber || null,
    };

    const res = await fetch("/api/sites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      router.push(`/sites/${data.id}`);
    } else {
      const err = await res.json();
      setSaveError(err.error || "שגיאה בשמירה");
      setStep("review");
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">העלאת הזמנת עבודה</h1>
        <p className="text-gray-500 text-sm mt-1">העלה PDF — המערכת תמלא את הפרטים אוטומטית</p>
      </div>

      {step === "upload" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
          />

          {!extracting ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-12 flex flex-col items-center gap-4 hover:border-green-400 hover:bg-green-50/30 transition-all group"
            >
              <div className="w-16 h-16 bg-gray-100 group-hover:bg-green-100 rounded-2xl flex items-center justify-center transition-colors">
                <svg className="w-8 h-8 text-gray-400 group-hover:text-green-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-gray-700 font-semibold">לחץ לבחירת קובץ PDF</p>
                <p className="text-gray-400 text-sm mt-1">הזמנת רכש, הזמנת עבודה</p>
              </div>
            </button>
          ) : (
            <div className="flex flex-col items-center gap-4 py-12">
              <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center">
                <svg className="w-7 h-7 text-green-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900">מנתח את הקובץ...</p>
                <p className="text-gray-500 text-sm mt-1">חולץ פרטים מההזמנה</p>
              </div>
            </div>
          )}

          {extractError && (
            <div className="mt-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm text-center">
              {extractError}
              <button onClick={() => { setExtractError(""); setFile(null); }} className="block mx-auto mt-2 text-red-400 hover:text-red-600 underline text-xs">נסה שוב</button>
            </div>
          )}
        </div>
      )}

      {(step === "review" || step === "saving") && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-50">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">הפרטים חולצו בהצלחה</p>
              <p className="text-xs text-gray-400">בדוק ותקן אם צריך לפני האישור</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">שם הפרויקט / האתר *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">שם לקוח</label>
                <input
                  type="text"
                  value={form.clientName}
                  onChange={(e) => update("clientName", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">טלפון לקוח</label>
                <input
                  type="tel"
                  value={form.clientPhone}
                  onChange={(e) => update("clientPhone", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent text-sm"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">מיקום</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => update("location", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ערך חוזה (₪ לפני מע"מ)</label>
                <input
                  type="number"
                  value={form.contractValue}
                  onChange={(e) => update("contractValue", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent text-sm"
                  dir="ltr"
                  min="0"
                />
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">מספר הזמנה</label>
                <input
                  type="text"
                  value={form.orderNumber}
                  onChange={(e) => update("orderNumber", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent text-sm"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">תיאור העבודה</label>
              <textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent text-sm resize-none"
              />
            </div>

            {saveError && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm">{saveError}</div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={step === "saving"}
                className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-200 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
              >
                {step === "saving" ? "שומר..." : "אישור — הוסף לאתרי עבודה"}
              </button>
              <button
                type="button"
                onClick={() => { setStep("upload"); setFile(null); }}
                disabled={step === "saving"}
                className="px-5 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-2.5 rounded-xl transition-colors text-sm"
              >
                העלה שוב
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
