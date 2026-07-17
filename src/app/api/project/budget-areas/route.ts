import { getApiUser } from "@/lib/auth";
import { createBudgetArea, getBudgetAreasBySite } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	try {
		const user = await getApiUser();
		if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
		const { searchParams } = new URL(request.url);
		const siteId = searchParams.get("siteId");
		if (!siteId)
			return NextResponse.json({ error: "siteId חסר" }, { status: 400 });

		const areas = await getBudgetAreasBySite(siteId);
		return NextResponse.json(areas);
	} catch (e) {
		console.error("GET /api/project/budget-areas failed:", e);
		return NextResponse.json({ error: "שגיאה" }, { status: 500 });
	}
}

export async function POST(request: Request) {
	try {
		const user = await getApiUser();
		if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
		const body = await request.json();
		const { siteId, name, budgetAmount, notes, color } = body;

		if (!siteId || !name?.trim()) {
			return NextResponse.json({ error: "שדות חובה חסרים" }, { status: 400 });
		}

		const area = await createBudgetArea({
			siteId,
			name: name.trim(),
			budgetAmount: budgetAmount || 0,
			notes: notes || null,
			color: color || null,
		});
		return NextResponse.json(area, { status: 201 });
	} catch (e) {
		console.error("POST /api/project/budget-areas failed:", e);
		return NextResponse.json({ error: "שגיאה ביצירה" }, { status: 500 });
	}
}
