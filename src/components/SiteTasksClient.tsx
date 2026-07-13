"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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

const priorityLabel: Record<Task["priority"], string> = {
  LOW: "נמוך", MEDIUM: "בינוני", HIGH: "גבוה", URGENT: "דחוף",
};
const priorityColor: Record<Task["priority"], string> = {
  LOW: "bg-gray-100 text-gray-500",
  MEDIUM: "bg-blue-100 text-blue-600",
  HIGH: "bg-orange-100 text-orange-600",
  URGENT: "bg-red-100 text-red-600",
};

const statusIcon: Record<Task["status"], React.ReactNode> = {
  TODO: <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />,
  IN_PROGRESS: (
    <div className="w-5 h-5 rounded-full border-2 border-blue-400 flex-shrink-0 flex items-center justify-center">
      <div className="w-2 h-2 rounded-full bg-blue-400" />
    </div>
  ),
  DONE: (
    <div className="w-5 h-5 rounded-full bg-green-500 flex-shrink-0 flex items-center justify-center">
      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      </svg>
    </div>
  ),
};

const nextStatus: Record<Task["status"], Task["status"]> = {
  TODO: "IN_PROGRESS", IN_PROGRESS: "DONE", DONE: "TODO",
};
const statusLabel: Record<Task["status"], string> = {
  TODO: "לביצוע", IN_PROGRESS: "בביצוע", DONE: "הושלם",
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "short" }).format(new Date(date));
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "xs" }) {
  const colors = ["bg-purple-200 text-purple-700", "bg-blue-200 text-blue-700", "bg-green-200 text-green-700", "bg-orange-200 text-orange-700", "bg-pink-200 text-pink-700"];
  const color = colors[name.charCodeAt(0) % colors.length];
  const cls = size === "xs" ? "w-5 h-5 text-[9px]" : "w-6 h-6 text-[10px]";
  return (
    <div className={`${cls} rounded-full flex items-center justify-center font-bold flex-shrink-0 ${color}`}>
      {initials(name)}
    </div>
  );
}

const emptyAdd = { title: "", priority: "MEDIUM" as Task["priority"], dueDate: "", assignedTo: "" };

