import { getProfile, getUser } from "@/lib/auth";
import { deleteInvitation } from "@/lib/db";
import { adminAuth } from "@/lib/firebase-admin";
import { adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = await getProfile();
  if (!profile || profile.role !== "ADMIN") return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });

  const { id } = await params;

  // Get the invitation to find email
  const invDoc = await adminDb.collection("invitations").doc(id).get();
  if (invDoc.exists) {
    const inv = invDoc.data()!;
    if (inv.status === "PENDING") {
      // Also delete the Firebase Auth user and profile if invitation wasn't accepted
      try {
        const profileSnap = await adminDb.collection("profiles").where("email", "==", inv.email).limit(1).get();
        if (!profileSnap.empty) {
          const profileDoc = profileSnap.docs[0];
          await adminAuth.deleteUser(profileDoc.id);
          await profileDoc.ref.delete();
        }
      } catch {
        // ignore
      }
    }
  }

  await deleteInvitation(id);
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = await getProfile();
  if (!profile || profile.role !== "ADMIN") return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });

  const { id } = await params;
  const invDoc = await adminDb.collection("invitations").doc(id).get();
  if (!invDoc.exists) return NextResponse.json({ error: "הזמנה לא נמצאה" }, { status: 404 });

  const inv = invDoc.data()!;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://contractors.clickclick.cloud";

  const resetLink = await adminAuth.generatePasswordResetLink(inv.email, {
    url: `${appUrl}/login?invited=1`,
  });

  return NextResponse.json({ ok: true, inviteLink: resetLink });
}
