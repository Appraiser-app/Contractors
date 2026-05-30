import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    await requireAuth();
    const doc = await adminDb.collection("settings").doc("whatsappBot").get();
    if (!doc.exists) return NextResponse.json({ configured: false });
    const data = doc.data()!;
    return NextResponse.json({
      configured: true,
      instanceId: data.instanceId,
      apiToken: data.apiToken ? "***" + data.apiToken.slice(-4) : "",
      groupId: data.groupId,
      defaultEntity: data.defaultEntity,
      requireKeyword: data.requireKeyword,
      keyword: data.keyword,
      enabled: data.enabled,
    });
  } catch {
    return NextResponse.json({ error: "שגיאה" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAuth();
    const body = await req.json();
    const { instanceId, apiToken, groupId, defaultEntity, requireKeyword, keyword, enabled } = body;

    if (!instanceId || !apiToken) {
      return NextResponse.json({ error: "Instance ID ו-API Token חובה" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const existing = await adminDb.collection("settings").doc("whatsappBot").get();
    const currentToken = existing.exists ? existing.data()!.apiToken : null;

    await adminDb.collection("settings").doc("whatsappBot").set({
      instanceId: instanceId.trim(),
      apiToken: apiToken === "***" + (currentToken || "").slice(-4) ? currentToken : apiToken.trim(),
      groupId: groupId?.trim() || "",
      defaultEntity: defaultEntity || "חברה של דור",
      requireKeyword: requireKeyword || false,
      keyword: keyword?.trim() || "הוצאה",
      enabled: enabled !== false,
      updatedAt: now,
      createdAt: existing.exists ? existing.data()!.createdAt : now,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "שגיאה בשמירה" }, { status: 500 });
  }
}
