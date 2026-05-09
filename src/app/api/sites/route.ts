import { NextResponse } from "next/server";
import { createSite, getAllSites, logActivity } from "@/lib/db";
import { getUser, getProfile } from "@/lib/auth";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sites = await getAllSites();
  return NextResponse.json(sites);
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, location, description, clientName, clientPhone, contractValue, status, startDate, endDate, workOrderUrl, orderNumber, lat, lng } = body;

  if (!name) return NextResponse.json({ error: "שם האתר חובה" }, { status: 400 });

  try {
    const [site, profile] = await Promise.all([
      createSite({ id: crypto.randomUUID(), name, location: location || null, description: description || null, clientName: clientName || null, clientPhone: clientPhone || null, contractValue: contractValue || null, status: status || "ACTIVE", startDate: startDate || null, endDate: endDate || null, workOrderUrl: workOrderUrl || null, orderNumber: orderNumber || null, lat: lat ?? null, lng: lng ?? null }),
      getProfile(),
    ]);
    logActivity({ userId: user.id, userName: profile?.name || "משתמש", userEmail: profile?.email || "", action: "יצר אתר עבודה", resource: "site", resourceId: site.id, resourceName: name }).catch(() => {});
    return NextResponse.json(site);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
