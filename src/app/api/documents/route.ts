import { requireAuth } from "@/lib/auth";
import { createDocument } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await requireAuth();
    const body = await req.json();
    const { title, type, equipmentId, expiryDate, notes, fileUrl } = body;
    if (!title || !type) return NextResponse.json({ error: "שדות חובה חסרים" }, { status: 400 });
    const doc = await createDocument({ title, type, equipmentId: equipmentId || null, expiryDate: expiryDate || null, notes: notes || null, fileUrl: fileUrl || null });
    return NextResponse.json(doc, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
