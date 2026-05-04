import { NextResponse } from "next/server";
import { updateProfileRole, deleteProfile } from "@/lib/db";
import { getUser, getProfile } from "@/lib/auth";
import { adminAuth } from "@/lib/firebase-admin";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getProfile();
  if (!profile || profile.role !== "ADMIN") return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });

  const { id } = await params;
  const { role } = await req.json();

  try {
    await updateProfileRole(id, role === "ADMIN" ? "ADMIN" : "SECRETARY");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getProfile();
  if (!profile || profile.role !== "ADMIN") return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });

  const { id } = await params;

  try {
    await adminAuth.deleteUser(id);
  } catch {
    // ignore if user doesn't exist in Firebase
  }

  try {
    await deleteProfile(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
