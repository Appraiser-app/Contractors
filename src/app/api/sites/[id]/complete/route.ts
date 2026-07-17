import { getUser } from "@/lib/auth";
import { updateSite } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const action = body.action as "complete" | "collect" | undefined;

  try {
    if (action === "collect") {
      const site = await updateSite(id, { collectedAt: new Date().toISOString() });
      return NextResponse.json(site);
    }
      const site = await updateSite(id, {
        status: "COMPLETED",
        completedAt: new Date().toISOString(),
      });
      return NextResponse.json(site);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
