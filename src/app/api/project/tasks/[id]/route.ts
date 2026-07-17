import { getApiUser } from "@/lib/auth";
import { deleteTask, updateTask } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const user = await getApiUser();
		if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
		const { id } = await params;
		const body = await request.json();
		const { title, description, status, priority, dueDate, assignedTo } = body;

		const updates: Record<string, unknown> = {};
		if (title !== undefined) updates.title = title.trim();
		if (description !== undefined) updates.description = description || null;
		if (status !== undefined) updates.status = status;
		if (priority !== undefined) updates.priority = priority;
		if (dueDate !== undefined)
			updates.dueDate = dueDate ? new Date(dueDate).toISOString() : null;
		if (assignedTo !== undefined) updates.assignedTo = assignedTo || null;

		await updateTask(id, updates);
		return NextResponse.json({ ok: true });
	} catch (e) {
		console.error("PATCH /api/project/tasks/[id] failed:", e);
		return NextResponse.json({ error: "שגיאה בעדכון" }, { status: 500 });
	}
}

export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const user = await getApiUser();
		if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
		const { id } = await params;
		await deleteTask(id);
		return NextResponse.json({ ok: true });
	} catch (e) {
		console.error("DELETE /api/project/tasks/[id] failed:", e);
		return NextResponse.json({ error: "שגיאה במחיקה" }, { status: 500 });
	}
}
