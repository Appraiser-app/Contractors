import { NextResponse } from "next/server";
import { updateSite, deleteSite } from "@/lib/db";
import { getUser, getProfile } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getProfile();
  if (!profile || profile.role !== "ADMIN") return NextResponse.json({ error: "אין הרשאה לעריכה" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { name, location, description, clientName, clientPhone, contractValue, status, startDate, endDate } = body;

  try {
    const site = await updateSite(id, { name, location: location || null, description: description || null, clientName: clientName || null, clientPhone: clientPhone || null, contractValue: contractValue || null, status, startDate: startDate || null, endDate: endDate || null });
    return NextResponse.json(site);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getProfile();
  if (!profile || profile.role !== "ADMIN") return NextResponse.json({ error: "אין הרשאה למחיקה" }, { status: 403 });

  const { id } = await params;
  try {
    await deleteSite(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
