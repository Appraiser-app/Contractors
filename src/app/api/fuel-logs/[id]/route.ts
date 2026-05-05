import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { deleteFuelLog } from "@/lib/db";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await deleteFuelLog(id);
  return NextResponse.json({ ok: true });
}
