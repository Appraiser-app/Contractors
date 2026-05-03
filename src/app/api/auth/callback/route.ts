import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfileById, createProfile } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    // Auto-create Profile for OAuth users (Google) if it doesn't exist yet
    const user = data?.user;
    if (user) {
      const existing = await getProfileById(user.id);
      if (!existing) {
        const name =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "משתמש";
        await createProfile({
          id: user.id,
          email: user.email!,
          name,
          role: "SECRETARY", // default — admin can promote via user management
        });
      }
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
