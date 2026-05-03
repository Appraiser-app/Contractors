import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, getProfile } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getProfile();
  if (!profile || profile.role !== "ADMIN") {
    return NextResponse.json({ error: "אין הרשאה לעריכה" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { name, location, description, clientName, contractValue, status, startDate, endDate } = body;

  const site = await prisma.workSite.update({
    where: { id },
    data: {
      name,
      location: location || null,
      description: description || null,
      clientName: clientName || null,
      contractValue: contractValue || null,
      status,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    },
  });

  return NextResponse.json(site);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getProfile();
  if (!profile || profile.role !== "ADMIN") {
    return NextResponse.json({ error: "אין הרשאה למחיקה" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.workSite.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
