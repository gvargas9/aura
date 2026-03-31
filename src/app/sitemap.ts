import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/build-box`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/b2b`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/b2b/apply`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/gift-cards`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  let dynamicPages: MetadataRoute.Sitemap = [];

  try {
    const supabase = await createClient();

    const [productsRes, storefrontsRes] = await Promise.all([
      supabase
        .from("aura_products")
        .select("id, updated_at")
        .eq("is_active", true),
      supabase
        .from("storefronts")
        .select("slug, updated_at")
        .eq("is_active", true),
    ]);

    if (productsRes.data) {
      dynamicPages.push(
        ...productsRes.data.map((product) => ({
          url: `${BASE_URL}/products/${product.id}`,
          lastModified: new Date(product.updated_at),
          changeFrequency: "weekly" as const,
          priority: 0.8,
        }))
      );
    }

    if (storefrontsRes.data) {
      dynamicPages.push(
        ...storefrontsRes.data.map((storefront) => ({
          url: `${BASE_URL}/store/${storefront.slug}`,
          lastModified: new Date(storefront.updated_at),
          changeFrequency: "weekly" as const,
          priority: 0.7,
        }))
      );
    }
  } catch {
    // If DB is unavailable, return static pages only
  }

  return [...staticPages, ...dynamicPages];
}
