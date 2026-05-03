import { requireAuth } from "@/lib/auth";
import { createInsurance } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await requireAuth();
    const body = await req.json();
    const { equipmentId, type, company, policyNumber, startDate, endDate, cost, isPaid } = body;
    if (!equipmentId || !type || !endDate) return NextResponse.json({ error: "שדות חובה חסרים" }, { status: 400 });
    const ins = await createInsurance({ equipmentId, type, company, policyNumber, startDate, endDate, cost: cost || 0, isPaid: isPaid || false });
    return NextResponse.json(ins, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
