import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MessagesClient from "./MessagesClient";

export default async function MessagesPage() {
  const user = await requireAuth();
  const profile = await prisma.profile.findUnique({ where: { id: user.id } });
  return <MessagesClient currentUserId={user.id} currentUserName={profile?.name || ""} />;
}
