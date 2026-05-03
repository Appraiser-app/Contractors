import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, location, description, clientName, contractValue, status, startDate, endDate } = body;

  if (!name) return NextResponse.json({ error: "שם האתר חובה" }, { status: 400 });

  const site = await prisma.workSite.create({
    data: {
      name,
      location: location || null,
      description: description || null,
      clientName: clientName || null,
      contractValue: contractValue || null,
      status: status || "ACTIVE",
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    },
  });

  return NextResponse.json(site);
}
