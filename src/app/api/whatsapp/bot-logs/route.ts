import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    await requireAuth();
    const snapshot = await adminDb
      .collection("whatsappBotLogs")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();
    const logs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json(logs);
  } catch {
    return NextResponse.json({ error: "שגיאה" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await requireAuth();
    const snapshot = await adminDb.collection("whatsappBotLogs").get();
    const batch = adminDb.batch();
    snapshot.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "שגיאה" }, { status: 500 });
  }
}
