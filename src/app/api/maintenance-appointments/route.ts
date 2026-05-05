import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getAllMaintenanceAppointments, createMaintenanceAppointment } from "@/lib/db";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await getAllMaintenanceAppointments());
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { equipmentId, equipmentName, description, scheduledDate, estimatedCost, notes } = body;
  if (!equipmentId || !equipmentName || !description || !scheduledDate)
    return NextResponse.json({ error: "שדות חובה חסרים" }, { status: 400 });
  const appt = await createMaintenanceAppointment({
    equipmentId, equipmentName, description, scheduledDate,
    estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
    notes: notes || null, status: "PENDING",
  });
  return NextResponse.json(appt, { status: 201 });
}
