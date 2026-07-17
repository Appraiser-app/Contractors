import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const { name, budgetAmount, notes, color } = body;

    const area = await prisma.projectBudgetArea.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(budgetAmount !== undefined && { budgetAmount }),
        ...(notes !== undefined && { notes }),
        ...(color !== undefined && { color }),
      },
    });
    return NextResponse.json(area);
  } catch {
    return NextResponse.json({ error: "שגיאה בעדכון" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    await prisma.projectBudgetArea.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "שגיאה במחיקה" }, { status: 500 });
  }
}
