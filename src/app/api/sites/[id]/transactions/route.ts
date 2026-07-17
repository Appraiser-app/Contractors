import { requireAuth } from "@/lib/auth";
import { getTransactionsBySite } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		await requireAuth();
		const { id } = await params;
		const transactions = await getTransactionsBySite(id);
		return NextResponse.json(transactions);
	} catch {
		return NextResponse.json({ error: "שגיאה" }, { status: 500 });
	}
}
