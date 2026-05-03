"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const ENDPOINT = "https://www.clickclickclaude.dev/api/analytics/track";

function detectDevice(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent || "";
  if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua)) return "mobile";
  if (/Tablet|iPad/i.test(ua)) return "tablet";
  return "desktop";
}

export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    const projectId = process.env.NEXT_PUBLIC_CCC_PROJECT_ID;
    if (!projectId || !pathname) return;
    const body = {
      projectId,
      path: pathname,
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
      device: detectDevice(),
    };
    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
