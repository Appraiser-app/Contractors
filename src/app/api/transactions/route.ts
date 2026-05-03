import { NextResponse } from "next/server";
import { createTransaction } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { siteId, type, amount, description, category, date } = body;

  if (!siteId || !type || !amount || !description) return NextResponse.json({ error: "שדות חובה חסרים" }, { status: 400 });
  if (!["INCOME", "EXPENSE"].includes(type)) return NextResponse.json({ error: "סוג לא חוקי" }, { status: 400 });

  try {
    const transaction = await createTransaction({
      id: crypto.randomUUID(),
      workSiteId: siteId,
      type,
      amount: parseFloat(amount),
      description,
      category: category || null,
      date: date || new Date().toISOString(),
    });
    return NextResponse.json(transaction);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
