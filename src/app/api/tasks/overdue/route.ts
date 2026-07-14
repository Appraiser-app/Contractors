import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getAllTasks } from "@/lib/db";

export async function GET() {
  try {
    await requireAuth();
    const all = await getAllTasks();
    const now = new Date();
    const overdue = all.filter((t) => {
      if (t.status === "DONE") return false;
      if (!t.dueDate) return false;
      return new Date(t.dueDate) < now;
    });
    return NextResponse.json({ count: overdue.length, tasks: overdue });
  } catch {
    return NextResponse.json({ count: 0, tasks: [] }, { status: 401 });
  }
}
