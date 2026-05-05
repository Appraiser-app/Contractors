import { requireAuth } from "@/lib/auth";
import { createEquipment } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await requireAuth();
    const body = await req.json();
    const { name, type, licensePlate, year, description, status, registeredOwner, registeredAt } = body;
    if (!name) return NextResponse.json({ error: "שם הכלי חובה" }, { status: 400 });
    const eq = await createEquipment({ name, type: type || "TRUCK", licensePlate: licensePlate || null, year: year || null, description: description || null, status: status || "ACTIVE", registeredOwner: registeredOwner || null, registeredAt: registeredAt || null });
    return NextResponse.json(eq, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
