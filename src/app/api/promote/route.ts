import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { updateProfileRole, getAllProfiles } from "@/lib/db";

const SETUP_SECRET = "contractors-setup-2024";

export async function POST(req: Request) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { secret } = await req.json();
  if (secret !== SETUP_SECRET) {
    return NextResponse.json({ error: "סוד שגוי" }, { status: 403 });
  }

  // Allow promotion if: no admins exist yet, OR caller is already admin
  const allProfiles = await getAllProfiles();
  const adminExists = allProfiles.some((p: { role: string }) => p.role === "ADMIN");
  if (adminExists && profile.role !== "ADMIN") {
    return NextResponse.json({ error: "כבר קיים מנהל מערכת. פנה אליו לקבלת הרשאות." }, { status: 403 });
  }

  await updateProfileRole(profile.id, "ADMIN");
  return NextResponse.json({ ok: true, name: profile.name, email: profile.email });
}
