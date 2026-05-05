import { requireAdmin } from "@/lib/auth";
import { getAllProfiles } from "@/lib/db";
import UserManagement from "@/components/UserManagement";

export default async function UsersPage() {
  const currentUser = await requireAdmin();
  const users = await getAllProfiles();

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <UserManagement users={users} currentUserId={currentUser.id} />
    </div>
  );
}
