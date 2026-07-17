import { getUser } from "@/lib/auth";
import { getNotificationsForUser, getUnreadCount, markAllNotificationsRead, markNotificationRead } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [notifications, unreadCount] = await Promise.all([
    getNotificationsForUser(user.id),
    getUnreadCount(user.id),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, markAll } = await req.json();

  if (markAll) {
    await markAllNotificationsRead(user.id);
  } else if (id) {
    await markNotificationRead(id);
  }

  return NextResponse.json({ ok: true });
}
