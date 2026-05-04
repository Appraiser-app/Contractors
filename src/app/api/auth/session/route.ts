import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { cookies } from "next/headers";

const SESSION_DURATION = 60 * 60 * 24 * 14 * 1000; // 14 days

export async function POST(req: Request) {
  const { idToken } = await req.json();
  if (!idToken) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  try {
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: SESSION_DURATION });
    const cookieStore = await cookies();
    cookieStore.set("__session", sessionCookie, {
      maxAge: SESSION_DURATION / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Session creation failed:", msg);
    return NextResponse.json({ error: "Invalid token", detail: msg }, { status: 401 });
  }
}
