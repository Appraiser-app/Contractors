import { getProfile } from "@/lib/auth";
import { getSuperAdmin, setSuperAdmin } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST() {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (profile.role !== "ADMIN") return NextResponse.json({ error: "נדרשת הרשאת מנהל" }, { status: 403 });

  const existing = await getSuperAdmin();
  // Only allow if no super admin exists, or if the caller is already super admin
  if (existing && existing.id !== profile.id) {
    return NextResponse.json({ error: "כבר קיים מנהל ראשי במערכת" }, { status: 409 });
  }

  await setSuperAdmin(profile.id);
  return NextResponse.json({ ok: true });
}
