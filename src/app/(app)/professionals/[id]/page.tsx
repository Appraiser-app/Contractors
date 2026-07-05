import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProfessionalProfileClient from "./ProfessionalProfileClient";

export default async function ProfessionalProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireAuth();
  const profile = await prisma.profile.findUnique({
    where: { id },
    select: {
      id: true, name: true, businessName: true, avatarUrl: true, trade: true,
      userRole: true, zipCode: true, rating: true, ratingCount: true,
      isVerified: true, bio: true, serviceRadius: true, website: true, phone: true, createdAt: true,
    },
  });
  if (!profile) notFound();

  const rawPosts = await prisma.post.findMany({ where: { authorId: id }, orderBy: { createdAt: "desc" }, take: 12 });
  const rawReviews = await prisma.review.findMany({ where: { revieweeId: id }, orderBy: { createdAt: "desc" }, take: 10 });
  const reviewerIds = [...new Set(rawReviews.map(r => r.reviewerId))];
  const reviewers = await prisma.profile.findMany({ where: { id: { in: reviewerIds } }, select: { id: true, name: true, avatarUrl: true } });
  const reviewerMap = Object.fromEntries(reviewers.map(r => [r.id, r]));

  // serialize dates to strings for client component
  const posts = rawPosts.map(p => ({ ...p, createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString() }));
  const enrichedReviews = rawReviews.map(r => ({ ...r, createdAt: r.createdAt.toISOString(), reviewer: reviewerMap[r.reviewerId] ?? null }));

  return <ProfessionalProfileClient profile={profile} posts={posts} reviews={enrichedReviews} isOwnProfile={user.id === id} currentUserId={user.id} />;
}
