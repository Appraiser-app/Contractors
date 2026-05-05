import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createServiceSchedule } from "@/lib/db";

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { equipmentId, name, intervalHours, intervalKm, notes } = body;
  if (!equipmentId || !name) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const schedule = await createServiceSchedule({
    equipmentId,
    name,
    intervalHours: intervalHours ? parseInt(intervalHours) : null,
    intervalKm: intervalKm ? parseInt(intervalKm) : null,
    notes: notes || null,
  });
  return NextResponse.json(schedule, { status: 201 });
}
