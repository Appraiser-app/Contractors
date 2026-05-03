import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@/components/analytics";

export const metadata: Metadata = {
  title: "ניהול קבלן עפר",
  description: "מערכת ניהול אתרי עבודה, הכנסות והוצאות",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="antialiased bg-gray-50">
        <Analytics />
        {children}
      </body>
    </html>
  );
}
