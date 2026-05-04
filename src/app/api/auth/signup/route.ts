import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { createProfile, getProfileById } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "חסרים פרטי הרשמה" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "הסיסמה חייבת להכיל לפחות 6 תווים" }, { status: 400 });
    }

    const user = await adminAuth.createUser({ email, password, displayName: name });

    const existing = await getProfileById(user.uid);
    if (!existing) {
      await createProfile({ id: user.uid, email, name, role: "SECRETARY" });
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("email-already-exists")) {
      return NextResponse.json({ error: "כתובת האימייל הזו כבר רשומה במערכת" }, { status: 409 });
    }
    return NextResponse.json({ error: "שגיאה בהרשמה" }, { status: 500 });
  }
}
