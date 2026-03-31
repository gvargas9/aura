import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuraChatWidget } from "@/components/ui/AuraChatWidget";

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
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Aura",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://aura.com",
    logo: `${process.env.NEXT_PUBLIC_APP_URL || "https://aura.com"}/logo.png`,
    description:
      "AI-Native Omni-Commerce Food Platform. Premium shelf-stable food subscriptions.",
    sameAs: [],
  };

  return (
    <html lang="en" className={inter.variable} data-scroll-behavior="smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
      </head>
      <body className="antialiased min-h-screen bg-gradient-to-b from-white to-aura-light">
        {children}
        <AuraChatWidget />
      </body>
    </html>
  );
}
