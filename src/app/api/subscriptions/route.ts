import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getAllSubscriptions, createSubscription } from "@/lib/db";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await getAllSubscriptions());
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { name, type, provider, amount, billingCycle, nextRenewal, notes, equipmentId, equipmentName } = body;
  if (!name || !type || !amount || !billingCycle || !nextRenewal)
    return NextResponse.json({ error: "שדות חובה חסרים" }, { status: 400 });
  const sub = await createSubscription({
    name, type, provider: provider || null,
    amount: parseFloat(amount), billingCycle, nextRenewal,
    notes: notes || null, isActive: true,
    equipmentId: equipmentId || null, equipmentName: equipmentName || null,
  });
  return NextResponse.json(sub, { status: 201 });
}
