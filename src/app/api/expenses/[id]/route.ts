import { NextResponse } from "next/server";
import { deleteExpense } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await deleteExpense(id);
  return NextResponse.json({ ok: true });
}
