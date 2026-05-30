import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { adminStorage } from "@/lib/firebase-admin";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "uploads";

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const sizeMB = file.size / 1024 / 1024;
    if (sizeMB > 20) {
      return NextResponse.json({ error: `הקובץ גדול מדי (${sizeMB.toFixed(1)}MB) — מקסימום 20MB` }, { status: 413 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const filename = `receipts/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const downloadToken = crypto.randomUUID();

    const bucket = adminStorage.bucket();
    const fileRef = bucket.file(filename);

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type || "application/octet-stream",
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
        },
      },
    });

    const bucketName = bucket.name;
    const encodedPath = encodeURIComponent(filename);
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media&token=${downloadToken}`;

    return NextResponse.json({ url });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: `שגיאת שרת: ${String(err).slice(0, 100)}` }, { status: 500 });
  }
}
