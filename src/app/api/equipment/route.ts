import { requireAuth } from "@/lib/auth";
import { createEquipment, logActivity, getProfileById } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { name, type, licensePlate, year, description, status, registeredOwner, registeredAt, currentMileage, nextServiceMileage, testDate } = body;
    if (!name) return NextResponse.json({ error: "שם הכלי חובה" }, { status: 400 });
    const [eq, profile] = await Promise.all([
      createEquipment({ name, type: type || "TRUCK", licensePlate: licensePlate || null, year: year || null, description: description || null, status: status || "ACTIVE", registeredOwner: registeredOwner || null, registeredAt: registeredAt || null, currentMileage: currentMileage || null, nextServiceMileage: nextServiceMileage || null, testDate: testDate || null }),
      getProfileById(user.id),
    ]);
    logActivity({ userId: user.id, userName: profile?.name || "משתמש", userEmail: profile?.email || "", action: "הוסיף ציוד", resource: "equipment", resourceId: eq.id, resourceName: name }).catch(() => {});
    return NextResponse.json(eq, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
