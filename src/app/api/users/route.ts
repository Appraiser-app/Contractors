import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, getProfile } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getProfile();
  if (!profile || profile.role !== "ADMIN") {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const { email, name, password, role } = await req.json();
  if (!email || !name || !password) {
    return NextResponse.json({ error: "שדות חובה חסרים" }, { status: 400 });
  }

  // Create Supabase auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message || "שגיאה ביצירת משתמש" }, { status: 400 });
  }

  // Create profile
  await prisma.profile.create({
    data: {
      id: authData.user.id,
      email,
      name,
      role: role === "ADMIN" ? "ADMIN" : "SECRETARY",
    },
  });

  return NextResponse.json({ ok: true });
}
