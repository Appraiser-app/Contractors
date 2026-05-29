import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    if (!siteId) return NextResponse.json({ error: "siteId חסר" }, { status: 400 });

    const tasks = await prisma.task.findMany({
      where: { siteId },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(tasks);
  } catch {
    return NextResponse.json({ error: "שגיאה" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { siteId, title, description, priority, dueDate, assignedTo } = body;

    if (!siteId || !title?.trim()) {
      return NextResponse.json({ error: "שדות חובה חסרים" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        siteId,
        title: title.trim(),
        description: description || null,
        status: "TODO",
        priority: priority || "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
        assignedTo: assignedTo || null,
        createdBy: user.id,
      },
    });
    return NextResponse.json(task, { status: 201 });
  } catch {
    return NextResponse.json({ error: "שגיאה ביצירה" }, { status: 500 });
  }
}
