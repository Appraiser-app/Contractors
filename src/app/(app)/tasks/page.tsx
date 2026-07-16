"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import type { Task } from "@/lib/db";

const PRIORITY_LABEL: Record<string, string> = { LOW: "נמוכה", MEDIUM: "בינונית", HIGH: "גבוהה", URGENT: "דחוף" };
const PRIORITY_COLOR: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-500",
  MEDIUM: "bg-blue-100 text-blue-600",
  HIGH: "bg-green-100 text-green-600",
  URGENT: "bg-red-100 text-red-600",
};

const COLUMNS: { key: Task["status"]; label: string; color: string; dot: string }[] = [
  { key: "TODO", label: "לביצוע", color: "bg-gray-50 border-gray-200", dot: "bg-gray-400" },
  { key: "IN_PROGRESS", label: "בביצוע", color: "bg-blue-50 border-blue-200", dot: "bg-blue-500" },
  { key: "DONE", label: "הושלם", color: "bg-green-50 border-green-200", dot: "bg-green-500" },
];

function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("he-IL", { day: "numeric", month: "short" });
}

function isOverdue(d: string | null) {
  if (!d) return false;
  return new Date(d) < new Date();
}

// Google Calendar icon
function CalIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M3 9h18" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M7 13h2v2H7zM11 13h2v2h-2zM15 13h2v2h-2z" fill="currentColor"/>
    </svg>
  );
}

