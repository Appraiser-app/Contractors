import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const trade = searchParams.get("trade");
  const zipCode = searchParams.get("zipCode");
  const status = searchParams.get("status") || "OPEN";

  const where: Record<string, unknown> = { status };
  if (trade) where.trade = trade;
  if (zipCode) where.zipCode = zipCode;

  const projects = await prisma.publicProject.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { bids: { select: { id: true } } },
  });

  const authorIds = [...new Set(projects.map((p) => p.authorId))];
  const authors = await prisma.profile.findMany({
    where: { id: { in: authorIds } },
    select: { id: true, name: true, avatarUrl: true, businessName: true, rating: true, isVerified: true },
  });
  const authorMap = Object.fromEntries(authors.map((a) => [a.id, a]));

  return NextResponse.json({
    projects: projects.map((p) => ({ ...p, author: authorMap[p.authorId], bidCount: p.bids.length })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, description, trade, zipCode, budget, timeline } = body;
  if (!title || !trade || !zipCode) return NextResponse.json({ error: "title, trade, zipCode required" }, { status: 400 });

  const project = await prisma.publicProject.create({
    data: { authorId: user.id, title, description: description || null, trade, zipCode, budget: budget || null, timeline: timeline || null },
  });

  return NextResponse.json({ project });
}
