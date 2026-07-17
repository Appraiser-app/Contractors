import { getApiUser } from "@/lib/auth";
import { createPhase, getPhasesBySite } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	try {
		const user = await getApiUser();
		if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
		const { searchParams } = new URL(request.url);
		const siteId = searchParams.get("siteId");
		if (!siteId)
			return NextResponse.json({ error: "siteId חסר" }, { status: 400 });

		const phases = await getPhasesBySite(siteId);
		return NextResponse.json(phases);
	} catch (e) {
		console.error("GET /api/project/phases failed:", e);
		return NextResponse.json({ error: "שגיאה" }, { status: 500 });
	}
}

export async function POST(request: Request) {
	try {
		const user = await getApiUser();
		if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
		const body = await request.json();
		const { siteId, name, startDate, endDate, color, progress, notes, order } =
			body;

		if (!siteId || !name?.trim() || !startDate || !endDate) {
			return NextResponse.json({ error: "שדות חובה חסרים" }, { status: 400 });
		}

		const phase = await createPhase({
			siteId,
			name: name.trim(),
			startDate: new Date(startDate).toISOString(),
			endDate: new Date(endDate).toISOString(),
			color: color || null,
			progress: progress ?? 0,
			notes: notes || null,
			order: order ?? 0,
		});
		return NextResponse.json(phase, { status: 201 });
	} catch (e) {
		console.error("POST /api/project/phases failed:", e);
		return NextResponse.json({ error: "שגיאה ביצירה" }, { status: 500 });
	}
}
