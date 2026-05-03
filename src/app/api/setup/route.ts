import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// One-time setup route to create the first admin users (Sagi and Dor)
// Can only be called once - fails if admins already exist
export async function POST(req: Request) {
  const existingAdmins = await prisma.profile.count({ where: { role: "ADMIN" } });
  if (existingAdmins > 0) {
    return NextResponse.json({ error: "Setup already completed" }, { status: 400 });
  }

  const { users, secret } = await req.json();

  if (secret !== process.env.SETUP_SECRET && secret !== "contractors-setup-2024") {
    return NextResponse.json({ error: "Invalid secret" }, { status: 403 });
  }

  if (!users || !Array.isArray(users)) {
    return NextResponse.json({ error: "Users array required" }, { status: 400 });
  }

  const created = [];
  for (const u of users) {
    const { email, name, password } = u;
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user) continue;

    await prisma.profile.create({
      data: { id: data.user.id, email, name, role: "ADMIN" },
    });
    created.push(email);
  }

  return NextResponse.json({ ok: true, created });
}
