import { getUser } from "@/lib/auth";
import { createFuelLog } from "@/lib/db";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { equipmentId, date, liters, pricePerLiter, totalCost, workSiteId, mileage, notes } = body;
  if (!equipmentId || !date || !liters || !pricePerLiter || !totalCost) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const log = await createFuelLog({
      equipmentId,
      date,
      liters: Number.parseFloat(liters),
      pricePerLiter: Number.parseFloat(pricePerLiter),
      totalCost: Number.parseFloat(totalCost),
      workSiteId: workSiteId || null,
      mileage: mileage ? Number.parseInt(mileage) : null,
      notes: notes || null,
    });
    return NextResponse.json(log, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
