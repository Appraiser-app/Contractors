"use client";

import { useEffect, useState } from "react";
import type { WhatsAppMessage, WorkSite } from "@/lib/db";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "עכשיו";
  if (minutes < 60) return `לפני ${minutes} דק'`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `לפני ${hours} שע'`;
  const days = Math.floor(hours / 24);
  return `לפני ${days} ימים`;
}

function formatPhone(to: string) {
  return to.replace("whatsapp:", "");
}

export default function WhatsAppPage() {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [sites, setSites] = useState<WorkSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Compose form
  const [to, setTo] = useState("");
  const [toName, setToName] = useState("");
  const [body, setBody] = useState("");
  const [siteId, setSiteId] = useState("");

  // Template picker
  const [showTemplates, setShowTemplates] = useState(false);

  const TEMPLATES = [
    { label: "בקשת תשלום", text: "שלום {שם}, תשלום עבור פרויקט {אתר} בסך ₪{סכום} מחכה לאישורך. אנא צור קשר בהקדם. תודה!" },
    { label: "עדכון התקדמות", text: "שלום {שם}, רצינו לעדכן שעבודות הפרויקט {אתר} מתקדמות כמתוכנן. נהיה בקשר בכל שאלה." },
    { label: "תזכורת פגישה", text: "שלום {שם}, תזכורת לפגישה שלנו מחר בנוגע לפרויקט {אתר}. נשמח לראותך." },
    { label: "סיום עבודה", text: "שלום {שם}, העבודות בפרויקט {אתר} הסתיימו בהצלחה. תודה על שיתוף הפעולה!" },
  ];

  async function load() {
    const [msgsRes, sitesRes] = await Promise.all([
      fetch("/api/whatsapp/messages"),
      fetch("/api/sites"),
    ]);
    if (msgsRes.ok) setMessages(await msgsRes.json());
    if (sitesRes.ok) setSites(await sitesRes.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  // Auto-fill contact from site selection
  function handleSiteSelect(id: string) {
    setSiteId(id);
    const site = sites.find(s => s.id === id);
    if (site) {
      if (site.clientPhone) setTo(site.clientPhone);
      if (site.clientName) setToName(site.clientName);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!to.trim() || !body.trim()) return;
    setSending(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/whatsapp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: to.trim(), toName: toName.trim() || null, body, siteId: siteId || null }),
    });

    if (res.ok) {
      setSuccess("ההודעה נשלחה בהצלחה!");
      setBody("");
      setTo("");
      setToName("");
      setSiteId("");
      load();
    } else {
      const data = await res.json();
      setError(data.error || "שגיאה בשליחה");
    }
    setSending(false);
  }

  // Group messages by contact number
  const grouped: Record<string, WhatsAppMessage[]> = {};
  for (const m of messages) {
    const key = m.to;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(m);
  }
  const contacts = Object.entries(grouped).map(([num, msgs]) => ({
    num,
    name: msgs[0].toName || formatPhone(num),
    lastMsg: msgs[0],
    count: msgs.length,
  }));

  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const contactMessages = selectedContact ? (grouped[selectedContact] || []) : [];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">הודעות WhatsApp</h1>
          <p className="text-gray-400 text-sm mt-1">{messages.length} הודעות נשלחו</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        {/* Compose + History panel */}
        <div className="lg:col-span-2 space-y-5">
          {/* Compose */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <h2 className="font-bold text-gray-900">שלח הודעה</h2>
            </div>

            <form onSubmit={handleSend} className="space-y-3">
              {/* Site selector */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">אתר (אופציונלי)</label>
                <select
                  value={siteId}
                  onChange={e => handleSiteSelect(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                >
                  <option value="">בחר אתר...</option>
                  {sites.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}{s.clientName ? ` — ${s.clientName}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">שם (אופציונלי)</label>
                  <input
                    type="text"
                    value={toName}
                    onChange={e => setToName(e.target.value)}
                    placeholder="שם הנמען"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">מספר טלפון *</label>
                  <input
                    type="tel"
                    value={to}
                    onChange={e => setTo(e.target.value)}
                    placeholder="0501234567"
                    required
                    dir="ltr"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
              </div>

              {/* Templates */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowTemplates(v => !v)}
                  className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  תבניות מוכנות
                </button>
                {showTemplates && (
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    {TEMPLATES.map(t => (
                      <button
                        key={t.label}
                        type="button"
                        onClick={() => { setBody(t.text); setShowTemplates(false); }}
                        className="text-[11px] text-right bg-gray-50 hover:bg-green-50 border border-gray-200 hover:border-green-300 px-2.5 py-1.5 rounded-lg text-gray-600 transition-colors"
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">הודעה *</label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="כתוב את ההודעה כאן..."
                  rows={4}
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                />
                <p className="text-right text-xs text-gray-300 mt-1">{body.length} תווים</p>
              </div>

              {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              {success && <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">{success}</p>}

              <button
                type="submit"
                disabled={sending}
                className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                {sending ? (
                  "שולח..."
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    שלח ב-WhatsApp
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right side: contact list + conversation */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-300">טוען...</div>
          ) : contacts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
              <p className="text-4xl mb-3">💬</p>
              <p className="text-gray-500 font-medium">אין הודעות שנשלחו עדיין</p>
              <p className="text-gray-400 text-sm mt-1">שלח את ההודעה הראשונה בטופס משמאל</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Contact list */}
              <div className="border-b border-gray-100 max-h-64 overflow-y-auto">
                {contacts.map(c => (
                  <button
                    key={c.num}
                    onClick={() => setSelectedContact(selectedContact === c.num ? null : c.num)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-right border-b border-gray-50 last:border-0 ${selectedContact === c.num ? "bg-green-50" : ""}`}
                  >
                    <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-green-700 font-bold text-sm">{c.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                      <p className="text-sm font-semibold text-gray-800 truncate">{c.name}</p>
                      <p className="text-xs text-gray-400 truncate">{c.lastMsg.body}</p>
                    </div>
                    <div className="flex-shrink-0 text-left">
                      <p className="text-[10px] text-gray-400">{timeAgo(c.lastMsg.createdAt)}</p>
                      <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full">{c.count}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Conversation view */}
              {selectedContact && (
                <div className="p-4">
                  <p className="text-xs text-gray-400 mb-3 font-medium">
                    שיחה עם {contacts.find(c => c.num === selectedContact)?.name} — {formatPhone(selectedContact)}
                  </p>
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {contactMessages.map(m => (
                      <div key={m.id} className="flex justify-end">
                        <div className="bg-green-500 text-white rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-xs shadow-sm">
                          <p className="text-sm leading-relaxed">{m.body}</p>
                          <p className="text-[10px] text-green-200 mt-1 text-left">{timeAgo(m.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Quick reply */}
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      placeholder="הודעה מהירה..."
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                      onKeyDown={async e => {
                        if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
                          const val = (e.target as HTMLInputElement).value.trim();
                          (e.target as HTMLInputElement).value = "";
                          const contact = contacts.find(c => c.num === selectedContact);
                          await fetch("/api/whatsapp/send", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ to: formatPhone(selectedContact!), toName: contact?.name || null, body: val }),
                          });
                          load();
                        }
                      }}
                    />
                    <button className="bg-green-500 hover:bg-green-400 text-white px-3 py-2 rounded-xl transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
