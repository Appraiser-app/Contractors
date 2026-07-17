import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    if (!siteId) return NextResponse.json({ error: "siteId חסר" }, { status: 400 });

    const areas = await prisma.projectBudgetArea.findMany({
      where: { siteId },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(areas);
  } catch {
    return NextResponse.json({ error: "שגיאה" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAuth();
    const body = await request.json();
    const { siteId, name, budgetAmount, notes, color } = body;

    if (!siteId || !name?.trim()) {
      return NextResponse.json({ error: "שדות חובה חסרים" }, { status: 400 });
    }

    const area = await prisma.projectBudgetArea.create({
      data: {
        siteId,
        name: name.trim(),
        budgetAmount: budgetAmount || 0,
        notes: notes || null,
        color: color || null,
      },
    });
    return NextResponse.json(area, { status: 201 });
  } catch {
    return NextResponse.json({ error: "שגיאה ביצירה" }, { status: 500 });
  }
}
