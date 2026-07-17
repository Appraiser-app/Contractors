import { getUser } from "@/lib/auth";
import { createSubscription, getAllSubscriptions } from "@/lib/db";
import { type NextRequest, NextResponse } from "next/server";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await getAllSubscriptions());
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { name, type, provider, amount, billingCycle, startDate, nextRenewal, notes, equipmentId, equipmentName } = body;
  if (!name || !type || !amount || !billingCycle || !nextRenewal)
    return NextResponse.json({ error: "שדות חובה חסרים" }, { status: 400 });
  const sub = await createSubscription({
    name, type, provider: provider || null,
    amount: Number.parseFloat(amount), billingCycle,
    startDate: startDate || null, nextRenewal,
    notes: notes || null, isActive: true,
    equipmentId: equipmentId || null, equipmentName: equipmentName || null,
  });
  return NextResponse.json(sub, { status: 201 });
}
