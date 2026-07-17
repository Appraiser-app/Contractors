import { requireAdmin } from "@/lib/auth";
import { deleteEquipment, updateEquipment } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const { name, type, licensePlate, year, description, status, registeredOwner, registeredAt, currentMileage, nextServiceMileage, testLastDate, testDate, testCost } = body;
    if (!name) return NextResponse.json({ error: "שם הכלי חובה" }, { status: 400 });
    const eq = await updateEquipment(id, { name, type, licensePlate, year, description, status, registeredOwner: registeredOwner || null, registeredAt: registeredAt || null, currentMileage: currentMileage || null, nextServiceMileage: nextServiceMileage || null, testLastDate: testLastDate || null, testDate: testDate || null, testCost: testCost || null });
    return NextResponse.json(eq);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    await deleteEquipment(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
