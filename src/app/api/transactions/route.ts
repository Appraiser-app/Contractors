import { getUser } from "@/lib/auth";
import { createNotification, createTransaction, getAllProfiles, getAllTransactions, getProfileById, logActivity } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const transactions = await getAllTransactions();
  return NextResponse.json(transactions);
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { siteId, type, amount, description, category, date, receiptUrl, invoiceStatus } = body;

  if (!siteId || !type || !amount || !description) return NextResponse.json({ error: "שדות חובה חסרים" }, { status: 400 });
  if (!["INCOME", "EXPENSE"].includes(type)) return NextResponse.json({ error: "סוג לא חוקי" }, { status: 400 });

  try {
    const transaction = await createTransaction({
      id: crypto.randomUUID(),
      workSiteId: siteId,
      type,
      amount: Number.parseFloat(amount),
      description,
      category: category || null,
      date: date || new Date().toISOString(),
      receiptUrl: receiptUrl || null,
      invoiceStatus: invoiceStatus || null,
      createdById: user.id,
      approvalStatus: "PENDING",
    });

    const [allProfiles, creator] = await Promise.all([
      getAllProfiles(),
      getProfileById(user.id),
    ]);
    const creatorName = creator?.name || "משתמש";
    const typeLabel = type === "INCOME" ? "הכנסה" : "הוצאה";
    const formattedAmount = new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(Number.parseFloat(amount));

    await Promise.all(
      allProfiles
        .filter(p => p.id !== user.id)
        .map(p =>
          createNotification({
            userId: p.id,
            type: "TRANSACTION_PENDING",
            title: `${typeLabel} חדשה ממתינה לאישור`,
            body: `${creatorName} דיווח על ${typeLabel} של ${formattedAmount}: "${description}"`,
            relatedId: transaction.id,
          })
        )
    );

    logActivity({ userId: user.id, userName: creatorName, userEmail: creator?.email || "", action: `הוסיף ${typeLabel}`, resource: "transaction", resourceId: transaction.id, resourceName: description }).catch(() => {});

    return NextResponse.json(transaction);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
