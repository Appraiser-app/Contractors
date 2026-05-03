import { requireAdmin } from "@/lib/auth";
import { getAllProfiles } from "@/lib/db";
import UserManagement from "@/components/UserManagement";

export default async function UsersPage() {
  await requireAdmin();
  const users = await getAllProfiles();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">ניהול משתמשים</h1>
        <p className="text-gray-500 text-sm mt-1">הוסף משתמשים וקבע הרשאות</p>
      </div>
      <UserManagement users={users} />
    </div>
  );
}
