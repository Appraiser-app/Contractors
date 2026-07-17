import { getProfile } from "@/lib/auth";
import { getProfileById } from "@/lib/db";
import { adminAuth } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getProfile();
  if (!profile || profile.role !== "ADMIN") return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });

  const { id } = await params;
  const target = await getProfileById(id);
  if (!target) return NextResponse.json({ error: "משתמש לא נמצא" }, { status: 404 });

  try {
    const link = await adminAuth.generatePasswordResetLink(target.email);
    return NextResponse.json({ link });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
