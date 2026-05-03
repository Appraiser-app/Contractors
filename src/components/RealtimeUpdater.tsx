"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Tables to watch for real-time updates
const TABLES = ["WorkSite", "Transaction", "Equipment", "MaintenanceRecord", "Insurance", "EquipmentExpense", "Document"];

export default function RealtimeUpdater() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channels: ReturnType<typeof supabase.channel>[] = [];

    for (const table of TABLES) {
      const channel = supabase
        .channel(`realtime-${table}`)
        .on("postgres_changes", { event: "*", schema: "public", table }, () => {
          router.refresh();
        })
        .subscribe();
      channels.push(channel);
    }

    return () => {
      for (const ch of channels) {
        supabase.removeChannel(ch);
      }
    };
  }, [router]);

  return null;
}
