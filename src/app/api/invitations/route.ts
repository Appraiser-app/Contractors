import { NextResponse } from "next/server";
import { getUser, getProfile } from "@/lib/auth";
import { createInvitation, getInvitations, createProfile } from "@/lib/db";
import { adminAuth } from "@/lib/firebase-admin";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = await getProfile();
  if (!profile || profile.role !== "ADMIN") return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });

  const invitations = await getInvitations();
  return NextResponse.json({ invitations });
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = await getProfile();
  if (!profile || profile.role !== "ADMIN") return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });

  const { email, name, role } = await req.json();
  if (!email || !name) return NextResponse.json({ error: "שדות חובה חסרים" }, { status: 400 });

  try {
    // Create Firebase Auth user with a temp random password
    const tempPassword = crypto.randomUUID().replace(/-/g, "").slice(0, 16) + "Aa1!";
    const firebaseUser = await adminAuth.createUser({
      email,
      password: tempPassword,
      displayName: name,
    });

    // Create Firestore profile
    await createProfile({
      id: firebaseUser.uid,
      email,
      name,
      role: role === "ADMIN" ? "ADMIN" : "SECRETARY",
    });

    // Create invitation record
    await createInvitation({
      email,
      name,
      role: role === "ADMIN" ? "ADMIN" : "SECRETARY",
      invitedById: user.id,
    });

    // Generate Firebase password reset link (this is the invite link)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://contractors.clickclick.cloud";
    const resetLink = await adminAuth.generatePasswordResetLink(email, {
      url: `${appUrl}/login?invited=1`,
    });

    return NextResponse.json({ ok: true, inviteLink: resetLink });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("email-already-exists")) {
      return NextResponse.json({ error: "כתובת האימייל הזו כבר רשומה במערכת" }, { status: 409 });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
