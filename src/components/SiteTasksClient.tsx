"use client";

import { useState, useEffect } from "react";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string | null;
  assignedTo: string | null;
  siteId: string | null;
  createdAt: string;
};

type Member = { id: string; name: string; email: string };

const COLUMNS: { key: Task["status"]; label: string; color: string; bg: string; border: string; dot: string }[] = [
  { key: "TODO", label: "לביצוע", color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200", dot: "bg-slate-400" },
  { key: "IN_PROGRESS", label: "בביצוע", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-500" },
  { key: "DONE", label: "הושלם", color: "text-green-700", bg: "bg-green-50", border: "border-green-200", dot: "bg-green-500" },
];

const PRIORITY_CONFIG = {
  LOW:    { label: "נמוכה", bg: "bg-gray-100",   text: "text-gray-500",   bar: "bg-gray-300"   },
  MEDIUM: { label: "בינונית", bg: "bg-blue-100",  text: "text-blue-600",   bar: "bg-blue-400"   },
  HIGH:   { label: "גבוהה",  bg: "bg-orange-100", text: "text-orange-600", bar: "bg-orange-400" },
  URGENT: { label: "דחוף",   bg: "bg-red-100",    text: "text-red-600",    bar: "bg-red-500"    },
};

const EMPTY_FORM = {
  title: "", description: "", priority: "MEDIUM" as Task["priority"],
  dueDate: "", assignedTo: "", status: "TODO" as Task["status"],
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "short" }).format(new Date(date));
}

