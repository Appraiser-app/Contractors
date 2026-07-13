import { getProfile, getUser } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { deleteTransaction, getTransactionById } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const user = await getUser();
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const profile = await getProfile();
	if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { id } = await params;
	const body = await req.json();

	const isAdmin = profile.role === "ADMIN" || profile.isSuperAdmin === true;

	// invoiceStatus - כל משתמש יכול לעדכן
	// שאר השדות - אדמין בלבד
	const { invoiceStatus, amount, description, category, date, type } = body;

	const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };

	if (invoiceStatus !== undefined) {
		updates.invoiceStatus = invoiceStatus;
	}

	if (amount !== undefined || description !== undefined || category !== undefined || date !== undefined || type !== undefined) {
		if (!isAdmin) {
			return NextResponse.json({ error: "רק אדמין יכול לערוך תנועות" }, { status: 403 });
		}
		if (amount !== undefined) updates.amount = parseFloat(amount);
		if (description !== undefined) updates.description = description;
		if (category !== undefined) updates.category = category || null;
		if (date !== undefined) updates.date = date;
		if (type !== undefined) updates.type = type;
	}

	try {
		await adminDb.collection("transactions").doc(id).update(updates);
		const doc = await adminDb.collection("transactions").doc(id).get();
		return NextResponse.json({ id: doc.id, ...doc.data() });
	} catch (e) {
		return NextResponse.json({ error: String(e) }, { status: 500 });
	}
}

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
