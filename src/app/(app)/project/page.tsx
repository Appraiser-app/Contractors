"use client";

import { useCallback, useEffect, useState } from "react";

type Site = {
	id: string;
	name: string;
	status: string;
	location?: string | null;
	contractValue?: number | null;
};

type Task = {
	id: string;
	title: string;
	description?: string | null;
	status: "TODO" | "IN_PROGRESS" | "DONE";
	priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
	dueDate?: string | null;
	assignedTo?: string | null;
	createdAt: string;
};

type BudgetArea = {
	id: string;
	name: string;
	budgetAmount: number;
	notes?: string | null;
	color?: string | null;
	createdAt: string;
};

type Transaction = {
	id: string;
	type: string;
	amount: number;
	category?: string | null;
	description: string;
};

type ProjectPhase = {
	id: string;
	name: string;
	startDate: string;
	endDate: string;
	color?: string | null;
	progress: number;
	notes?: string | null;
	order: number;
};

const statusLabels: Record<Task["status"], string> = {
	TODO: "לביצוע",
	IN_PROGRESS: "בביצוע",
	DONE: "הושלם",
};
const statusColors: Record<Task["status"], string> = {
	TODO: "bg-slate-100 text-slate-600",
	IN_PROGRESS: "bg-blue-100 text-blue-700",
	DONE: "bg-green-100 text-green-700",
};
const priorityLabels: Record<Task["priority"], string> = {
	LOW: "נמוכה",
	MEDIUM: "בינונית",
	HIGH: "גבוהה",
	URGENT: "דחוף",
};
const priorityColors: Record<Task["priority"], string> = {
	LOW: "bg-slate-100 text-slate-500",
	MEDIUM: "bg-yellow-100 text-yellow-700",
	HIGH: "bg-orange-100 text-orange-700",
	URGENT: "bg-red-100 text-red-700",
};

const AREA_COLORS = [
	"#22c55e",
	"#3b82f6",
	"#f59e0b",
	"#ef4444",
	"#8b5cf6",
	"#06b6d4",
	"#ec4899",
	"#14b8a6",
];

const PHASE_COLORS = [
	"#22c55e",
	"#3b82f6",
	"#f59e0b",
	"#ef4444",
	"#8b5cf6",
	"#06b6d4",
	"#ec4899",
	"#14b8a6",
	"#84cc16",
	"#f97316",
];

function formatCurrency(n: number) {
	return new Intl.NumberFormat("he-IL", {
		style: "currency",
		currency: "ILS",
		maximumFractionDigits: 0,
	}).format(n);
}

function formatDate(d?: string | null) {
	if (!d) return "";
	return new Intl.DateTimeFormat("he-IL", {
		day: "numeric",
		month: "short",
	}).format(new Date(d));
}

function formatDateInput(d: string) {
	return d ? d.slice(0, 10) : "";
}

function monthLabel(date: Date) {
	return new Intl.DateTimeFormat("he-IL", {
		month: "short",
		year: "2-digit",
	}).format(date);
}

