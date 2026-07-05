import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: projectId } = await params;

  const project = await prisma.publicProject.findUnique({ where: { id: projectId } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (project.authorId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const bids = await prisma.bid.findMany({ where: { projectId }, orderBy: { createdAt: "desc" } });
  const bidderIds = [...new Set(bids.map((b) => b.bidderId))];
  const bidders = await prisma.profile.findMany({
    where: { id: { in: bidderIds } },
    select: { id: true, name: true, avatarUrl: true, trade: true, rating: true, ratingCount: true, isVerified: true },
  });
  const bidderMap = Object.fromEntries(bidders.map((b) => [b.id, b]));
  return NextResponse.json({ bids: bids.map((b) => ({ ...b, bidder: bidderMap[b.bidderId] })) });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: projectId } = await params;

  const project = await prisma.publicProject.findUnique({ where: { id: projectId } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (project.status !== "OPEN") return NextResponse.json({ error: "Project is closed" }, { status: 400 });
  if (project.authorId === user.id) return NextResponse.json({ error: "Cannot bid on own project" }, { status: 400 });

  const { price, availability, notes } = await req.json();
  if (!price) return NextResponse.json({ error: "price required" }, { status: 400 });

  const bid = await prisma.bid.create({ data: { projectId, bidderId: user.id, price, availability: availability || null, notes: notes || null } });
  return NextResponse.json({ bid });
}
