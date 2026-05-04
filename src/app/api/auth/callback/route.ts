import { NextResponse } from "next/server";

// Legacy Supabase OAuth callback — no longer used (migrated to Firebase)
export async function GET() {
  return NextResponse.redirect("/dashboard");
}
