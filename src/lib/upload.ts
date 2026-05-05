"use client";

export async function uploadReceipt(file: File, folder: "transactions" | "equipment-expenses" | "expenses"): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);

  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Upload failed");
  }
  const { url } = await res.json();
  return url;
}
