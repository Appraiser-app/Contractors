import { requireAuth } from "@/lib/auth";
import { createTask, getTasksBySite } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	try {
		await requireAuth();
		const { searchParams } = new URL(request.url);
		const siteId = searchParams.get("siteId");
		if (!siteId)
			return NextResponse.json({ error: "siteId חסר" }, { status: 400 });

		const tasks = await getTasksBySite(siteId);
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

		const task = await createTask({
			siteId,
			title: title.trim(),
			description: description || null,
			status: "TODO",
			priority: priority || "MEDIUM",
			dueDate: dueDate ? new Date(dueDate).toISOString() : null,
			assignedTo: assignedTo || null,
			createdBy: user.id,
		});
		return NextResponse.json(task, { status: 201 });
	} catch {
		return NextResponse.json({ error: "שגיאה ביצירה" }, { status: 500 });
	}
}
