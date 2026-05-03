import { NextResponse } from "next/server";
import { db, createProfile, getProfileById } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "חסרים פרטי הרשמה" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "הסיסמה חייבת להכיל לפחות 6 תווים" }, { status: 400 });
    }

    // Create auth user via Supabase Admin
    const { data, error } = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      if (error.message.includes("already registered") || error.message.includes("already been registered")) {
        return NextResponse.json({ error: "כתובת האימייל הזו כבר רשומה במערכת" }, { status: 409 });
      }
      return NextResponse.json({ error: "שגיאה בהרשמה" }, { status: 500 });
    }

    const user = data.user;
    if (!user) {
      return NextResponse.json({ error: "שגיאה ביצירת המשתמש" }, { status: 500 });
    }

    // Create profile if not exists
    const existing = await getProfileById(user.id);
    if (!existing) {
      await createProfile({ id: user.id, email, name, role: "SECRETARY" });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "שגיאה פנימית" }, { status: 500 });
  }
}
