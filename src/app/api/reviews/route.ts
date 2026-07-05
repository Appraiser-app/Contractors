import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const revieweeId = searchParams.get("userId");
  if (!revieweeId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const reviews = await prisma.review.findMany({
    where: { revieweeId },
    orderBy: { createdAt: "desc" },
  });

  const reviewerIds = [...new Set(reviews.map((r) => r.reviewerId))];
  const reviewers = await prisma.profile.findMany({
    where: { id: { in: reviewerIds } },
    select: { id: true, name: true, avatarUrl: true },
  });
  const reviewerMap = Object.fromEntries(reviewers.map((r) => [r.id, r]));

  return NextResponse.json({ reviews: reviews.map((r) => ({ ...r, reviewer: reviewerMap[r.reviewerId] })) });
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { revieweeId, rating, comment, projectId } = await req.json();
  if (!revieweeId || !rating) return NextResponse.json({ error: "revieweeId and rating required" }, { status: 400 });
  if (rating < 1 || rating > 5) return NextResponse.json({ error: "rating must be 1-5" }, { status: 400 });
  if (revieweeId === user.id) return NextResponse.json({ error: "Cannot review yourself" }, { status: 400 });

  const review = await prisma.review.create({
    data: { reviewerId: user.id, revieweeId, rating, comment: comment || null, projectId: projectId || null },
  });

  // Recalculate rating
  const allReviews = await prisma.review.findMany({ where: { revieweeId }, select: { rating: true } });
  const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
  await prisma.profile.update({ where: { id: revieweeId }, data: { rating: avg, ratingCount: allReviews.length } });

  return NextResponse.json({ review });
}
