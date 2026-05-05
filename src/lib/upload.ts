"use client";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

export async function uploadReceipt(file: File, folder: "transactions" | "equipment-expenses" | "expenses"): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const filename = `receipts/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const storageRef = ref(storage, filename);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
