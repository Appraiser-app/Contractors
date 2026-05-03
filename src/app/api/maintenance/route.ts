import { requireAuth } from "@/lib/auth";
import { createMaintenance } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await requireAuth();
    const body = await req.json();
    const { equipmentId, description, cost, date, mileage, notes } = body;
    if (!equipmentId || !description || !date) return NextResponse.json({ error: "שדות חובה חסרים" }, { status: 400 });
    const rec = await createMaintenance({ equipmentId, description, cost, date, mileage, notes });
    return NextResponse.json(rec, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
