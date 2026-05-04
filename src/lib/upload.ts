"use client";

import { createClient } from "@/lib/supabase/client";

export async function uploadReceipt(file: File, folder: "transactions" | "equipment-expenses"): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from("receipts")
    .upload(filename, file, { upsert: false });

  if (error) throw new Error(`שגיאה בהעלאת הקבלה: ${error.message}`);

  const { data } = supabase.storage.from("receipts").getPublicUrl(filename);
  return data.publicUrl;
}
