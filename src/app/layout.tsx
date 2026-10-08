import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Mudget — Monthly Budget Tracker",
    template: "%s · Mudget",
  },
  description:
    "Track monthly income, log daily expenses and apply your own budget rules (60/25/15 or any split you like) — synced across all your devices.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#4f46e5",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
