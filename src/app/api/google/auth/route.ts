import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    await requireAuth();

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json({ error: "GOOGLE_CLIENT_ID לא מוגדר" }, { status: 503 });
    }

    const { origin } = new URL(request.url);
    const redirectUri = `${origin}/api/google/callback`;
    const scopes = ["https://www.googleapis.com/auth/calendar.events"].join(" ");

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: scopes,
      access_type: "offline",
      prompt: "consent",
    });

    return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  } catch {
    return NextResponse.redirect("/tasks?error=auth");
  }
}
