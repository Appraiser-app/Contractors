import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, getProfile } from "@/lib/auth";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getProfile();
  if (!profile || profile.role !== "ADMIN") {
    return NextResponse.json({ error: "אין הרשאה למחיקה" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.transaction.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
