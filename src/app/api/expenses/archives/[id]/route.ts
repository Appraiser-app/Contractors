import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getExpensesByArchive, getTransactionsByArchive } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const [expenses, transactions] = await Promise.all([
    getExpensesByArchive(id),
    getTransactionsByArchive(id),
  ]);
  return NextResponse.json({ expenses, transactions });
}
