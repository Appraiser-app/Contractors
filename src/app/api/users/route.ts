import { NextResponse } from "next/server";
import { createProfile } from "@/lib/db";
import { getUser, getProfile } from "@/lib/auth";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getProfile();
  if (!profile || profile.role !== "ADMIN") return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });

  const { email, name, password, role } = await req.json();
  if (!email || !name || !password) return NextResponse.json({ error: "שדות חובה חסרים" }, { status: 400 });

  try {
    const firebaseUser = await adminAuth.createUser({ email, password, displayName: name });
    await createProfile({
      id: firebaseUser.uid,
      email,
      name,
      role: role === "ADMIN" ? "ADMIN" : "SECRETARY",
    });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("email-already-exists")) {
      return NextResponse.json({ error: "כתובת האימייל הזו כבר רשומה במערכת" }, { status: 409 });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
