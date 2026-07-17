import { getApiUser } from "@/lib/auth";
import { createTask, getTasksBySite } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	try {
		const user = await getApiUser();
		if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
		const { searchParams } = new URL(request.url);
		const siteId = searchParams.get("siteId");
		if (!siteId)
			return NextResponse.json({ error: "siteId חסר" }, { status: 400 });

		const tasks = await getTasksBySite(siteId);
		return NextResponse.json(tasks);
	} catch (e) {
		console.error("GET /api/project/tasks failed:", e);
		return NextResponse.json({ error: "שגיאה" }, { status: 500 });
	}
}

export async function POST(request: Request) {
	try {
		const user = await getApiUser();
		if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
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
	} catch (e) {
		console.error("POST /api/project/tasks failed:", e);
		return NextResponse.json({ error: "שגיאה ביצירה" }, { status: 500 });
	}
}
