import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getProfileById } from "@/lib/db";

export async function GET() {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ connected: false });
    const profile = await getProfileById(user.id);
    return NextResponse.json({ connected: !!profile?.googleRefreshToken });
  } catch {
    return NextResponse.json({ connected: false });
  }
}
