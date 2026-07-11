import { getProfile, getUser } from "@/lib/auth";
import { deleteTransaction, getTransactionById } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const user = await getUser();
	if (!user)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const profile = await getProfile();
	if (!profile)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { id } = await params;

	// ADMIN ו-SuperAdmin יכולים למחוק הכל
	const isAdmin = profile.role === "ADMIN" || profile.isSuperAdmin === true;

	if (!isAdmin) {
		// משתמש רגיל יכול למחוק רק תנועות שהוא יצר
		const tx = await getTransactionById(id);
		if (!tx)
			return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
		if (tx.createdById !== user.id)
			return NextResponse.json({ error: "אין הרשאה למחיקה" }, { status: 403 });
	}

	try {
		await deleteTransaction(id);
		return NextResponse.json({ ok: true });
	} catch (e) {
		return NextResponse.json({ error: String(e) }, { status: 500 });
	}
}
