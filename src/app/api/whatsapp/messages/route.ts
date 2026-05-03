import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getAllWhatsAppMessages } from "@/lib/db";

export async function GET() {
  try {
    await requireAuth();
    const messages = await getAllWhatsAppMessages();
    return NextResponse.json(messages);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
