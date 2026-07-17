import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    const transactions = await prisma.transaction.findMany({
      where: { workSiteId: id },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(transactions);
  } catch {
    return NextResponse.json({ error: "שגיאה" }, { status: 500 });
  }
}
