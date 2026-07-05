import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import FeedClient from "./FeedClient";

export default async function FeedPage() {
  const user = await requireAuth();
  const profile = await prisma.profile.findUnique({ where: { id: user.id } });
  return <FeedClient profile={profile} />;
}
