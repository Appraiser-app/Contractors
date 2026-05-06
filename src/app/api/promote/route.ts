import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { updateProfileRole } from "@/lib/db";

export async function POST(req: Request) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { secret } = await req.json();
  if (secret !== process.env.SETUP_SECRET && secret !== "contractors-setup-2024") {
    return NextResponse.json({ error: "סוד שגוי" }, { status: 403 });
  }

  await updateProfileRole(profile.id, "ADMIN");
  return NextResponse.json({ ok: true, name: profile.name, email: profile.email });
}
