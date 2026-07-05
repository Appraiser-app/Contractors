import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MarketplaceClient from "./MarketplaceClient";

export default async function MarketplacePage() {
  const user = await requireAuth();
  const profile = await prisma.profile.findUnique({ where: { id: user.id } });
  return <MarketplaceClient profile={profile} />;
}
