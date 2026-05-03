import { NextResponse } from "next/server";
import { createSite } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, location, description, clientName, clientPhone, contractValue, status, startDate, endDate } = body;

  if (!name) return NextResponse.json({ error: "שם האתר חובה" }, { status: 400 });

  try {
    const site = await createSite({
      id: crypto.randomUUID(),
      name,
      location: location || null,
      description: description || null,
      clientName: clientName || null,
      clientPhone: clientPhone || null,
      contractValue: contractValue || null,
      status: status || "ACTIVE",
      startDate: startDate || null,
      endDate: endDate || null,
    });
    return NextResponse.json(site);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
