import { getProfile, getUser } from "@/lib/auth";
import { deleteTransaction } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const user = await getUser();
	if (!user)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const profile = await getProfile();
	if (!profile || (profile.role !== "ADMIN" && !profile.isSuperAdmin))
		return NextResponse.json({ error: "אין הרשאה למחיקה" }, { status: 403 });

	const { id } = await params;
	try {
		await deleteTransaction(id);
		return NextResponse.json({ ok: true });
	} catch (e) {
		return NextResponse.json({ error: String(e) }, { status: 500 });
	}
}
