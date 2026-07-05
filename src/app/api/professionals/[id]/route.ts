import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const profile = await prisma.profile.findUnique({
    where: { id },
    select: {
      id: true, name: true, businessName: true, avatarUrl: true, trade: true,
      userRole: true, zipCode: true, rating: true, ratingCount: true,
      isVerified: true, bio: true, serviceRadius: true, website: true, phone: true,
      createdAt: true,
    },
  });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const posts = await prisma.post.findMany({ where: { authorId: id }, orderBy: { createdAt: "desc" }, take: 12 });
  const reviews = await prisma.review.findMany({ where: { revieweeId: id }, orderBy: { createdAt: "desc" }, take: 5 });

  return NextResponse.json({ profile, posts, reviews });
}
