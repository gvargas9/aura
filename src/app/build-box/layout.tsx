import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Build Your Box | Aura",
  description:
    "Customize your own box of premium, shelf-stable meals. Choose from 8, 12, or 24 slots and save up to 17% with a subscription.",
  openGraph: {
    title: "Build Your Box | Aura",
    description:
      "Customize your own box of premium, shelf-stable meals. Save up to 17% with a subscription.",
  },
};

export default function BuildBoxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
