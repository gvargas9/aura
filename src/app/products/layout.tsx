import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Products | Aura",
  description:
    "Browse 50+ premium, shelf-stable meals crafted with all-natural ingredients. Filter by dietary preference, category, and more.",
  openGraph: {
    title: "Products | Aura",
    description:
      "Browse 50+ premium, shelf-stable meals crafted with all-natural ingredients.",
  },
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
