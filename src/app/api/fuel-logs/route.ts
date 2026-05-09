import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createFuelLog } from "@/lib/db";

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
      liters: parseFloat(liters),
      pricePerLiter: parseFloat(pricePerLiter),
      totalCost: parseFloat(totalCost),
      workSiteId: workSiteId || null,
      mileage: mileage ? parseInt(mileage) : null,
      notes: notes || null,
    });
    return NextResponse.json(log, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