function isOverdue(date: string | null, status: Task["status"]) {
  if (!date || status === "DONE") return false;
  return new Date(date) < new Date();
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function Avatar({ name }: { name: string }) {
  const colors = [
    "bg-purple-200 text-purple-800", "bg-blue-200 text-blue-800",
    "bg-green-200 text-green-800", "bg-orange-200 text-orange-800",
    "bg-pink-200 text-pink-800", "bg-teal-200 text-teal-800",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${color}`} title={name}>
      {initials(name)}
    </div>
  );
}

// ---- Task Card ----
function TaskCard({
  task,
  memberName,
  onEdit,
  onDelete,
  onMove,
  isAdmin,
}: {
  task: Task;
  memberName: (id: string | null) => string | null;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, status: Task["status"]) => void;
  isAdmin: boolean;
}) {
  const pc = PRIORITY_CONFIG[task.priority];
  const overdue = isOverdue(task.dueDate, task.status);
  const assignee = memberName(task.assignedTo);

  const prevStatus: Record<Task["status"], Task["status"] | null> = { TODO: null, IN_PROGRESS: "TODO", DONE: "IN_PROGRESS" };
  const nextStatus: Record<Task["status"], Task["status"] | null> = { TODO: "IN_PROGRESS", IN_PROGRESS: "DONE", DONE: null };

  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm p-3.5 group transition-shadow hover:shadow-md ${task.status === "DONE" ? "opacity-70" : ""}`}>
      {/* Priority bar */}
      <div className={`h-0.5 w-full rounded-full mb-3 ${pc.bar}`} />

      {/* Title */}
      <p className={`text-sm font-semibold leading-snug mb-1 ${task.status === "DONE" ? "line-through text-gray-400" : "text-gray-900"}`}>
        {task.title}
      </p>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-gray-500 mb-2 leading-relaxed line-clamp-2">{task.description}</p>
      )}

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${pc.bg} ${pc.text}`}>
          {pc.label}
        </span>
        {task.dueDate && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium flex items-center gap-0.5 ${
            overdue ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"
          }`}>
            {overdue ? "⚠" : "📅"} {formatDate(task.dueDate)}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {assignee && <Avatar name={assignee} />}
          {assignee && <span className="text-[10px] text-gray-400 truncate max-w-[80px]">{assignee}</span>}
        </div>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Move back */}
          {prevStatus[task.status] && (
            <button
              type="button"
              onClick={() => onMove(task.id, prevStatus[task.status]!)}
              className="text-gray-300 hover:text-gray-500 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              title="הזז אחורה"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {/* Move forward */}
          {nextStatus[task.status] && (
            <button
              type="button"
              onClick={() => onMove(task.id, nextStatus[task.status]!)}
              className="text-gray-300 hover:text-green-500 p-1 rounded-lg hover:bg-green-50 transition-colors"
              title="הזז קדימה"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          {/* Edit */}
          <button
            type="button"
            onClick={() => onEdit(task)}
            className="text-gray-300 hover:text-blue-400 p-1 rounded-lg hover:bg-blue-50 transition-colors"
            title="ערוך"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          {/* Delete */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              className="text-gray-300 hover:text-red-400 p-1 rounded-lg hover:bg-red-50 transition-colors"
              title="מחק"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Task Form Modal ----
function TaskFormModal({
  open,
  onClose,
  onSubmit,
  initialValues,
  members,
  saving,
  isEdit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (form: typeof EMPTY_FORM) => void;
  initialValues: typeof EMPTY_FORM;
  members: Member[];
  saving: boolean;
  isEdit: boolean;
}) {
  const [form, setForm] = useState(initialValues);

  useEffect(() => {
    if (open) setForm(initialValues);
  }, [open, initialValues]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900 text-lg">{isEdit ? "עריכת משימה" : "משימה חדשה"}</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4" dir="rtl">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">כותרת המשימה *</label>
            <input
              autoFocus
              type="text"
              placeholder="מה צריך לעשות?"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">תיאור</label>
            <textarea
              placeholder="פרטים נוספים..."
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 resize-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">עדיפות</label>
              <select
                value={form.priority}
                onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value as Task["priority"] }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
              >
                <option value="LOW">נמוכה</option>
                <option value="MEDIUM">בינונית</option>
                <option value="HIGH">גבוהה</option>
                <option value="URGENT">דחוף</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">סטטוס</label>
              <select
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as Task["status"] }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
              >
                <option value="TODO">לביצוע</option>
                <option value="IN_PROGRESS">בביצוע</option>
                <option value="DONE">הושלם</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">תאריך יעד</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
                dir="ltr"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">אחראי</label>
              <select
                value={form.assignedTo}
                onChange={(e) => setForm((p) => ({ ...p, assignedTo: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
              >
                <option value="">ללא אחראי</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving || !form.title.trim()}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-200 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
            >
              {saving ? "שומר..." : isEdit ? "שמור שינויים" : "הוסף משימה"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-sm font-medium transition-colors"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---- Toast ----
function Toast({ message, type, onClose }: { message: string; type: "error" | "success"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all animate-in slide-in-from-bottom-4 ${type === "error" ? "bg-red-600 text-white" : "bg-green-600 text-white"}`}>
      <span>{type === "error" ? "⚠" : "✓"}</span>
      <span>{message}</span>
      <button onClick={onClose} className="opacity-70 hover:opacity-100 mr-1">✕</button>
    </div>
  );
}

// ---- Main Component ----
export default function SiteTasksClient({
  tasks: initialTasks,
  siteId,
  isAdmin,
}: {
  tasks: Task[];
  siteId: string;
  isAdmin: boolean;
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [members, setMembers] = useState<Member[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [saving, setSaving] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<Task["status"]>("TODO");
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  function showToast(message: string, type: "error" | "success" = "error") {
    setToast({ message, type });
  }

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setMembers(d))
      .catch(() => {});
  }, []);

  const done = tasks.filter((t) => t.status === "DONE").length;
  const total = tasks.length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  function memberName(id: string | null) {
    if (!id) return null;
    return members.find((m) => m.id === id)?.name || null;
  }

  function openAddModal(status: Task["status"] = "TODO") {
    setEditingTask(null);
    setDefaultStatus(status);
    setShowModal(true);
  }

  function openEditModal(task: Task) {
    setEditingTask(task);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingTask(null);
  }

  async function handleSubmit(form: typeof EMPTY_FORM) {
    if (!form.title.trim()) return;
    setSaving(true);

    if (editingTask) {
      // --- Optimistic edit ---
      const prev = tasks;
      const updated = { ...editingTask, title: form.title.trim(), description: form.description.trim() || null, priority: form.priority, status: form.status, dueDate: form.dueDate || null, assignedTo: form.assignedTo || null };
      setTasks((t) => t.map((x) => x.id === editingTask.id ? updated : x));
      closeModal();
      setSaving(false);

      const res = await fetch(`/api/tasks/${editingTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: updated.title, description: updated.description, priority: updated.priority, status: updated.status, dueDate: updated.dueDate, assignedTo: updated.assignedTo }),
      });
      if (!res.ok) {
        setTasks(prev);
        showToast("שגיאה בשמירת המשימה — השינויים בוטלו");
      }
    } else {
      // --- Optimistic add ---
      const tempId = `temp-${Date.now()}`;
      const optimisticTask: Task = {
        id: tempId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        priority: form.priority,
        status: form.status,
        dueDate: form.dueDate || null,
        assignedTo: form.assignedTo || null,
        siteId,
        createdAt: new Date().toISOString(),
      };
      setTasks((prev) => [...prev, optimisticTask]);
      closeModal();
      setSaving(false);

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: optimisticTask.title,
          description: optimisticTask.description,
          priority: optimisticTask.priority,
          dueDate: optimisticTask.dueDate,
          assignedTo: optimisticTask.assignedTo,
          siteId,
          status: form.status,
        }),
      });

      if (res.ok) {
        const newTask = await res.json();
        // Replace temp entry with real one (with correct id from server)
        setTasks((prev) => prev.map((t) => t.id === tempId ? { ...newTask, status: form.status } : t));
        // If status != TODO, patch it (API defaults to TODO)
        if (form.status !== "TODO") {
          fetch(`/api/tasks/${newTask.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: form.status }),
          }).catch(() => {});
        }
      } else {
        setTasks((prev) => prev.filter((t) => t.id !== tempId));
        showToast("שגיאה בהוספת המשימה — נסה שוב");
      }
    }
  }

  async function handleMove(taskId: string, newStatus: Task["status"]) {
    // Optimistic — update immediately
    const prev = tasks;
    setTasks((t) => t.map((x) => x.id === taskId ? { ...x, status: newStatus } : x));

    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) {
      setTasks(prev); // rollback
      showToast("שגיאה בהעברת המשימה — נסה שוב");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("למחוק את המשימה?")) return;
    const prev = tasks;
    setTasks((t) => t.filter((x) => x.id !== id));

    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setTasks(prev); // rollback
      showToast("שגיאה במחיקת המשימה — נסה שוב");
    }
  }

  const modalInitial = editingTask
    ? {
        title: editingTask.title,
        description: editingTask.description || "",
        priority: editingTask.priority,
        status: editingTask.status,
        dueDate: editingTask.dueDate ? editingTask.dueDate.split("T")[0] : "",
        assignedTo: editingTask.assignedTo || "",
      }
    : { ...EMPTY_FORM, status: defaultStatus };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <TaskFormModal
        open={showModal}
        onClose={closeModal}
        onSubmit={handleSubmit}
        initialValues={modalInitial}
        members={members}
        saving={saving}
        isEdit={!!editingTask}
      />

      <div className="bg-white rounded-2xl border border-gray-100">
        {/* Header */}
        <div className="px-4 sm:px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <h2 className="font-bold text-gray-900 text-base flex-shrink-0">משימות הפרוייקט</h2>
              {total > 0 && (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="flex-1 bg-gray-100 rounded-full h-2 min-w-[60px]">
                    <div
                      className="h-2 rounded-full bg-green-500 transition-all duration-700"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0 font-medium">{done}/{total}</span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => openAddModal()}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3.5 py-2 rounded-xl transition-colors flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              הוסף משימה
            </button>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="p-4">
          {total === 0 ? (
            <div className="py-10 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm font-medium">אין משימות עדיין</p>
              <p className="text-gray-300 text-xs mt-1">לחץ &quot;הוסף משימה&quot; כדי להתחיל</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {COLUMNS.map((col) => {
                const colTasks = tasks.filter((t) => t.status === col.key);
                return (
                  <div key={col.key} className={`rounded-xl p-3 ${col.bg} border ${col.border} min-h-[120px]`}>
                    {/* Column header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                        <span className={`text-xs font-bold uppercase tracking-wide ${col.color}`}>{col.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-gray-400 bg-white/70 px-1.5 py-0.5 rounded-md">
                          {colTasks.length}
                        </span>
                        <button
                          type="button"
                          onClick={() => openAddModal(col.key)}
                          className="text-gray-400 hover:text-gray-600 p-0.5 rounded hover:bg-white/60 transition-colors"
                          title={`הוסף ל${col.label}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Cards */}
                    <div className="space-y-2">
                      {colTasks.length === 0 && (
                        <div className="text-center py-4 text-xs text-gray-300">ריק</div>
                      )}
                      {colTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          memberName={memberName}
                          onEdit={openEditModal}
                          onDelete={handleDelete}
                          onMove={handleMove}
                          isAdmin={isAdmin}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
