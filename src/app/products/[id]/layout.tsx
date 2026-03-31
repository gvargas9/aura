import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://aura.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("aura_products")
    .select("name, description, short_description, price, image_url")
    .eq("id", id)
    .single();

  if (!product) {
    return {
      title: "Product Not Found | Aura",
    };
  }

  const description =
    product.short_description ||
    (product.description
      ? product.description.slice(0, 160)
      : "Premium shelf-stable meal from Aura.");

  return {
    title: `${product.name} | Aura`,
    description,
    openGraph: {
      title: `${product.name} | Aura`,
      description,
      url: `${APP_URL}/products/${id}`,
      images: product.image_url ? [{ url: product.image_url }] : [],
      type: "website",
    },
    alternates: {
      canonical: `${APP_URL}/products/${id}`,
    },
  };
}

export default async function ProductDetailLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("aura_products")
    .select("name, description, short_description, price, image_url, is_active")
    .eq("id", id)
    .single();

  const productJsonLd =
    product && product.is_active
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description:
            product.short_description || product.description || "",
          image: product.image_url || undefined,
          url: `${APP_URL}/products/${id}`,
          offers: {
            "@type": "Offer",
            price: product.price,
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
          },
        }
      : null;

  return (
    <>
      {productJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(productJsonLd),
          }}
        />
      )}
      {children}
    </>
  );
}
