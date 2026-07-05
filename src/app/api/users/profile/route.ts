import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = await prisma.profile.findUnique({ where: { id: user.id } });
  return NextResponse.json({ profile });
}

export async function PATCH(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const allowed = ["name", "userRole", "zipCode", "trade", "bio", "avatarUrl", "phone", "businessName", "website", "serviceRadius", "language"];
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  if (Object.keys(data).length === 0) return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  if ("name" in data && !String(data.name).trim()) return NextResponse.json({ error: "שם לא יכול להיות ריק" }, { status: 400 });

  // upsert because new users may not have a Prisma Profile row yet
  const profile = await prisma.profile.upsert({
    where: { id: user.id },
    update: data,
    create: { id: user.id, email: user.email, name: (data.name as string) || user.email, ...data },
  });
  return NextResponse.json({ profile });
}
