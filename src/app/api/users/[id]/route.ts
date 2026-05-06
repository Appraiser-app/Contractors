import { NextResponse } from "next/server";
import { updateProfileRole, updateProfileActive, updateProfilePermissions, deleteProfile, getProfileById, UserRole, UserPermissions } from "@/lib/db";
import { getUser, getProfile } from "@/lib/auth";
import { adminAuth } from "@/lib/firebase-admin";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getProfile();
  if (!profile || profile.role !== "ADMIN") return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });

  const { id } = await params;

  // Protect super admin from demotion (only super admin can demote themselves)
  const target = await getProfileById(id);
  if (target?.isSuperAdmin && !profile.isSuperAdmin) {
    return NextResponse.json({ error: "לא ניתן לשנות הרשאות המנהל הראשי" }, { status: 403 });
  }

  const body = await req.json();

  try {
    if ("isActive" in body) {
      await updateProfileActive(id, Boolean(body.isActive));
    } else if ("permissions" in body) {
      await updateProfilePermissions(id, body.permissions as UserPermissions);
    } else {
      const { role } = body;
      const validRoles: UserRole[] = ["ADMIN", "MANAGER", "SECRETARY"];
      const safeRole: UserRole = validRoles.includes(role) ? role : "SECRETARY";
      await updateProfileRole(id, safeRole);
    }
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

  // Protect super admin from deletion
  const target = await getProfileById(id);
  if (target?.isSuperAdmin) {
    return NextResponse.json({ error: "לא ניתן למחוק את המנהל הראשי" }, { status: 403 });
  }

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
