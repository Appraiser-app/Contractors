import { requireAuth } from "@/lib/auth";
import { getProfileById } from "@/lib/db";
import Sidebar from "@/components/Sidebar";
import RealtimeUpdater from "@/components/RealtimeUpdater";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();
  const profile = await getProfileById(user.id);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar profile={profile} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      <RealtimeUpdater />
    </div>
  );
}
