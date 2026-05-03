import { NextResponse } from "next/server";
import { getAllTasks, createTask } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    await requireAuth();
    const tasks = await getAllTasks();
    return NextResponse.json(tasks);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAuth();
    const body = await request.json();
    const { title, description, priority, dueDate, assignedTo, siteId, createdBy } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "כותרת המשימה חסרה" }, { status: 400 });
    }

    const task = await createTask({
      title: title.trim(),
      description: description?.trim() || null,
      status: "TODO",
      priority: priority || "MEDIUM",
      dueDate: dueDate || null,
      assignedTo: assignedTo || null,
      siteId: siteId || null,
      createdBy: createdBy || null,
    });

    return NextResponse.json(task, { status: 201 });
  } catch {
    return NextResponse.json({ error: "שגיאה ביצירת משימה" }, { status: 500 });
  }
}
