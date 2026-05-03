import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@/components/analytics";

export const metadata: Metadata = { title: "Contractors", description: "Built with Click Click Claude" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Analytics />
        {children}
      </body>
    </html>
  );
}
