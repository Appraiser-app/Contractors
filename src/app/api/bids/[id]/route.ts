import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const bid = await prisma.bid.findUnique({ where: { id }, include: { project: true } });
  if (!bid) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (bid.project.authorId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { status } = await req.json();
  const updated = await prisma.bid.update({ where: { id }, data: { status } });
  return NextResponse.json({ bid: updated });
}
