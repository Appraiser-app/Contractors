import { NextResponse } from "next/server";
import { deleteExpense, logActivity } from "@/lib/db";
import { getUser, getProfile } from "@/lib/auth";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const profile = await getProfile();
  await deleteExpense(id);
  logActivity({ userId: user.id, userName: profile?.name || "משתמש", userEmail: profile?.email || "", action: "מחק הוצאה", resource: "expense", resourceId: id }).catch(() => {});
  return NextResponse.json({ ok: true });
}
