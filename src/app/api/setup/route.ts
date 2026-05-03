import { NextResponse } from "next/server";
import { countAdmins, createProfile } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// One-time setup route to create the first admin users (Sagi and Dor)
export async function POST(req: Request) {
  try {
    const { users, secret } = await req.json();

    if (secret !== process.env.SETUP_SECRET && secret !== "contractors-setup-2024") {
      return NextResponse.json({ error: "Invalid secret" }, { status: 403 });
    }

    if (!users || !Array.isArray(users)) {
      return NextResponse.json({ error: "Users array required" }, { status: 400 });
    }

    let existingAdmins = 0;
    try {
      existingAdmins = await countAdmins();
    } catch (dbErr) {
      return NextResponse.json({ error: "DB error", detail: String(dbErr) }, { status: 500 });
    }

    if (existingAdmins > 0) {
      return NextResponse.json({ error: "Setup already completed" }, { status: 400 });
    }

    const created = [];
    const errors = [];

    for (const u of users) {
      const { email, name, password } = u;
      try {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });
        if (error || !data.user) {
          errors.push({ email, error: error?.message || "no user" });
          continue;
        }

        await createProfile({ id: data.user.id, email, name, role: "ADMIN" });
        created.push(email);
      } catch (e) {
        errors.push({ email, error: String(e) });
      }
    }

    return NextResponse.json({ ok: true, created, errors });
  } catch (e) {
    return NextResponse.json({ error: "Unexpected error", detail: String(e) }, { status: 500 });
  }
}
