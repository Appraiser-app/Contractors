import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    if (!siteId) return NextResponse.json({ error: "siteId חסר" }, { status: 400 });

    const phases = await prisma.projectPhase.findMany({
      where: { siteId },
      orderBy: [{ order: "asc" }, { startDate: "asc" }],
    });
    return NextResponse.json(phases);
  } catch {
    return NextResponse.json({ error: "שגיאה" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAuth();
    const body = await request.json();
    const { siteId, name, startDate, endDate, color, progress, notes, order } = body;

    if (!siteId || !name?.trim() || !startDate || !endDate) {
      return NextResponse.json({ error: "שדות חובה חסרים" }, { status: 400 });
    }

    const phase = await prisma.projectPhase.create({
      data: {
        siteId,
        name: name.trim(),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        color: color || null,
        progress: progress ?? 0,
        notes: notes || null,
        order: order ?? 0,
      },
    });
    return NextResponse.json(phase, { status: 201 });
  } catch {
    return NextResponse.json({ error: "שגיאה ביצירה" }, { status: 500 });
  }
}
