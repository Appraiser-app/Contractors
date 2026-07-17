import { createProfile, getProfileById } from "@/lib/db";
import { adminAuth } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { idToken, name, email } = await request.json();
    if (!idToken) return NextResponse.json({ error: "Missing token" }, { status: 400 });

    const decoded = await adminAuth.verifyIdToken(idToken);
    const existing = await getProfileById(decoded.uid);
    if (!existing) {
      await createProfile({
        id: decoded.uid,
        email: email || decoded.email || "",
        name: name || decoded.name || email || "משתמש",
        role: "SECRETARY",
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Google profile creation failed:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
