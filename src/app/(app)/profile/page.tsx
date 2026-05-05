import { requireAuth, getProfile } from "@/lib/auth";
import { getSuperAdmin } from "@/lib/db";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  await requireAuth();
  const profile = await getProfile();
  if (!profile) return null;

  const superAdmin = await getSuperAdmin();
  const hasSuperAdmin = !!superAdmin;
  const isSuperAdmin = profile.isSuperAdmin === true;

  return <ProfileClient profile={profile} hasSuperAdmin={hasSuperAdmin} isSuperAdmin={isSuperAdmin} />;
}
