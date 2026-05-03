import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { siteId, type, amount, description, category, date } = body;

  if (!siteId || !type || !amount || !description) {
    return NextResponse.json({ error: "שדות חובה חסרים" }, { status: 400 });
  }

  if (!["INCOME", "EXPENSE"].includes(type)) {
    return NextResponse.json({ error: "סוג לא חוקי" }, { status: 400 });
  }

  const transaction = await prisma.transaction.create({
    data: {
      workSiteId: siteId,
      type,
      amount: parseFloat(amount),
      description,
      category: category || null,
      date: date ? new Date(date) : new Date(),
    },
  });

  return NextResponse.json(transaction);
}
