import LeftPanel from "@/components/LeftPanel";
import RealtimeUpdater from "@/components/RealtimeUpdater";
import TopNav from "@/components/TopNav";
import { requireAuth } from "@/lib/auth";
import { getProfileById } from "@/lib/db";
import { prisma } from "@/lib/prisma";

export default async function AppLayout({
	children,
}: { children: React.ReactNode }) {
	const user = await requireAuth();
	const [fsProfile, dbProfile] = await Promise.all([
		getProfileById(user.id),
		prisma.profile.findUnique({
			where: { id: user.id },
			select: { avatarUrl: true, trade: true, userRole: true },
		}),
	]);

	const profile = fsProfile ? { ...fsProfile, ...dbProfile } : null;

	return (
		<div className="min-h-screen bg-[#F0F2F5]" dir="rtl">
			<TopNav profile={profile} />
			<div className="flex pt-14 pb-16 lg:pb-0">
				<LeftPanel profile={profile} />
				<main className="flex-1 min-w-0 overflow-auto">{children}</main>
			</div>
			<RealtimeUpdater />
		</div>
	);
}
