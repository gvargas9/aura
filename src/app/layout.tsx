import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Aura | Premium Shelf-Stable Food Subscription",
  description:
    "AI-Native Omni-Commerce Food Platform. Build your perfect box of premium, all-natural, non-refrigerated meals delivered to your door.",
  keywords: [
    "subscription",
    "food delivery",
    "shelf-stable",
    "premium meals",
    "healthy food",
    "meal prep",
  ],
  authors: [{ name: "Aura" }],
  openGraph: {
    title: "Aura | Premium Shelf-Stable Food",
    description: "Build your perfect box of premium, all-natural meals",
    url: "https://aura.com",
    siteName: "Aura",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased min-h-screen bg-gradient-to-b from-white to-aura-light">
        {children}
      </body>
    </html>
  );
}
