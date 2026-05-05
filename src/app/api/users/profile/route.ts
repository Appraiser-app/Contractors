import { NextResponse } from "next/server";
import { updateProfileName } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function PATCH(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "שם לא יכול להיות ריק" }, { status: 400 });

  await updateProfileName(user.id, name.trim());
  return NextResponse.json({ ok: true });
}
