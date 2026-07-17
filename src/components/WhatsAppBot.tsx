"use client";

import { useCallback, useEffect, useState } from "react";

type BotConfig = {
  configured: boolean;
  instanceId?: string;
  apiToken?: string;
  groupId?: string;
  defaultEntity?: string;
  requireKeyword?: boolean;
  keyword?: string;
  enabled?: boolean;
};

type BotLog = {
  id: string;
  sender: string;
  rawText: string;
  amount: number | null;
  description: string | null;
  category: string | null;
  status: "created" | "skipped" | "error";
  expenseId: string | null;
  createdAt: string;
};

const WEBHOOK_URL =
  typeof window !== "undefined"
    ? `${window.location.origin}/api/webhooks/whatsapp-bot`
    : "https://contractors.clickclick.cloud/api/webhooks/whatsapp-bot";

const ENTITIES = ["חברה של דור", "חברה של שגיא", "דור", "שגיא"];

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "עכשיו";
  if (m < 60) return `לפני ${m} דק'`;
  const h = Math.floor(m / 60);
  if (h < 24) return `לפני ${h} שע'`;
  return `לפני ${Math.floor(h / 24)} ימים`;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(n);
}

export default function WhatsAppBot() {
  const [config, setConfig] = useState<BotConfig>({ configured: false });
  const [logs, setLogs] = useState<BotLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [showSetup, setShowSetup] = useState(false);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    instanceId: "",
    apiToken: "",
    groupId: "",
    defaultEntity: "חברה של דור",
    requireKeyword: false,
    keyword: "הוצאה",
    enabled: true,
  });

  const load = useCallback(async () => {
    const [cfgRes, logsRes] = await Promise.all([
      fetch("/api/whatsapp/bot-config"),
      fetch("/api/whatsapp/bot-logs"),
    ]);
    if (cfgRes.ok) {
      const cfg = await cfgRes.json();
      setConfig(cfg);
      if (cfg.configured) {
        setForm({
          instanceId: cfg.instanceId || "",
          apiToken: cfg.apiToken || "",
          groupId: cfg.groupId || "",
          defaultEntity: cfg.defaultEntity || "חברה של דור",
          requireKeyword: cfg.requireKeyword || false,
          keyword: cfg.keyword || "הוצאה",
          enabled: cfg.enabled !== false,
        });
      }
    }
    if (logsRes.ok) setLogs(await logsRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg("");
    const res = await fetch("/api/whatsapp/bot-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setSaveMsg("ההגדרות נשמרו ✓");
      setShowSetup(false);
      load();
    } else {
      const err = await res.json();
      setSaveMsg(err.error || "שגיאה בשמירה");
    }
    setSaving(false);
    setTimeout(() => setSaveMsg(""), 3000);
  }

  async function clearLogs() {
    if (!confirm("למחוק את כל הלוגים?")) return;
    await fetch("/api/whatsapp/bot-logs", { method: "DELETE" });
    setLogs([]);
  }

  async function copyWebhook() {
    await navigator.clipboard.writeText(
      typeof window !== "undefined"
        ? `${window.location.origin}/api/webhooks/whatsapp-bot`
        : "https://contractors.clickclick.cloud/api/webhooks/whatsapp-bot"
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const createdCount = logs.filter(l => l.status === "created").length;
  const totalAmount = logs.filter(l => l.status === "created" && l.amount).reduce((s, l) => s + (l.amount || 0), 0);

  if (loading) return <div className="text-center py-12 text-gray-400">טוען...</div>;

  return (
    <div className="space-y-5" dir="rtl">

      {/* Status + Toggle */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.configured && config.enabled ? "bg-green-100" : "bg-gray-100"}`}>
              <span className="text-xl">🤖</span>
            </div>
            <div>
              <p className="font-bold text-gray-900">בוט הוצאות WhatsApp</p>
              <div className="flex items-center gap-2 mt-0.5">
                <div className={`w-2 h-2 rounded-full ${config.configured && config.enabled ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
                <p className="text-xs text-gray-500">
                  {!config.configured ? "לא מוגדר" : config.enabled ? "פעיל — מקשיב לקבוצה" : "מושבת"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {config.configured && (
              <button
                onClick={async () => {
                  await fetch("/api/whatsapp/bot-config", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...form, enabled: !form.enabled }),
                  });
                  setForm(f => ({ ...f, enabled: !f.enabled }));
                  load();
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${form.enabled ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}
              >
                {form.enabled ? "השבת בוט" : "הפעל בוט"}
              </button>
            )}
            <button
              onClick={() => setShowSetup(v => !v)}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              הגדרות
            </button>
          </div>
        </div>

        {/* Stats */}
        {createdCount > 0 && (
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-50">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{createdCount}</p>
              <p className="text-xs text-gray-400">הוצאות שנוצרו</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
              <p className="text-xs text-gray-400">סה״כ סכום</p>
            </div>
          </div>
        )}
      </div>

      {/* Setup Form */}
      {showSetup && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          {/* How to setup */}
          <div className="mb-5 bg-blue-50 rounded-xl p-4">
            <p className="font-bold text-blue-900 text-sm mb-2">🚀 איך להתחיל — 4 צעדים</p>
            <ol className="space-y-1.5 text-xs text-blue-800 list-decimal list-inside">
              <li>
                <a href="https://green-api.com" target="_blank" rel="noopener noreferrer" className="font-semibold underline hover:text-blue-600">
                  הירשם ב-Green API
                </a>
                {" "}(חינמי — 200 הודעות/חודש)
              </li>
              <li>צור Instance חדש ← סרוק QR עם WhatsApp של הבוט</li>
              <li>הוסף את הבוט לקבוצת ה-WhatsApp</li>
              <li>
                העתק את ה-Webhook URL למטה ← הגדר ב-Green API תחת Notifications → Webhook URL
              </li>
            </ol>
          </div>

          {/* Webhook URL */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 mb-1">Webhook URL (להדביק ב-Green API)</label>
            <div className="flex gap-2">
              <input
                readOnly
                value={typeof window !== "undefined" ? `${window.location.origin}/api/webhooks/whatsapp-bot` : ""}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono text-gray-600 focus:outline-none"
                dir="ltr"
              />
              <button
                type="button"
                onClick={copyWebhook}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${copied ? "bg-green-100 text-green-700" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
              >
                {copied ? "✓ הועתק" : "העתק"}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              ב-Green API: Settings → Notifications → Webhook URL → הדבק את הכתובת
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Instance ID *</label>
                <input
                  type="text"
                  placeholder="1234567890"
                  value={form.instanceId}
                  onChange={e => setForm(f => ({ ...f, instanceId: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  dir="ltr"
                  required
                />
                <p className="text-[10px] text-gray-400 mt-0.5">נמצא ב-Green API → My Instances</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">API Token *</label>
                <input
                  type="password"
                  placeholder="••••••••••••••"
                  value={form.apiToken}
                  onChange={e => setForm(f => ({ ...f, apiToken: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  dir="ltr"
                  required
                />
                <p className="text-[10px] text-gray-400 mt-0.5">API Token מה-Instance</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">מזהה הקבוצה (Chat ID)</label>
              <input
                type="text"
                placeholder="972501234567-1234567890@g.us"
                value={form.groupId}
                onChange={e => setForm(f => ({ ...f, groupId: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                dir="ltr"
              />
              <p className="text-[10px] text-gray-400 mt-0.5">
                Green API → My Instances → Instance → Chats — מזהה הקבוצה מסתיים ב-@g.us
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">ישות ברירת מחדל</label>
                <select
                  value={form.defaultEntity}
                  onChange={e => setForm(f => ({ ...f, defaultEntity: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                >
                  {ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div className="flex flex-col justify-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.requireKeyword}
                    onChange={e => setForm(f => ({ ...f, requireKeyword: e.target.checked }))}
                    className="w-4 h-4 rounded text-green-600"
                  />
                  <span className="text-sm text-gray-700">דרוש מילת מפתח</span>
                </label>
                {form.requireKeyword && (
                  <input
                    type="text"
                    placeholder="הוצאה"
                    value={form.keyword}
                    onChange={e => setForm(f => ({ ...f, keyword: e.target.value }))}
                    className="mt-2 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                )}
              </div>
            </div>

            {saveMsg && (
              <div className={`text-sm text-center font-medium py-2 rounded-xl ${saveMsg.includes("✓") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                {saveMsg}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {saving ? "שומר..." : "שמור הגדרות"}
              </button>
              <button
                type="button"
                onClick={() => setShowSetup(false)}
                className="px-5 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                ביטול
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Message format guide */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="font-bold text-gray-900 text-sm mb-3">📱 פורמטים שהבוט מבין</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { msg: "500 דלק", result: "500 ₪ — קטגוריה: דלק" },
            { msg: "דלק 500", result: "500 ₪ — קטגוריה: דלק" },
            { msg: "שילמתי 300 על אוכל", result: "300 ₪ — קטגוריה: אוכל" },
            { msg: "1500 חלפים לג׳יפ", result: "1,500 ₪ — קטגוריה: תיקון" },
            { msg: "הוצאה: 800 - ציוד", result: "800 ₪ — קטגוריה: ציוד וחומרים" },
            { msg: "250 קפה ואוכל עובדים", result: "250 ₪ — קטגוריה: אוכל" },
          ].map(ex => (
            <div key={ex.msg} className="flex items-start gap-2.5 bg-gray-50 rounded-xl p-2.5">
              <div className="bg-green-100 text-green-800 text-xs font-mono px-2 py-1 rounded-lg flex-shrink-0">{ex.msg}</div>
              <div className="text-xs text-gray-500 mt-0.5">→ {ex.result}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <h3 className="font-bold text-gray-900">לוג פעילות</h3>
          <div className="flex items-center gap-2">
            <button onClick={load} className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors">
              רענן
            </button>
            {logs.length > 0 && (
              <button onClick={clearLogs} className="text-xs text-red-400 hover:text-red-600 px-3 py-1 rounded-lg hover:bg-red-50 transition-colors">
                נקה לוג
              </button>
            )}
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-400 text-sm">אין פעילות עדיין</p>
            <p className="text-gray-300 text-xs mt-1">שלחו הודעת הוצאה בקבוצה ותראו אותה כאן</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-3 px-5 py-3.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-sm ${log.status === "created" ? "bg-green-100" : log.status === "error" ? "bg-red-100" : "bg-gray-100"}`}>
                  {log.status === "created" ? "✓" : log.status === "error" ? "✗" : "−"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-900">
                      {log.amount ? formatCurrency(log.amount) : "לא פורסר"}
                    </p>
                    {log.description && (
                      <span className="text-xs text-gray-500">— {log.description}</span>
                    )}
                    {log.category && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md">{log.category}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    <span className="font-medium text-gray-600">{log.sender}</span>
                    {" · "}
                    <span className="font-mono">&ldquo;{log.rawText.slice(0, 50)}{log.rawText.length > 50 ? "…" : ""}&rdquo;</span>
                  </p>
                  {log.status === "skipped" && (
                    <p className="text-[10px] text-gray-300 mt-0.5">לא זוהה כהוצאה</p>
                  )}
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-[10px] text-gray-400">{timeAgo(log.createdAt)}</p>
                  {log.status === "created" && (
                    <span className="inline-block mt-0.5 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">נוצרה הוצאה</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