// ---- Gantt Chart Component ----
function GanttChart({
	phases,
	onEdit,
	onDelete,
	onProgressChange,
}: {
	phases: ProjectPhase[];
	onEdit: (phase: ProjectPhase) => void;
	onDelete: (id: string) => void;
	onProgressChange: (id: string, progress: number) => void;
}) {
	if (phases.length === 0) return null;

	const allDates = phases.flatMap((p) => [
		new Date(p.startDate),
		new Date(p.endDate),
	]);
	const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
	const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

	// Extend a bit for padding
	minDate.setDate(1);
	maxDate.setMonth(maxDate.getMonth() + 1, 1);

	const totalMs = maxDate.getTime() - minDate.getTime();
	const today = new Date();

	function pct(date: Date) {
		return Math.max(
			0,
			Math.min(100, ((date.getTime() - minDate.getTime()) / totalMs) * 100),
		);
	}

	// Build month markers
	const months: Date[] = [];
	const cur = new Date(minDate);
	while (cur <= maxDate) {
		months.push(new Date(cur));
		cur.setMonth(cur.getMonth() + 1);
	}

	const todayPct = pct(today);
	const showToday = todayPct >= 0 && todayPct <= 100;

	return (
		<div className="overflow-x-auto">
			<div style={{ minWidth: "600px" }}>
				{/* Month header */}
				<div className="flex mb-3 pr-32 sm:pr-40 relative">
					{months.map((m, i) => {
						const leftPct = pct(m);
						const nextDate = new Date(m);
						nextDate.setMonth(nextDate.getMonth() + 1);
						const widthPct = pct(nextDate) - leftPct;
						return (
							<div
								key={i}
								className="absolute text-[10px] text-gray-400 font-medium border-r border-gray-100 pr-1"
								style={{ right: `${leftPct}%`, width: `${widthPct}%`, top: 0 }}
							>
								{monthLabel(m)}
							</div>
						);
					})}
					<div style={{ height: "18px" }} />
				</div>

				{/* Phase rows */}
				<div className="space-y-2">
					{phases.map((phase) => {
						const start = new Date(phase.startDate);
						const end = new Date(phase.endDate);
						const leftPct = pct(start);
						const widthPct = Math.max(1, pct(end) - leftPct);
						const color = phase.color || "#22c55e";
						const isDone = phase.progress >= 100;

						return (
							<div key={phase.id} className="flex items-center gap-2 group">
								{/* Phase name */}
								<div className="w-32 sm:w-40 flex-shrink-0 text-right">
									<p className="text-xs font-semibold text-gray-800 truncate">
										{phase.name}
									</p>
									<p className="text-[10px] text-gray-400">{phase.progress}%</p>
								</div>

								{/* Bar area */}
								<div className="flex-1 relative h-8">
									{/* Background grid lines */}
									{months.map((m, i) => (
										<div
											key={i}
											className="absolute top-0 bottom-0 border-r border-gray-100"
											style={{ right: `${pct(m)}%` }}
										/>
									))}

									{/* Today line */}
									{showToday && (
										<div
											className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10"
											style={{ right: `${todayPct}%` }}
											title="היום"
										/>
									)}

									{/* Phase bar */}
									<div
										className="absolute top-1 bottom-1 rounded-lg cursor-pointer hover:opacity-90 transition-opacity shadow-sm overflow-hidden"
										style={{
											right: `${leftPct}%`,
											width: `${widthPct}%`,
											backgroundColor: `${color}33`,
											border: `2px solid ${color}`,
										}}
										onClick={() => onEdit(phase)}
										title={`${phase.name}: ${formatDate(phase.startDate)} — ${formatDate(phase.endDate)}`}
									>
										{/* Progress fill */}
										<div
											className="absolute top-0 bottom-0 right-0 rounded-md transition-all"
											style={{
												width: `${phase.progress}%`,
												backgroundColor: `${color}88`,
											}}
										/>
										{/* Label inside bar */}
										<span
											className="absolute inset-0 flex items-center justify-center text-[10px] font-bold z-10"
											style={{ color }}
										>
											{widthPct > 10 ? phase.name : ""}
										</span>
									</div>
								</div>

								{/* Actions */}
								<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
									{/* Quick progress buttons */}
									{!isDone && (
										<button
											onClick={() =>
												onProgressChange(
													phase.id,
													Math.min(100, phase.progress + 25),
												)
											}
											className="text-[10px] bg-green-50 text-green-600 hover:bg-green-100 px-1.5 py-0.5 rounded transition-colors"
											title="הוסף 25%"
										>
											+25%
										</button>
									)}
									<button
										onClick={() => onEdit(phase)}
										className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
									>
										<svg
											className="w-3.5 h-3.5"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
											/>
										</svg>
									</button>
									<button
										onClick={() => onDelete(phase.id)}
										className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
									>
										<svg
											className="w-3.5 h-3.5"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
											/>
										</svg>
									</button>
								</div>
							</div>
						);
					})}
				</div>

				{/* Legend */}
				{showToday && (
					<div className="flex items-center gap-2 mt-4 text-xs text-gray-500 justify-end pr-2">
						<div className="w-4 h-0.5 bg-red-400" />
						<span>היום</span>
					</div>
				)}
			</div>
		</div>
	);
}

