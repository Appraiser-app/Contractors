import { requireAuth, getProfile } from "@/lib/auth";
import { getSuperAdmin } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const user = await requireAuth();
  const profile = await getProfile();
  if (!profile) return null;

  const superAdmin = await getSuperAdmin();
  const hasSuperAdmin = !!superAdmin;
  const isSuperAdmin = profile.isSuperAdmin === true;

  // Load BuildersBooks fields from Prisma
  const bbProfile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { userRole: true, zipCode: true, trade: true, bio: true, businessName: true, website: true, phone: true, serviceRadius: true },
  });

  const merged = { ...profile, ...bbProfile };

  return <ProfileClient profile={merged} hasSuperAdmin={hasSuperAdmin} isSuperAdmin={isSuperAdmin} />;
}
