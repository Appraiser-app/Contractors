import { NextResponse } from "next/server";
import { updateSite, deleteSite, getSiteById, logActivity } from "@/lib/db";
import { getUser, getProfile } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getProfile();
  if (!profile || (profile.role !== "ADMIN" && !profile.isSuperAdmin)) return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });

  const { id } = await params;
  const { status } = await req.json();

  if (!["ACTIVE", "COMPLETED", "ON_HOLD"].includes(status)) {
    return NextResponse.json({ error: "סטטוס לא תקין" }, { status: 400 });
  }

  try {
    const site = await updateSite(id, { status });
    logActivity({ userId: user.id, userName: profile.name, userEmail: profile.email, action: `שינה סטטוס פרויקט ל-${status}`, resource: "site", resourceId: id, resourceName: site.name }).catch(() => {});
    return NextResponse.json(site);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getProfile();
  if (!profile || profile.role !== "ADMIN") return NextResponse.json({ error: "אין הרשאה לעריכה" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { name, location, description, clientName, clientPhone, contractValue, status, startDate, endDate, workOrderUrl, lat, lng } = body;

  try {
    const site = await updateSite(id, { name, location: location || null, description: description || null, clientName: clientName || null, clientPhone: clientPhone || null, contractValue: contractValue || null, status, startDate: startDate || null, endDate: endDate || null, workOrderUrl: workOrderUrl !== undefined ? (workOrderUrl || null) : undefined, lat: lat ?? null, lng: lng ?? null });
    logActivity({ userId: user.id, userName: profile.name, userEmail: profile.email, action: "עדכן אתר עבודה", resource: "site", resourceId: id, resourceName: name }).catch(() => {});
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
    const site = await getSiteById(id);
    await deleteSite(id);
    logActivity({ userId: user.id, userName: profile.name, userEmail: profile.email, action: "מחק אתר עבודה", resource: "site", resourceId: id, resourceName: site?.name || id }).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