export default function ProjectPage() {
	const [sites, setSites] = useState<Site[]>([]);
	const [selectedSiteId, setSelectedSiteId] = useState<string>("");
	const [activeTab, setActiveTab] = useState<"tasks" | "budget" | "timeline">(
		"tasks",
	);

	// Tasks state
	const [tasks, setTasks] = useState<Task[]>([]);
	const [tasksLoading, setTasksLoading] = useState(false);
	const [showAddTask, setShowAddTask] = useState(false);
	const [editingTask, setEditingTask] = useState<Task | null>(null);
	const [taskForm, setTaskForm] = useState({
		title: "",
		description: "",
		priority: "MEDIUM",
		dueDate: "",
		assignedTo: "",
		status: "TODO",
	});

	// Budget state
	const [budgetAreas, setBudgetAreas] = useState<BudgetArea[]>([]);
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [budgetLoading, setBudgetLoading] = useState(false);
	const [showAddArea, setShowAddArea] = useState(false);
	const [editingArea, setEditingArea] = useState<BudgetArea | null>(null);
	const [areaForm, setAreaForm] = useState({
		name: "",
		budgetAmount: "",
		notes: "",
		color: AREA_COLORS[0],
	});

	// Timeline / phases state
	const [phases, setPhases] = useState<ProjectPhase[]>([]);
	const [phasesLoading, setPhasesLoading] = useState(false);
	const [showAddPhase, setShowAddPhase] = useState(false);
	const [editingPhase, setEditingPhase] = useState<ProjectPhase | null>(null);
	const [phaseForm, setPhaseForm] = useState({
		name: "",
		startDate: "",
		endDate: "",
		color: PHASE_COLORS[0],
		progress: "0",
		notes: "",
	});

	// Load sites
	useEffect(() => {
		fetch("/api/sites")
			.then((r) => r.json())
			.then((data) => {
				const list: Site[] = Array.isArray(data) ? data : [];
				setSites(list);
				if (list.length > 0) setSelectedSiteId(list[0].id);
			});
	}, []);

	const loadTasks = useCallback(async (siteId: string) => {
		setTasksLoading(true);
		try {
			const res = await fetch(`/api/project/tasks?siteId=${siteId}`);
			const data = await res.json();
			setTasks(Array.isArray(data) ? data : []);
		} finally {
			setTasksLoading(false);
		}
	}, []);

	const loadBudget = useCallback(async (siteId: string) => {
		setBudgetLoading(true);
		try {
			const [areasRes, txRes] = await Promise.all([
				fetch(`/api/project/budget-areas?siteId=${siteId}`),
				fetch(`/api/sites/${siteId}/transactions`).catch(() => null),
			]);
			const areas = await areasRes.json();
			setBudgetAreas(Array.isArray(areas) ? areas : []);
			if (txRes?.ok) {
				const txData = await txRes.json();
				setTransactions(Array.isArray(txData) ? txData : []);
			}
		} finally {
			setBudgetLoading(false);
		}
	}, []);

	const loadPhases = useCallback(async (siteId: string) => {
		setPhasesLoading(true);
		try {
			const res = await fetch(`/api/project/phases?siteId=${siteId}`);
			const data = await res.json();
			setPhases(Array.isArray(data) ? data : []);
		} finally {
			setPhasesLoading(false);
		}
	}, []);

	useEffect(() => {
		if (!selectedSiteId) return;
		loadTasks(selectedSiteId);
		loadBudget(selectedSiteId);
		loadPhases(selectedSiteId);
	}, [selectedSiteId, loadTasks, loadBudget, loadPhases]);

	// ---- Task CRUD ----
	async function submitTask(e: React.FormEvent) {
		e.preventDefault();
		if (!taskForm.title.trim()) return;
		const body = {
			siteId: selectedSiteId,
			...taskForm,
			status: editingTask ? taskForm.status : "TODO",
		};
		const res = editingTask
			? await fetch(`/api/project/tasks/${editingTask.id}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(body),
				})
			: await fetch("/api/project/tasks", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(body),
				});
		if (!res.ok) {
			alert("שמירת המשימה נכשלה. נסה שוב.");
			return;
		}
		setShowAddTask(false);
		setEditingTask(null);
		setTaskForm({
			title: "",
			description: "",
			priority: "MEDIUM",
			dueDate: "",
			assignedTo: "",
			status: "TODO",
		});
		loadTasks(selectedSiteId);
	}

	async function updateTaskStatus(taskId: string, status: Task["status"]) {
		await fetch(`/api/project/tasks/${taskId}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ status }),
		});
		setTasks((prev) =>
			prev.map((t) => (t.id === taskId ? { ...t, status } : t)),
		);
	}

	async function deleteTask(taskId: string) {
		if (!confirm("למחוק את המשימה?")) return;
		await fetch(`/api/project/tasks/${taskId}`, { method: "DELETE" });
		setTasks((prev) => prev.filter((t) => t.id !== taskId));
	}

	function openEditTask(task: Task) {
		setEditingTask(task);
		setTaskForm({
			title: task.title,
			description: task.description || "",
			priority: task.priority,
			dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
			assignedTo: task.assignedTo || "",
			status: task.status,
		});
		setShowAddTask(true);
	}

	// ---- Budget CRUD ----
	async function submitArea(e: React.FormEvent) {
		e.preventDefault();
		if (!areaForm.name.trim()) return;
		const body = {
			siteId: selectedSiteId,
			name: areaForm.name,
			budgetAmount: Number.parseFloat(areaForm.budgetAmount) || 0,
			notes: areaForm.notes,
			color: areaForm.color,
		};
		const res = editingArea
			? await fetch(`/api/project/budget-areas/${editingArea.id}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(body),
				})
			: await fetch("/api/project/budget-areas", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(body),
				});
		if (!res.ok) {
			alert("שמירת התחום נכשלה. נסה שוב.");
			return;
		}
		setShowAddArea(false);
		setEditingArea(null);
		setAreaForm({
			name: "",
			budgetAmount: "",
			notes: "",
			color: AREA_COLORS[0],
		});
		loadBudget(selectedSiteId);
	}

	async function deleteArea(areaId: string) {
		if (!confirm("למחוק את התחום?")) return;
		await fetch(`/api/project/budget-areas/${areaId}`, { method: "DELETE" });
		setBudgetAreas((prev) => prev.filter((a) => a.id !== areaId));
	}

	function openEditArea(area: BudgetArea) {
		setEditingArea(area);
		setAreaForm({
			name: area.name,
			budgetAmount: String(area.budgetAmount),
			notes: area.notes || "",
			color: area.color || AREA_COLORS[0],
		});
		setShowAddArea(true);
	}

	// ---- Phase CRUD ----
	async function submitPhase(e: React.FormEvent) {
		e.preventDefault();
		if (!phaseForm.name.trim() || !phaseForm.startDate || !phaseForm.endDate)
			return;
		const body = {
			siteId: selectedSiteId,
			name: phaseForm.name,
			startDate: phaseForm.startDate,
			endDate: phaseForm.endDate,
			color: phaseForm.color,
			progress: Number.parseInt(phaseForm.progress) || 0,
			notes: phaseForm.notes,
			order: editingPhase ? editingPhase.order : phases.length,
		};
		const res = editingPhase
			? await fetch(`/api/project/phases/${editingPhase.id}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(body),
				})
			: await fetch("/api/project/phases", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(body),
				});
		if (!res.ok) {
			alert("שמירת השלב נכשלה. נסה שוב.");
			return;
		}
		setShowAddPhase(false);
		setEditingPhase(null);
		setPhaseForm({
			name: "",
			startDate: "",
			endDate: "",
			color: PHASE_COLORS[phases.length % PHASE_COLORS.length],
			progress: "0",
			notes: "",
		});
		loadPhases(selectedSiteId);
	}

	async function deletePhase(phaseId: string) {
		if (!confirm("למחוק את השלב?")) return;
		await fetch(`/api/project/phases/${phaseId}`, { method: "DELETE" });
		setPhases((prev) => prev.filter((p) => p.id !== phaseId));
	}

	function openEditPhase(phase: ProjectPhase) {
		setEditingPhase(phase);
		setPhaseForm({
			name: phase.name,
			startDate: formatDateInput(phase.startDate),
			endDate: formatDateInput(phase.endDate),
			color: phase.color || PHASE_COLORS[0],
			progress: String(phase.progress),
			notes: phase.notes || "",
		});
		setShowAddPhase(true);
	}

	async function updatePhaseProgress(phaseId: string, progress: number) {
		await fetch(`/api/project/phases/${phaseId}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ progress }),
		});
		setPhases((prev) =>
			prev.map((p) => (p.id === phaseId ? { ...p, progress } : p)),
		);
	}

	const selectedSite = sites.find((s) => s.id === selectedSiteId);
	const totalBudget = budgetAreas.reduce((s, a) => s + a.budgetAmount, 0);
	const totalExpenses = transactions
		.filter((t) => t.type === "EXPENSE")
		.reduce((s, t) => s + t.amount, 0);

	const todoTasks = tasks.filter((t) => t.status === "TODO");
	const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS");
	const doneTasks = tasks.filter((t) => t.status === "DONE");

	const avgProgress =
		phases.length > 0
			? Math.round(phases.reduce((s, p) => s + p.progress, 0) / phases.length)
			: 0;
	const completedPhases = phases.filter((p) => p.progress >= 100).length;

	return (
		<div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto" dir="rtl">
			{/* Header */}
			<div className="mb-6">
				<h1 className="text-2xl font-bold text-gray-900 mb-1">ניהול פרוייקט</h1>
				<p className="text-gray-500 text-sm">משימות, תקציב וציר זמן</p>
			</div>

			{/* Site Selector */}
			<div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
				<label className="block text-xs font-medium text-gray-500 mb-2">
					בחר פרוייקט
				</label>
				<select
					value={selectedSiteId}
					onChange={(e) => setSelectedSiteId(e.target.value)}
					className="w-full sm:w-80 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
				>
					{sites.map((s) => (
						<option key={s.id} value={s.id}>
							{s.name}
							{s.location ? ` — ${s.location}` : ""}
						</option>
					))}
				</select>
				{selectedSite?.contractValue && (
					<p className="text-xs text-gray-400 mt-2">
						ערך חוזה: {formatCurrency(selectedSite.contractValue)}
					</p>
				)}
			</div>

			{/* Tabs */}
			<div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-6 w-fit">
				{(
					[
						{
							key: "tasks",
							label: "משימות",
							icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
							count: tasks.length,
						},
						{
							key: "budget",
							label: "תקציב",
							icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
							count: budgetAreas.length,
						},
						{
							key: "timeline",
							label: "ציר זמן",
							icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
							count: phases.length,
						},
					] as {
						key: "tasks" | "budget" | "timeline";
						label: string;
						icon: string;
						count: number;
					}[]
				).map((tab) => (
					<button
						key={tab.key}
						onClick={() => setActiveTab(tab.key)}
						className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
					>
						<span className="flex items-center gap-2">
							<svg
								className="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d={tab.icon}
								/>
							</svg>
							{tab.label}
							{tab.count > 0 && (
								<span className="bg-gray-200 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
									{tab.count}
								</span>
							)}
						</span>
					</button>
				))}
			</div>

			{/* ===== TASKS TAB ===== */}
			{activeTab === "tasks" && (
				<div>
					<div className="grid grid-cols-3 gap-3 mb-5">
						<div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
							<p className="text-2xl font-bold text-slate-600">
								{todoTasks.length}
							</p>
							<p className="text-xs text-gray-400 mt-1">לביצוע</p>
						</div>
						<div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
							<p className="text-2xl font-bold text-blue-600">
								{inProgressTasks.length}
							</p>
							<p className="text-xs text-gray-400 mt-1">בביצוע</p>
						</div>
						<div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
							<p className="text-2xl font-bold text-green-600">
								{doneTasks.length}
							</p>
							<p className="text-xs text-gray-400 mt-1">הושלמו</p>
						</div>
					</div>

					<div className="flex justify-between items-center mb-4">
						<h2 className="font-bold text-gray-900">משימות הפרוייקט</h2>
						<button
							onClick={() => {
								setEditingTask(null);
								setTaskForm({
									title: "",
									description: "",
									priority: "MEDIUM",
									dueDate: "",
									assignedTo: "",
									status: "TODO",
								});
								setShowAddTask(true);
							}}
							className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
						>
							<svg
								className="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 4v16m8-8H4"
								/>
							</svg>
							הוסף משימה
						</button>
					</div>

					{showAddTask && (
						<div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5 shadow-sm">
							<h3 className="font-bold text-gray-900 mb-4">
								{editingTask ? "עריכת משימה" : "משימה חדשה"}
							</h3>
							<form onSubmit={submitTask} className="space-y-3">
								<input
									type="text"
									placeholder="כותרת המשימה *"
									value={taskForm.title}
									onChange={(e) =>
										setTaskForm((f) => ({ ...f, title: e.target.value }))
									}
									className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
									required
								/>
								<textarea
									placeholder="תיאור (אופציונלי)"
									value={taskForm.description}
									onChange={(e) =>
										setTaskForm((f) => ({ ...f, description: e.target.value }))
									}
									className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
									rows={2}
								/>
								<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
									<div>
										<label className="block text-xs text-gray-500 mb-1">
											עדיפות
										</label>
										<select
											value={taskForm.priority}
											onChange={(e) =>
												setTaskForm((f) => ({ ...f, priority: e.target.value }))
											}
											className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
										>
											<option value="LOW">נמוכה</option>
											<option value="MEDIUM">בינונית</option>
											<option value="HIGH">גבוהה</option>
											<option value="URGENT">דחוף</option>
										</select>
									</div>
									{editingTask && (
										<div>
											<label className="block text-xs text-gray-500 mb-1">
												סטטוס
											</label>
											<select
												value={taskForm.status}
												onChange={(e) =>
													setTaskForm((f) => ({ ...f, status: e.target.value }))
												}
												className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
											>
												<option value="TODO">לביצוע</option>
												<option value="IN_PROGRESS">בביצוע</option>
												<option value="DONE">הושלם</option>
											</select>
										</div>
									)}
									<div>
										<label className="block text-xs text-gray-500 mb-1">
											תאריך יעד
										</label>
										<input
											type="date"
											value={taskForm.dueDate}
											onChange={(e) =>
												setTaskForm((f) => ({ ...f, dueDate: e.target.value }))
											}
											className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
										/>
									</div>
									<div>
										<label className="block text-xs text-gray-500 mb-1">
											אחראי
										</label>
										<input
											type="text"
											placeholder="שם האחראי"
											value={taskForm.assignedTo}
											onChange={(e) =>
												setTaskForm((f) => ({
													...f,
													assignedTo: e.target.value,
												}))
											}
											className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
										/>
									</div>
								</div>
								<div className="flex gap-2 pt-1">
									<button
										type="submit"
										className="bg-green-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
									>
										{editingTask ? "שמור" : "הוסף"}
									</button>
									<button
										type="button"
										onClick={() => {
											setShowAddTask(false);
											setEditingTask(null);
										}}
										className="border border-gray-200 text-gray-600 px-5 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
									>
										ביטול
									</button>
								</div>
							</form>
						</div>
					)}

					{tasksLoading ? (
						<div className="text-center py-12 text-gray-400">טוען...</div>
					) : tasks.length === 0 ? (
						<div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
							<div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
								<svg
									className="w-6 h-6 text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
									/>
								</svg>
							</div>
							<p className="text-gray-400 text-sm">
								אין משימות לפרוייקט זה עדיין
							</p>
						</div>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
							{(["TODO", "IN_PROGRESS", "DONE"] as Task["status"][]).map(
								(col) => {
									const colTasks = tasks.filter((t) => t.status === col);
									return (
										<div key={col} className="bg-gray-50 rounded-2xl p-3">
											<div className="flex items-center justify-between mb-3">
												<span
													className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${statusColors[col]}`}
												>
													{statusLabels[col]}
												</span>
												<span className="text-xs text-gray-400 font-medium">
													{colTasks.length}
												</span>
											</div>
											<div className="space-y-2">
												{colTasks.map((task) => (
													<div
														key={task.id}
														className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm"
													>
														<div className="flex items-start justify-between gap-2 mb-2">
															<p className="text-sm font-medium text-gray-900 leading-snug flex-1">
																{task.title}
															</p>
															<div className="flex gap-1 flex-shrink-0">
																<button
																	onClick={() => openEditTask(task)}
																	className="text-gray-400 hover:text-gray-600 p-0.5"
																>
																	<svg
																		className="w-3.5 h-3.5"
																		fill="none"
																		stroke="currentColor"
																		viewBox="0 0 24 24"
																	>
																		<path
																			strokeLinecap="round"
																			strokeLinejoin="round"
																			strokeWidth={2}
																			d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
																		/>
																	</svg>
																</button>
																<button
																	onClick={() => deleteTask(task.id)}
																	className="text-gray-400 hover:text-red-500 p-0.5"
																>
																	<svg
																		className="w-3.5 h-3.5"
																		fill="none"
																		stroke="currentColor"
																		viewBox="0 0 24 24"
																	>
																		<path
																			strokeLinecap="round"
																			strokeLinejoin="round"
																			strokeWidth={2}
																			d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
																		/>
																	</svg>
																</button>
															</div>
														</div>
														{task.description && (
															<p className="text-xs text-gray-500 mb-2 leading-relaxed">
																{task.description}
															</p>
														)}
														<div className="flex flex-wrap gap-1.5">
															<span
																className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${priorityColors[task.priority]}`}
															>
																{priorityLabels[task.priority]}
															</span>
															{task.dueDate && (
																<span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md">
																	📅 {formatDate(task.dueDate)}
																</span>
															)}
															{task.assignedTo && (
																<span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md">
																	👤 {task.assignedTo}
																</span>
															)}
														</div>
														{col !== "DONE" && (
															<button
																onClick={() =>
																	updateTaskStatus(
																		task.id,
																		col === "TODO" ? "IN_PROGRESS" : "DONE",
																	)
																}
																className="mt-2 w-full text-xs text-center text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg py-1 transition-colors border border-dashed border-gray-200 hover:border-green-300"
															>
																{col === "TODO"
																	? "→ התחל ביצוע"
																	: "→ סמן הושלם"}
															</button>
														)}
													</div>
												))}
											</div>
										</div>
									);
								},
							)}
						</div>
					)}
				</div>
			)}

			{/* ===== BUDGET TAB ===== */}
			{activeTab === "budget" && (
				<div>
					<div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
						<div className="bg-white rounded-2xl border border-gray-100 p-4">
							<p className="text-xs text-gray-400 mb-1">סה״כ תקציב מתוכנן</p>
							<p className="text-xl font-bold text-gray-900">
								{formatCurrency(totalBudget)}
							</p>
						</div>
						<div className="bg-white rounded-2xl border border-gray-100 p-4">
							<p className="text-xs text-gray-400 mb-1">סה״כ הוצאות בפועל</p>
							<p className="text-xl font-bold text-red-600">
								{formatCurrency(totalExpenses)}
							</p>
						</div>
						<div className="bg-white rounded-2xl border border-gray-100 p-4 sm:col-span-1 col-span-2">
							<p className="text-xs text-gray-400 mb-1">יתרת תקציב</p>
							<p
								className={`text-xl font-bold ${totalBudget - totalExpenses >= 0 ? "text-green-600" : "text-red-600"}`}
							>
								{formatCurrency(totalBudget - totalExpenses)}
							</p>
						</div>
					</div>

					{totalBudget > 0 && (
						<div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5">
							<div className="flex justify-between text-xs text-gray-500 mb-2">
								<span>ניצול תקציב</span>
								<span>{Math.round((totalExpenses / totalBudget) * 100)}%</span>
							</div>
							<div className="w-full bg-gray-100 rounded-full h-3">
								<div
									className={`h-3 rounded-full transition-all ${totalExpenses / totalBudget > 0.9 ? "bg-red-500" : totalExpenses / totalBudget > 0.7 ? "bg-orange-400" : "bg-green-500"}`}
									style={{
										width: `${Math.min(100, (totalExpenses / totalBudget) * 100)}%`,
									}}
								/>
							</div>
						</div>
					)}

					<div className="flex justify-between items-center mb-4">
						<h2 className="font-bold text-gray-900">תחומי תקציב</h2>
						<button
							onClick={() => {
								setEditingArea(null);
								setAreaForm({
									name: "",
									budgetAmount: "",
									notes: "",
									color: AREA_COLORS[budgetAreas.length % AREA_COLORS.length],
								});
								setShowAddArea(true);
							}}
							className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
						>
							<svg
								className="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 4v16m8-8H4"
								/>
							</svg>
							הוסף תחום
						</button>
					</div>

					{showAddArea && (
						<div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5 shadow-sm">
							<h3 className="font-bold text-gray-900 mb-4">
								{editingArea ? "עריכת תחום" : "תחום תקציב חדש"}
							</h3>
							<form onSubmit={submitArea} className="space-y-3">
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									<div>
										<label className="block text-xs text-gray-500 mb-1">
											שם התחום *
										</label>
										<input
											type="text"
											placeholder="למשל: עפר, ניקוז, כביש..."
											value={areaForm.name}
											onChange={(e) =>
												setAreaForm((f) => ({ ...f, name: e.target.value }))
											}
											className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
											required
										/>
									</div>
									<div>
										<label className="block text-xs text-gray-500 mb-1">
											תקציב מתוכנן (₪) *
										</label>
										<input
											type="number"
											placeholder="0"
											value={areaForm.budgetAmount}
											onChange={(e) =>
												setAreaForm((f) => ({
													...f,
													budgetAmount: e.target.value,
												}))
											}
											className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
										/>
									</div>
								</div>
								<input
									type="text"
									placeholder="הערות (אופציונלי)"
									value={areaForm.notes}
									onChange={(e) =>
										setAreaForm((f) => ({ ...f, notes: e.target.value }))
									}
									className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
								/>
								<div>
									<label className="block text-xs text-gray-500 mb-2">
										צבע
									</label>
									<div className="flex gap-2 flex-wrap">
										{AREA_COLORS.map((c) => (
											<button
												key={c}
												type="button"
												onClick={() => setAreaForm((f) => ({ ...f, color: c }))}
												className={`w-7 h-7 rounded-full border-2 transition-all ${areaForm.color === c ? "border-gray-900 scale-110" : "border-transparent"}`}
												style={{ backgroundColor: c }}
											/>
										))}
									</div>
								</div>
								<div className="flex gap-2 pt-1">
									<button
										type="submit"
										className="bg-green-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
									>
										{editingArea ? "שמור" : "הוסף"}
									</button>
									<button
										type="button"
										onClick={() => {
											setShowAddArea(false);
											setEditingArea(null);
										}}
										className="border border-gray-200 text-gray-600 px-5 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
									>
										ביטול
									</button>
								</div>
							</form>
						</div>
					)}

					{budgetLoading ? (
						<div className="text-center py-12 text-gray-400">טוען...</div>
					) : budgetAreas.length === 0 ? (
						<div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
							<p className="text-gray-400 text-sm">
								אין תחומי תקציב לפרוייקט זה עדיין
							</p>
							<p className="text-gray-300 text-xs mt-1">
								הוסף תחומים כמו: עפר, כביש, ניקוז, עצים...
							</p>
						</div>
					) : (
						<div className="space-y-3">
							{budgetAreas.map((area) => {
								const pct =
									area.budgetAmount > 0
										? Math.min(
												100,
												(totalExpenses /
													budgetAreas.length /
													area.budgetAmount) *
													100,
											)
										: 0;
								return (
									<div
										key={area.id}
										className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5"
									>
										<div className="flex items-start justify-between gap-3 mb-3">
											<div className="flex items-center gap-3">
												<div
													className="w-3 h-3 rounded-full flex-shrink-0"
													style={{ backgroundColor: area.color || "#22c55e" }}
												/>
												<div>
													<p className="font-semibold text-gray-900">
														{area.name}
													</p>
													{area.notes && (
														<p className="text-xs text-gray-400 mt-0.5">
															{area.notes}
														</p>
													)}
												</div>
											</div>
											<div className="flex items-center gap-1">
												<button
													onClick={() => openEditArea(area)}
													className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
												>
													<svg
														className="w-4 h-4"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
														/>
													</svg>
												</button>
												<button
													onClick={() => deleteArea(area.id)}
													className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
												>
													<svg
														className="w-4 h-4"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
														/>
													</svg>
												</button>
											</div>
										</div>
										<div className="flex justify-between text-sm mb-2">
											<span className="text-gray-500">
												תקציב:{" "}
												<span className="font-semibold text-gray-900">
													{formatCurrency(area.budgetAmount)}
												</span>
											</span>
											<span className="text-gray-400 text-xs">
												{Math.round(
													totalBudget > 0
														? (area.budgetAmount / totalBudget) * 100
														: 0,
												)}
												% מסה״כ
											</span>
										</div>
										{area.budgetAmount > 0 && (
											<div className="w-full bg-gray-100 rounded-full h-2">
												<div
													className="h-2 rounded-full transition-all"
													style={{
														width: `${pct}%`,
														backgroundColor: area.color || "#22c55e",
													}}
												/>
											</div>
										)}
									</div>
								);
							})}

							{totalBudget > 0 && (
								<div className="bg-white rounded-2xl border border-gray-100 p-5 mt-4">
									<h3 className="font-semibold text-gray-900 mb-4 text-sm">
										התפלגות תקציב
									</h3>
									<div className="flex h-4 rounded-full overflow-hidden gap-0.5 mb-3">
										{budgetAreas.map((area) => (
											<div
												key={area.id}
												className="h-full transition-all"
												style={{
													width: `${(area.budgetAmount / totalBudget) * 100}%`,
													backgroundColor: area.color || "#22c55e",
												}}
												title={`${area.name}: ${formatCurrency(area.budgetAmount)}`}
											/>
										))}
									</div>
									<div className="flex flex-wrap gap-3">
										{budgetAreas.map((area) => (
											<div key={area.id} className="flex items-center gap-1.5">
												<div
													className="w-2.5 h-2.5 rounded-full flex-shrink-0"
													style={{ backgroundColor: area.color || "#22c55e" }}
												/>
												<span className="text-xs text-gray-600">
													{area.name} (
													{Math.round((area.budgetAmount / totalBudget) * 100)}
													%)
												</span>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					)}
				</div>
			)}

			{/* ===== TIMELINE TAB ===== */}
			{activeTab === "timeline" && (
				<div>
					{/* Stats */}
					<div className="grid grid-cols-3 gap-3 mb-5">
						<div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
							<p className="text-2xl font-bold text-blue-600">
								{phases.length}
							</p>
							<p className="text-xs text-gray-400 mt-1">שלבים</p>
						</div>
						<div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
							<p className="text-2xl font-bold text-green-600">
								{completedPhases}
							</p>
							<p className="text-xs text-gray-400 mt-1">הושלמו</p>
						</div>
						<div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
							<p className="text-2xl font-bold text-orange-500">
								{avgProgress}%
							</p>
							<p className="text-xs text-gray-400 mt-1">התקדמות</p>
						</div>
					</div>

					{/* Overall progress */}
					{phases.length > 0 && (
						<div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5">
							<div className="flex justify-between text-xs text-gray-500 mb-2">
								<span>התקדמות כוללת</span>
								<span>{avgProgress}%</span>
							</div>
							<div className="w-full bg-gray-100 rounded-full h-3">
								<div
									className={`h-3 rounded-full transition-all ${avgProgress >= 100 ? "bg-green-500" : avgProgress >= 60 ? "bg-blue-500" : "bg-orange-400"}`}
									style={{ width: `${avgProgress}%` }}
								/>
							</div>
						</div>
					)}

					<div className="flex justify-between items-center mb-4">
						<h2 className="font-bold text-gray-900">שלבי הפרוייקט</h2>
						<button
							onClick={() => {
								setEditingPhase(null);
								setPhaseForm({
									name: "",
									startDate: "",
									endDate: "",
									color: PHASE_COLORS[phases.length % PHASE_COLORS.length],
									progress: "0",
									notes: "",
								});
								setShowAddPhase(true);
							}}
							className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
						>
							<svg
								className="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 4v16m8-8H4"
								/>
							</svg>
							הוסף שלב
						</button>
					</div>

					{/* Add/Edit Phase Form */}
					{showAddPhase && (
						<div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5 shadow-sm">
							<h3 className="font-bold text-gray-900 mb-4">
								{editingPhase ? "עריכת שלב" : "שלב חדש"}
							</h3>
							<form onSubmit={submitPhase} className="space-y-3">
								<input
									type="text"
									placeholder="שם השלב (לדוגמה: חפירה, ניקוז, כביש)"
									value={phaseForm.name}
									onChange={(e) =>
										setPhaseForm((f) => ({ ...f, name: e.target.value }))
									}
									className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
									required
								/>
								<div className="grid grid-cols-2 gap-3">
									<div>
										<label className="block text-xs text-gray-500 mb-1">
											תאריך התחלה *
										</label>
										<input
											type="date"
											value={phaseForm.startDate}
											onChange={(e) =>
												setPhaseForm((f) => ({
													...f,
													startDate: e.target.value,
												}))
											}
											className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
											required
										/>
									</div>
									<div>
										<label className="block text-xs text-gray-500 mb-1">
											תאריך סיום *
										</label>
										<input
											type="date"
											value={phaseForm.endDate}
											onChange={(e) =>
												setPhaseForm((f) => ({ ...f, endDate: e.target.value }))
											}
											className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
											required
										/>
									</div>
								</div>
								<div className="grid grid-cols-2 gap-3">
									<div>
										<label className="block text-xs text-gray-500 mb-1">
											% התקדמות
										</label>
										<div className="flex items-center gap-2">
											<input
												type="range"
												min="0"
												max="100"
												step="5"
												value={phaseForm.progress}
												onChange={(e) =>
													setPhaseForm((f) => ({
														...f,
														progress: e.target.value,
													}))
												}
												className="flex-1 accent-green-600"
											/>
											<span className="text-sm font-semibold text-gray-700 w-10 text-center">
												{phaseForm.progress}%
											</span>
										</div>
									</div>
									<div>
										<label className="block text-xs text-gray-500 mb-1">
											הערות
										</label>
										<input
											type="text"
											placeholder="הערה קצרה..."
											value={phaseForm.notes}
											onChange={(e) =>
												setPhaseForm((f) => ({ ...f, notes: e.target.value }))
											}
											className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
										/>
									</div>
								</div>
								<div>
									<label className="block text-xs text-gray-500 mb-2">
										צבע
									</label>
									<div className="flex gap-2 flex-wrap">
										{PHASE_COLORS.map((c) => (
											<button
												key={c}
												type="button"
												onClick={() =>
													setPhaseForm((f) => ({ ...f, color: c }))
												}
												className={`w-7 h-7 rounded-full border-2 transition-all ${phaseForm.color === c ? "border-gray-900 scale-110" : "border-transparent"}`}
												style={{ backgroundColor: c }}
											/>
										))}
									</div>
								</div>
								<div className="flex gap-2 pt-1">
									<button
										type="submit"
										className="bg-green-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
									>
										{editingPhase ? "שמור" : "הוסף"}
									</button>
									<button
										type="button"
										onClick={() => {
											setShowAddPhase(false);
											setEditingPhase(null);
										}}
										className="border border-gray-200 text-gray-600 px-5 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
									>
										ביטול
									</button>
								</div>
							</form>
						</div>
					)}

					{/* Gantt Chart */}
					{phasesLoading ? (
						<div className="text-center py-12 text-gray-400">טוען...</div>
					) : phases.length === 0 ? (
						<div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
							<div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
								<svg
									className="w-6 h-6 text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
									/>
								</svg>
							</div>
							<p className="text-gray-400 text-sm">
								אין שלבים לפרוייקט זה עדיין
							</p>
							<p className="text-gray-300 text-xs mt-1">
								הוסף שלבים כמו: חפירה, ניקוז, כביש, גמר...
							</p>
						</div>
					) : (
						<div className="bg-white rounded-2xl border border-gray-100 p-5">
							<h3 className="font-semibold text-gray-900 mb-5 text-sm flex items-center gap-2">
								<svg
									className="w-4 h-4 text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
									/>
								</svg>
								גאנט — ציר זמן
							</h3>
							<GanttChart
								phases={phases}
								onEdit={openEditPhase}
								onDelete={deletePhase}
								onProgressChange={updatePhaseProgress}
							/>
						</div>
					)}

					{/* Phase list (detailed) */}
					{phases.length > 0 && (
						<div className="mt-4 space-y-2">
							{phases.map((phase) => (
								<div
									key={phase.id}
									className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4"
								>
									<div
										className="w-3 h-3 rounded-full flex-shrink-0"
										style={{ backgroundColor: phase.color || "#22c55e" }}
									/>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 mb-1">
											<p className="font-semibold text-gray-900 text-sm truncate">
												{phase.name}
											</p>
											{phase.progress >= 100 && (
												<span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full font-medium">
													הושלם ✓
												</span>
											)}
										</div>
										<div className="flex items-center gap-3 text-xs text-gray-400">
											<span>
												📅 {formatDate(phase.startDate)} —{" "}
												{formatDate(phase.endDate)}
											</span>
											{phase.notes && <span>• {phase.notes}</span>}
										</div>
										<div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
											<div
												className="h-1.5 rounded-full transition-all"
												style={{
													width: `${phase.progress}%`,
													backgroundColor: phase.color || "#22c55e",
												}}
											/>
										</div>
									</div>
									<div className="text-sm font-bold text-gray-700 flex-shrink-0">
										{phase.progress}%
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
