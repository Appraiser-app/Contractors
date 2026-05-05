import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { updateMaintenanceAppointment, deleteMaintenanceAppointment } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  await updateMaintenanceAppointment(id, body);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await deleteMaintenanceAppointment(id);
  return NextResponse.json({ ok: true });
}