export default function TasksPage() {
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priority: "MEDIUM", dueDate: "" });
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  function showToastMsg(message: string, type: "error" | "success" = "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }
  const [calendarConnected, setCalendarConnected] = useState<boolean | null>(null);
  const [calendarMsg, setCalendarMsg] = useState("");
  const [addingToCalendar, setAddingToCalendar] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/tasks");
    if (res.ok) setTasks(await res.json());
    setLoading(false);
  }, []);

  // Check calendar status + URL params
  useEffect(() => {
    load();
    checkCalendarStatus();
    const cal = searchParams.get("calendar");
    if (cal === "connected") setCalendarMsg("✅ יומן Google חובר בהצלחה!");
    if (cal === "error") setCalendarMsg("שגיאה בחיבור יומן Google");
  }, [load, searchParams]);

  async function checkCalendarStatus() {
    const res = await fetch("/api/google/calendar/status");
    if (res.ok) {
      const data = await res.json();
      setCalendarConnected(data.connected);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);

    // Optimistic add — task appears immediately
    const tempId = `temp-${Date.now()}`;
    const optimisticTask: Task = {
      id: tempId,
      title: form.title.trim(),
      description: form.description.trim() || null,
      priority: form.priority as Task["priority"],
      status: "TODO" as Task["status"],
      dueDate: form.dueDate || null,
      assignedTo: null,
      siteId: null,
      createdBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTasks(prev => [...prev, optimisticTask]);
    setForm({ title: "", description: "", priority: "MEDIUM", dueDate: "" });
    setShowForm(false);
    setSubmitting(false);

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: optimisticTask.title, description: optimisticTask.description, priority: optimisticTask.priority, dueDate: optimisticTask.dueDate }),
    });

    if (res.ok) {
      const newTask = await res.json();
      setTasks(prev => prev.map(t => t.id === tempId ? newTask : t));
    } else {
      setTasks(prev => prev.filter(t => t.id !== tempId));
      showToastMsg("שגיאה בהוספת המשימה — נסה שוב");
    }
  }

  async function moveTask(id: string, status: Task["status"]) {
    const prev = tasks;
    setTasks(p => p.map(t => t.id === id ? { ...t, status } : t));
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      setTasks(prev);
      showToastMsg("שגיאה בהעברת המשימה — נסה שוב");
    }
  }

  async function deleteTask(id: string) {
    const prev = tasks;
    setTasks(p => p.filter(t => t.id !== id));
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setTasks(prev);
      showToastMsg("שגיאה במחיקת המשימה — נסה שוב");
    }
  }

  async function addToCalendar(task: Task) {
    setAddingToCalendar(task.id);
    const res = await fetch("/api/google/calendar/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: task.title, description: task.description, dueDate: task.dueDate }),
    });
    const data = await res.json();
    if (res.ok && data.htmlLink) {
      window.open(data.htmlLink, "_blank");
      setCalendarMsg("✅ המשימה נוספה ליומן!");
      setTimeout(() => setCalendarMsg(""), 3000);
    } else {
      setCalendarMsg(data.error || "שגיאה בהוספה ליומן");
      setTimeout(() => setCalendarMsg(""), 4000);
    }
    setAddingToCalendar(null);
  }

  async function disconnectCalendar() {
    await fetch("/api/google/disconnect", { method: "POST" });
    setCalendarConnected(false);
    setCalendarMsg("");
  }

  const total = tasks.length;
  const done = tasks.filter(t => t.status === "DONE").length;
  const urgent = tasks.filter(t => t.priority === "URGENT" && t.status !== "DONE").length;
  const overdueTasks = tasks.filter(t => t.status !== "DONE" && t.dueDate && isOverdue(t.dueDate));

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === "error" ? "bg-red-600 text-white" : "bg-green-600 text-white"}`}>
          <span>{toast.type === "error" ? "⚠" : "✓"}</span>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="opacity-70 hover:opacity-100 mr-1">✕</button>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">משימות</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-xs bg-blue-100 text-blue-700 font-medium px-2.5 py-1 rounded-full">{total - done} פתוחות</span>
            <span className="text-xs bg-green-100 text-green-700 font-medium px-2.5 py-1 rounded-full">{done} הושלמו</span>
            {urgent > 0 && (
              <span className="text-xs bg-red-100 text-red-600 font-medium px-2.5 py-1 rounded-full">{urgent} דחופות</span>
            )}
            {overdueTasks.length > 0 && (
              <span className="text-xs bg-red-500 text-white font-bold px-2.5 py-1 rounded-full animate-pulse">
                ⚠ {overdueTasks.length} באיחור
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Google Calendar connect/disconnect */}
          {calendarConnected === false && (
            <a
              href="/api/google/auth"
              className="flex items-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium px-3 py-2 rounded-xl transition-colors text-xs sm:text-sm shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="#4285F4" strokeWidth="1.5"/>
                <path d="M3 9h18" stroke="#4285F4" strokeWidth="1.5"/>
                <path d="M8 2v4M16 2v4" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M7 13h2v2H7zM11 13h2v2h-2zM15 13h2v2h-2z" fill="#4285F4"/>
              </svg>
              <span className="hidden sm:inline">חבר Google Calendar</span>
              <span className="sm:hidden">Google Calendar</span>
            </a>
          )}
          {calendarConnected === true && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-2 rounded-xl text-sm">
              <span className="text-blue-600 font-medium text-xs">יומן ✓</span>
              <button onClick={disconnectCalendar} className="text-blue-400 hover:text-red-400 text-xs transition-colors">ניתוק</button>
            </div>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-3 sm:px-4 py-2.5 rounded-xl transition-colors text-sm shadow-md shadow-green-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">משימה חדשה</span>
            <span className="sm:hidden">חדשה</span>
          </button>
        </div>
      </div>

      {/* Overdue banner */}
      {overdueTasks.length > 0 && (
        <div className="mb-5 bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-red-700 text-sm mb-2">
                {overdueTasks.length === 1 ? "משימה אחת באיחור" : `${overdueTasks.length} משימות באיחור`}
              </p>
              <div className="space-y-1.5">
                {overdueTasks.slice(0, 4).map(t => (
                  <div key={t.id} className="flex items-center gap-2 text-xs text-red-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                    <span className="font-medium truncate">{t.title}</span>
                    {t.dueDate && (
                      <span className="text-red-400 flex-shrink-0">
                        — היה צריך להיות עד {formatDate(t.dueDate)}
                      </span>
                    )}
                  </div>
                ))}
                {overdueTasks.length > 4 && (
                  <p className="text-xs text-red-400 pr-3">ועוד {overdueTasks.length - 4} נוספות...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calendar status message */}
      {calendarMsg && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${calendarMsg.startsWith("✅") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
          {calendarMsg}
        </div>
      )}

      {/* Add Task Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">משימה חדשה</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">כותרת</label>
                <input
                  autoFocus
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="מה צריך לעשות?"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">תיאור (אופציונלי)</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="פרטים נוספים..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">עדיפות</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="LOW">נמוכה</option>
                    <option value="MEDIUM">בינונית</option>
                    <option value="HIGH">גבוהה</option>
                    <option value="URGENT">דחוף</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">תאריך יעד</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                >
                  {submitting ? "שומר..." : "הוסף משימה"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors"
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">טוען...</div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-20 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
          </div>
          <p className="text-gray-600 font-semibold">אין משימות עדיין</p>
          <p className="text-gray-400 text-sm mt-1 mb-5">הוסף את המשימה הראשונה שלך</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            הוסף משימה
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-x-auto md:overflow-visible">
          {COLUMNS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.key);
            return (
              <div key={col.key} className={`rounded-2xl border p-4 ${col.color}`}>
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                  <h3 className="font-semibold text-gray-700 text-sm">{col.label}</h3>
                  <span className="mr-auto text-xs text-gray-400 font-medium bg-white/70 px-2 py-0.5 rounded-full border border-gray-200">
                    {colTasks.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {colTasks.map(task => (
                    <div
                      key={task.id}
                      className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-sm hover:shadow-md transition-shadow group"
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <p className="text-sm font-semibold text-gray-900 leading-snug flex-1">{task.title}</p>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all flex-shrink-0 mt-0.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      {task.description && (
                        <p className="text-xs text-gray-400 mb-2 leading-relaxed">{task.description}</p>
                      )}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${PRIORITY_COLOR[task.priority]}`}>
                          {PRIORITY_LABEL[task.priority]}
                        </span>
                        {task.dueDate && (
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${isOverdue(task.dueDate) && task.status !== "DONE" ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"}`}>
                            {isOverdue(task.dueDate) && task.status !== "DONE" ? "⚠ " : ""}{formatDate(task.dueDate)}
                          </span>
                        )}
                      </div>
                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100">
                        {col.key !== "TODO" && (
                          <button
                            onClick={() => moveTask(task.id, col.key === "IN_PROGRESS" ? "TODO" : "IN_PROGRESS")}
                            className="text-[10px] text-gray-400 hover:text-gray-600 hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors"
                          >
                            ← {col.key === "IN_PROGRESS" ? "לביצוע" : "בביצוע"}
                          </button>
                        )}
                        {col.key !== "DONE" && (
                          <button
                            onClick={() => moveTask(task.id, col.key === "TODO" ? "IN_PROGRESS" : "DONE")}
                            className="text-[10px] text-green-600 hover:text-green-700 hover:bg-green-50 px-2 py-1 rounded-lg transition-colors"
                          >
                            {col.key === "TODO" ? "התחל" : "סיים"} →
                          </button>
                        )}
                        {col.key === "DONE" && (
                          <button
                            onClick={() => moveTask(task.id, "IN_PROGRESS")}
                            className="text-[10px] text-gray-400 hover:text-gray-600 hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors"
                          >
                            ← פתח מחדש
                          </button>
                        )}
                        {/* Add to Google Calendar */}
                        {calendarConnected && (
                          <button
                            onClick={() => addToCalendar(task)}
                            disabled={addingToCalendar === task.id}
                            title="הוסף ליומן Google"
                            className="mr-auto text-[10px] text-blue-400 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                          >
                            <CalIcon />
                            {addingToCalendar === task.id ? "..." : "יומן"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {colTasks.length === 0 && (
                    <div className="text-center py-8 text-gray-300 text-xs">אין משימות</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
