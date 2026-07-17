import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getAllSites,
  getAllTransactions,
  getAllEquipment,
  getAllTasks,
  getAllExpenses,
} from "@/lib/db";

const currency = (n: number) =>
  new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(n);

const EQUIPMENT_TYPE_LABEL: Record<string, string> = {
  TRUCK: "משאית",
  MINI_EXCAVATOR: "מיני מחפרון",
  BOBCAT: "בובקט",
  OTHER: "ציוד",
};

// Case-insensitive substring match against any of the given fields.
function matches(q: string, fields: (string | null | undefined)[]) {
  return fields.some((f) => f != null && f.toLowerCase().includes(q));
}

export async function GET(request: Request) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const raw = searchParams.get("q")?.trim() || "";
    if (raw.length < 2) return NextResponse.json({ results: [] });
    const q = raw.toLowerCase();

    const [sites, transactions, equipment, tasks, expenses] = await Promise.all([
      getAllSites(),
      getAllTransactions(),
      getAllEquipment(),
      getAllTasks(),
      getAllExpenses(),
    ]);

    const results = [
      ...sites
        .filter((s) => matches(q, [s.name, s.location, s.clientName]))
        .slice(0, 5)
        .map((s) => ({
          type: "site" as const,
          id: s.id,
          title: s.name,
          subtitle: s.location || (s.status === "ACTIVE" ? "פעיל" : s.status === "COMPLETED" ? "הושלם" : "מוקפא"),
          href: `/sites/${s.id}`,
        })),
      ...transactions
        .filter((t) => matches(q, [t.description, t.category]))
        .slice(0, 5)
        .map((t) => ({
          type: "transaction" as const,
          id: t.id,
          title: t.description,
          subtitle: `${t.type === "INCOME" ? "הכנסה" : "הוצאה"} · ${currency(t.amount)}${t.workSite?.name ? ` · ${t.workSite.name}` : ""}`,
          href: "/transactions",
        })),
      ...equipment
        .filter((e) => matches(q, [e.name, e.licensePlate, e.description]))
        .slice(0, 5)
        .map((e) => ({
          type: "equipment" as const,
          id: e.id,
          title: e.name,
          subtitle: [EQUIPMENT_TYPE_LABEL[e.type] || "ציוד", e.licensePlate].filter(Boolean).join(" · "),
          href: `/equipment/${e.id}`,
        })),
      ...tasks
        .filter((t) => matches(q, [t.title, t.description]))
        .slice(0, 5)
        .map((t) => ({
          type: "task" as const,
          id: t.id,
          title: t.title,
          subtitle: t.status === "TODO" ? "לביצוע" : t.status === "IN_PROGRESS" ? "בביצוע" : "הושלם",
          href: "/tasks",
        })),
      ...expenses
        .filter((e) => matches(q, [e.description, e.entity, e.category, e.notes]))
        .slice(0, 5)
        .map((e) => ({
          type: "expense" as const,
          id: e.id,
          title: e.description,
          subtitle: `הוצאה · ${currency(e.amount)}${e.entity ? ` · ${e.entity}` : ""}`,
          href: "/expenses",
        })),
    ];

    return NextResponse.json({ results });
  } catch (err) {
    console.error("search error", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