export default function SiteTasksClient({
  tasks: initialTasks,
  siteId,
  isAdmin,
}: {
  tasks: Task[];
  siteId: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [members, setMembers] = useState<Member[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addForm, setAddForm] = useState(emptyAdd);
  const [editForm, setEditForm] = useState({ title: "", priority: "MEDIUM" as Task["priority"], dueDate: "", assignedTo: "" });
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<"ALL" | Task["status"]>("ALL");

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setMembers(d))
      .catch(() => {});
  }, []);

  const done = tasks.filter((t) => t.status === "DONE").length;
  const total = tasks.length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;
  const filtered = filter === "ALL" ? tasks : tasks.filter((t) => t.status === filter);

  function memberName(id: string | null) {
    if (!id) return null;
    return members.find((m) => m.id === id)?.name || null;
  }

  async function toggleStatus(task: Task) {
    const newStatus = nextStatus[task.status];
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: newStatus } : t));
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    router.refresh();
  }

  async function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm.title.trim()) return;
    setAdding(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: addForm.title.trim(),
        priority: addForm.priority,
        dueDate: addForm.dueDate || null,
        assignedTo: addForm.assignedTo || null,
        siteId,
      }),
    });
    if (res.ok) {
      const newTask = await res.json();
      setTasks((prev) => [...prev, newTask]);
      setAddForm(emptyAdd);
      setShowAdd(false);
      router.refresh();
    }
    setAdding(false);
  }

  async function saveEdit(task: Task) {
    const updated: Task = {
      ...task,
      title: editForm.title,
      priority: editForm.priority,
      dueDate: editForm.dueDate || null,
      assignedTo: editForm.assignedTo || null,
    };
    setTasks((prev) => prev.map((t) => t.id === task.id ? updated : t));
    setEditingId(null);
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editForm.title,
        priority: editForm.priority,
        dueDate: editForm.dueDate || null,
        assignedTo: editForm.assignedTo || null,
      }),
    });
    router.refresh();
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100">
      {/* Header */}
      <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-50">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <h2 className="font-bold text-gray-900 flex-shrink-0">משימות ({total})</h2>
            {total > 0 && (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex-1 bg-gray-100 rounded-full h-1.5 min-w-[60px]">
                  <div
                    className="h-1.5 rounded-full bg-green-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{done}/{total}</span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowAdd((v) => !v)}
            className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 font-medium flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            הוסף
          </button>
        </div>

        {total > 0 && (
          <div className="flex gap-1 mt-2">
            {(["ALL", "TODO", "IN_PROGRESS", "DONE"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilter(s)}
                className={`text-xs px-2.5 py-1 rounded-lg transition-colors font-medium ${
                  filter === s ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                }`}
              >
                {s === "ALL" ? "הכל" : statusLabel[s]}
                {s !== "ALL" && (
                  <span className="mr-1 opacity-60">({tasks.filter((t) => t.status === s).length})</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={addTask} className="px-4 sm:px-5 py-3 border-b border-gray-50 bg-gray-50/50">
          <div className="flex flex-col gap-2">
            <input
              autoFocus
              type="text"
              placeholder="שם המשימה..."
              value={addForm.title}
              onChange={(e) => setAddForm((p) => ({ ...p, title: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <select
                value={addForm.priority}
                onChange={(e) => setAddForm((p) => ({ ...p, priority: e.target.value as Task["priority"] }))}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="LOW">עדיפות נמוכה</option>
                <option value="MEDIUM">עדיפות בינונית</option>
                <option value="HIGH">עדיפות גבוהה</option>
                <option value="URGENT">דחוף</option>
              </select>
              <input
                type="date"
                value={addForm.dueDate}
                onChange={(e) => setAddForm((p) => ({ ...p, dueDate: e.target.value }))}
                dir="ltr"
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              />
              <select
                value={addForm.assignedTo}
                onChange={(e) => setAddForm((p) => ({ ...p, assignedTo: e.target.value }))}
                className="col-span-2 sm:col-span-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="">בחר אחראי</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={adding || !addForm.title.trim()}
                className="flex-1 bg-green-500 hover:bg-green-400 disabled:bg-gray-200 text-white font-semibold py-2 rounded-xl text-sm transition-colors"
              >
                {adding ? "מוסיף..." : "הוסף משימה"}
              </button>
              <button
                type="button"
                onClick={() => { setShowAdd(false); setAddForm(emptyAdd); }}
                className="px-4 border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-xl text-sm"
              >
                ביטול
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-gray-400 text-sm">
            {total === 0 ? "אין משימות עדיין — לחץ הוסף כדי להתחיל" : "אין משימות בסטטוס זה"}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {filtered.map((task) => (
            <div key={task.id} className="px-4 sm:px-5 py-3">
              {editingId === task.id ? (
                <div className="flex flex-col gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <select
                      value={editForm.priority}
                      onChange={(e) => setEditForm((p) => ({ ...p, priority: e.target.value as Task["priority"] }))}
                      className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                    >
                      <option value="LOW">נמוך</option>
                      <option value="MEDIUM">בינוני</option>
                      <option value="HIGH">גבוה</option>
                      <option value="URGENT">דחוף</option>
                    </select>
                    <input
                      type="date"
                      value={editForm.dueDate}
                      onChange={(e) => setEditForm((p) => ({ ...p, dueDate: e.target.value }))}
                      dir="ltr"
                      className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                    />
                    <select
                      value={editForm.assignedTo}
                      onChange={(e) => setEditForm((p) => ({ ...p, assignedTo: e.target.value }))}
                      className="col-span-2 sm:col-span-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                    >
                      <option value="">בלי אחראי</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => saveEdit(task)}
                      className="flex-1 bg-green-500 hover:bg-green-400 text-white font-semibold py-1.5 rounded-xl text-sm"
                    >
                      שמור
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="px-3 border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-xl text-sm"
                    >
                      ביטול
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  {/* Status toggle */}
                  <button
                    type="button"
                    onClick={() => toggleStatus(task)}
                    title={`עבור ל${statusLabel[nextStatus[task.status]]}`}
                    className="flex-shrink-0 hover:opacity-70 transition-opacity"
                  >
                    {statusIcon[task.status]}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${task.status === "DONE" ? "line-through text-gray-400" : "text-gray-900"}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${priorityColor[task.priority]}`}>
                        {priorityLabel[task.priority]}
                      </span>
                      {task.dueDate && (
                        <span className={`text-xs ${new Date(task.dueDate) < new Date() && task.status !== "DONE" ? "text-red-500 font-medium" : "text-gray-400"}`}>
                          {formatDate(task.dueDate)}
                        </span>
                      )}
                      <span className="text-xs text-gray-300">{statusLabel[task.status]}</span>
                    </div>
                  </div>

                  {/* Assignee avatar */}
                  {task.assignedTo && memberName(task.assignedTo) && (
                    <div title={memberName(task.assignedTo)!} className="flex-shrink-0">
                      <Avatar name={memberName(task.assignedTo)!} size="sm" />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(task.id);
                        setEditForm({
                          title: task.title,
                          priority: task.priority,
                          dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
                          assignedTo: task.assignedTo || "",
                        });
                      }}
                      className="text-gray-300 hover:text-blue-400 transition-colors p-1 rounded-lg hover:bg-blue-50"
                      title="ערוך"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => deleteTask(task.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-50"
                        title="מחק"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
