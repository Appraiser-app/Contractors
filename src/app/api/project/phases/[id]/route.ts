import { requireAuth } from "@/lib/auth";
import { deletePhase, updatePhase } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		await requireAuth();
		const { id } = await params;
		const body = await request.json();
		const { name, startDate, endDate, color, progress, notes, order } = body;

		const updates: Record<string, unknown> = {};
		if (name !== undefined) updates.name = name.trim();
		if (startDate !== undefined)
			updates.startDate = new Date(startDate).toISOString();
		if (endDate !== undefined)
			updates.endDate = new Date(endDate).toISOString();
		if (color !== undefined) updates.color = color;
		if (progress !== undefined) updates.progress = progress;
		if (notes !== undefined) updates.notes = notes;
		if (order !== undefined) updates.order = order;

		const phase = await updatePhase(id, updates);
		return NextResponse.json(phase);
	} catch {
		return NextResponse.json({ error: "שגיאה בעדכון" }, { status: 500 });
	}
}

export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		await requireAuth();
		const { id } = await params;
		await deletePhase(id);
		return NextResponse.json({ ok: true });
	} catch {
		return NextResponse.json({ error: "שגיאה במחיקה" }, { status: 500 });
	}
}
