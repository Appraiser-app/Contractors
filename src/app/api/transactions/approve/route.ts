import { NextResponse } from "next/server";
import { getUser, getProfile } from "@/lib/auth";
import { approveTransaction, rejectTransaction, getProfileById, createNotification } from "@/lib/db";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only ADMIN or MANAGER can approve/reject transactions
  const currentProfile = await getProfile();
  if (!currentProfile || !["ADMIN", "MANAGER"].includes(currentProfile.role)) {
    return NextResponse.json({ error: "נדרשת הרשאת מנהל לאישור תנועות" }, { status: 403 });
  }

  const { transactionId, action } = await req.json();
  if (!transactionId || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "נתונים חסרים" }, { status: 400 });
  }

  const txDoc = await adminDb.collection("transactions").doc(transactionId).get();
  if (!txDoc.exists) return NextResponse.json({ error: "תנועה לא נמצאה" }, { status: 404 });
  const tx = txDoc.data()!;

  if (tx.createdById === user.id) {
    return NextResponse.json({ error: "לא ניתן לאשר תנועה שיצרת בעצמך" }, { status: 403 });
  }

  const approver = await getProfileById(user.id);
  const approverName = approver?.name || "משתמש";

  if (action === "approve") {
    await approveTransaction(transactionId, user.id);
  } else {
    await rejectTransaction(transactionId, user.id);
  }

  // Notify the creator
  if (tx.createdById) {
    const typeLabel = tx.type === "INCOME" ? "הכנסה" : "הוצאה";
    const actionLabel = action === "approve" ? "אושרה" : "נדחתה";
    await createNotification({
      userId: tx.createdById,
      type: action === "approve" ? "TRANSACTION_APPROVED" : "TRANSACTION_REJECTED",
      title: `${typeLabel} ${actionLabel}`,
      body: `"${tx.description}" (${new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(tx.amount)}) ${actionLabel} על ידי ${approverName}`,
      relatedId: transactionId,
    });
  }

  return NextResponse.json({ ok: true });
}
