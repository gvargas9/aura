import type { Metadata } from "next";
import B2BContent from "./B2BContent";

export const metadata: Metadata = {
  title: "B2B Partner Program | Aura",
  description:
    "Join Aura's dealer network. Wholesale pricing, drop-ship fulfillment, and industry-leading commissions on premium shelf-stable food.",
  openGraph: {
    title: "B2B Partner Program | Aura",
    description:
      "Wholesale pricing, drop-ship fulfillment, and industry-leading commissions on premium shelf-stable food.",
  },
};

export default function B2BPage() {
  return <B2BContent />;
}
