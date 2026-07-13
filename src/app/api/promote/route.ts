import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { updateProfileRole } from "@/lib/db";

export async function POST(req: Request) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only existing admins can promote
  if (profile.role !== "ADMIN") {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const { secret } = await req.json();
  if (!process.env.SETUP_SECRET || secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: "סוד שגוי" }, { status: 403 });
  }

  await updateProfileRole(profile.id, "ADMIN");
  return NextResponse.json({ ok: true, name: profile.name, email: profile.email });
}
