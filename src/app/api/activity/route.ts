import { getProfile } from "@/lib/auth";
import { getRecentActivities, getUserActivities } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const profile = await getProfile();
  if (!profile || profile.role !== "ADMIN") return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const limit = Number.parseInt(searchParams.get("limit") || "100");

  const activities = userId
    ? await getUserActivities(userId, limit)
    : await getRecentActivities(limit);

  return NextResponse.json(activities);
}
