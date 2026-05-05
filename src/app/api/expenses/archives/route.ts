import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getAllExpenseArchives } from "@/lib/db";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const archives = await getAllExpenseArchives();
  return NextResponse.json(archives);
}
