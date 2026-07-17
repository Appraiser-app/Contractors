import { requireAuth } from "@/lib/auth";
import { deleteBudgetArea, updateBudgetArea } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		await requireAuth();
		const { id } = await params;
		const body = await request.json();
		const { name, budgetAmount, notes, color } = body;

		const updates: Record<string, unknown> = {};
		if (name !== undefined) updates.name = name.trim();
		if (budgetAmount !== undefined) updates.budgetAmount = budgetAmount;
		if (notes !== undefined) updates.notes = notes;
		if (color !== undefined) updates.color = color;

		const area = await updateBudgetArea(id, updates);
		return NextResponse.json(area);
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
		await deleteBudgetArea(id);
		return NextResponse.json({ ok: true });
	} catch {
		return NextResponse.json({ error: "שגיאה במחיקה" }, { status: 500 });
	}
}
