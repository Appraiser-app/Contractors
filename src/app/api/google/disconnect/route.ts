import { getUser } from "@/lib/auth";
import { clearGoogleRefreshToken } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await clearGoogleRefreshToken(user.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "שגיאה בניתוק" }, { status: 500 });
  }
}
