import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { archiveCurrentExpenses } from "@/lib/db";

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, notes } = body;
  if (!name?.trim()) return NextResponse.json({ error: "נדרש שם לארכיון" }, { status: 400 });

  try {
    const archive = await archiveCurrentExpenses(name.trim(), notes || null);
    return NextResponse.json(archive, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "שגיאה בארכיון" }, { status: 400 });
  }
}
