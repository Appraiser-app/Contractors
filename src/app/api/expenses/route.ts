import { NextResponse } from "next/server";
import { getAllExpenses, createExpense, logActivity } from "@/lib/db";
import { getUser, getProfile } from "@/lib/auth";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const expenses = await getAllExpenses();
  return NextResponse.json(expenses);
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { entity, amount, description, category, paymentMethod, vatIncluded, expenseType, invoiceUrl, invoiceFileName, date, notes, receiptUrl, receiptFileName } = body;

  if (!entity || !amount || !description || !date) {
    return NextResponse.json({ error: "חסרים שדות חובה" }, { status: 400 });
  }

  const [expense, profile] = await Promise.all([
    createExpense({ entity, amount: parseFloat(amount), description, category: category || null, paymentMethod: paymentMethod || null, vatIncluded: vatIncluded ?? null, expenseType: expenseType || null, invoiceUrl: invoiceUrl || null, invoiceFileName: invoiceFileName || null, date, receiptUrl: receiptUrl || null, receiptFileName: receiptFileName || null, notes: notes || null, createdById: user.id, archiveId: null }),
    getProfile(),
  ]);

  logActivity({ userId: user.id, userName: profile?.name || "משתמש", userEmail: profile?.email || "", action: "הוסיף הוצאה", resource: "expense", resourceId: expense.id, resourceName: description }).catch(() => {});

  return NextResponse.json(expense);
}
