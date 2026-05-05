import { NextResponse } from "next/server";
import { getAllExpenses, createExpense } from "@/lib/db";
import { getUser } from "@/lib/auth";

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
  const { entity, amount, description, category, paymentMethod, vatIncluded, expenseType, invoiceUrl, date, notes, receiptUrl } = body;

  if (!entity || !amount || !description || !date) {
    return NextResponse.json({ error: "חסרים שדות חובה" }, { status: 400 });
  }

  const expense = await createExpense({
    entity,
    amount: parseFloat(amount),
    description,
    category: category || null,
    paymentMethod: paymentMethod || null,
    vatIncluded: vatIncluded ?? null,
    expenseType: expenseType || null,
    invoiceUrl: invoiceUrl || null,
    date,
    receiptUrl: receiptUrl || null,
    notes: notes || null,
    createdById: user.id,
  });

  return NextResponse.json(expense);
}
