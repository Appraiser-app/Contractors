import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const zipCode = searchParams.get("zipCode");
  const trade = searchParams.get("trade");
  const scope = searchParams.get("scope") || "local"; // local | national
  const cursor = searchParams.get("cursor");
  const limit = 20;

  // Build filter
  const where: Record<string, unknown> = {};
  if (trade) where.trade = trade;
  if (scope === "local" && zipCode) {
    where.zipCode = zipCode;
  }

  const posts = await prisma.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  // Get author names
  const authorIds = [...new Set(posts.map((p) => p.authorId))];
  const authors = await prisma.profile.findMany({
    where: { id: { in: authorIds } },
    select: { id: true, name: true, avatarUrl: true, trade: true, userRole: true, isVerified: true, businessName: true },
  });
  const authorMap = Object.fromEntries(authors.map((a) => [a.id, a]));

  // Get like status for current user
  const postIds = posts.map((p) => p.id);
  const userLikes = await prisma.postLike.findMany({
    where: { userId: user.id, postId: { in: postIds } },
    select: { postId: true },
  });
  const likedSet = new Set(userLikes.map((l) => l.postId));

  const enriched = posts.map((p) => ({
    ...p,
    author: authorMap[p.authorId] || null,
    isLiked: likedSet.has(p.id),
  }));

  return NextResponse.json({ posts: enriched, nextCursor: posts.length === limit ? posts[posts.length - 1].id : null });
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { content, imageUrls, trade, zipCode } = body;

  if (!content && (!imageUrls || imageUrls.length === 0)) {
    return NextResponse.json({ error: "Content or images required" }, { status: 400 });
  }

  const post = await prisma.post.create({
    data: { authorId: user.id, content: content || null, imageUrls: imageUrls || [], trade: trade || null, zipCode: zipCode || null },
  });

  return NextResponse.json({ post });
}
