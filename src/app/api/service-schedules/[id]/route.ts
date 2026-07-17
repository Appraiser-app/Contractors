import { getUser } from "@/lib/auth";
import { deleteServiceSchedule } from "@/lib/db";
import { type NextRequest, NextResponse } from "next/server";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await deleteServiceSchedule(id);
  return NextResponse.json({ ok: true });
}
