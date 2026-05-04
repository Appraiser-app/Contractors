import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { approveTransaction, rejectTransaction, getProfileById, getAllProfiles, createNotification, getNotificationsForUser } from "@/lib/db";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { transactionId, action } = await req.json();
  if (!transactionId || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "נתונים חסרים" }, { status: 400 });
  }

  const { data: tx } = await db.from("Transaction").select("*, workSite:WorkSite(name)").eq("id", transactionId).single();
  if (!tx) return NextResponse.json({ error: "תנועה לא נמצאה" }, { status: 404 });
  if (tx.createdById === user.id) return NextResponse.json({ error: "לא ניתן לאשר תנועה שיצרת בעצמך" }, { status: 403 });

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
