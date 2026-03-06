import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aura - Energy, Anywhere",
  description:
    "Premium shelf-stable food subscription. Gourmet meals that live in your pantry, boat galley, or bunker for years.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
