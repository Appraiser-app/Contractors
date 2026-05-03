import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { saveGoogleRefreshToken } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(`${origin}/tasks?calendar=error`);
  }

  try {
    const user = await getUser();
    if (!user) return NextResponse.redirect(`${origin}/login`);

    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    const redirectUri = `${origin}/api/google/callback`;

    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });

    const tokens = await tokenRes.json();

    if (!tokenRes.ok || !tokens.refresh_token) {
      return NextResponse.redirect(`${origin}/tasks?calendar=error`);
    }

    await saveGoogleRefreshToken(user.id, tokens.refresh_token);

    return NextResponse.redirect(`${origin}/tasks?calendar=connected`);
  } catch {
    return NextResponse.redirect(`${origin}/tasks?calendar=error`);
  }
}
