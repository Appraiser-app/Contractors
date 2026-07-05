import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const project = await prisma.publicProject.findUnique({ where: { id }, include: { bids: { select: { id: true } } } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const author = await prisma.profile.findUnique({
    where: { id: project.authorId },
    select: { id: true, name: true, avatarUrl: true, businessName: true, rating: true, isVerified: true, zipCode: true },
  });

  // Check if current user has already bid
  const myBid = await prisma.bid.findFirst({ where: { projectId: id, bidderId: user.id } });

  return NextResponse.json({ project: { ...project, author, bidCount: project.bids.length, myBid: myBid || null } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const project = await prisma.publicProject.findUnique({ where: { id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (project.authorId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const updated = await prisma.publicProject.update({ where: { id }, data: body });
  return NextResponse.json({ project: updated });
}
