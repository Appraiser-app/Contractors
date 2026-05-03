import { requireAuth } from "@/lib/auth";
import { createEquipmentExpense } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await requireAuth();
    const body = await req.json();
    const { equipmentId, category, amount, description, date, receiptUrl } = body;
    if (!equipmentId || !category || !amount || !description || !date) return NextResponse.json({ error: "שדות חובה חסרים" }, { status: 400 });
    const exp = await createEquipmentExpense({ equipmentId, category, amount, description, date, receiptUrl: receiptUrl || null });
    return NextResponse.json(exp, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
