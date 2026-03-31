import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { Package } from "lucide-react";

interface StorefrontTheme {
  primaryColor: string;
  accentColor: string;
  darkColor: string;
}

interface StorefrontSettings {
  featuredCategories?: string[];
  targetAudience?: string;
}

interface Storefront {
  id: string;
  name: string;
  slug: string;
  theme: StorefrontTheme;
  settings: StorefrontSettings;
  is_active: boolean;
}

interface Product {
  id: string;
  name: string;
  short_description: string | null;
  price: number;
  compare_at_price: number | null;
  image_url: string | null;
  category: string;
  is_bunker_safe: boolean;
}

export default async function EmbedPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch storefront
  const { data: storefront, error } = await supabase
    .from("storefronts")
    .select("id, name, slug, theme, settings, is_active")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !storefront) {
    notFound();
  }

  const sf = storefront as unknown as Storefront;
  const theme = sf.theme;
  const categories = sf.settings?.featuredCategories;

  // Fetch products
  let query = supabase
    .from("aura_products")
    .select(
      "id, name, short_description, price, compare_at_price, image_url, category, is_bunker_safe"
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(12);

  if (categories && categories.length > 0) {
    query = query.in("category", categories);
  }

  const { data: products } = await query;
  const productList = (products as unknown as Product[]) || [];

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://aura.com";
  const storeUrl = `${appUrl}/store/${slug}/products`;

  return (
    <div
      style={
        {
          "--sf-primary": theme?.primaryColor || "#059669",
          "--sf-accent": theme?.accentColor || "#f59e0b",
          "--sf-dark": theme?.darkColor || "#1f2937",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          padding: "16px",
          background: "transparent",
        } as React.CSSProperties
      }
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
          paddingBottom: "12px",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              backgroundColor: "var(--sf-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: "bold",
              fontSize: "12px",
            }}
          >
            {sf.name.charAt(0)}
          </div>
          <span style={{ fontWeight: 600, fontSize: "14px", color: "#111827" }}>
            {sf.name}
          </span>
        </div>
        <a
          href={storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: "12px",
            color: "var(--sf-primary)",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          View all products &rarr;
        </a>
      </div>

      {/* Product Grid */}
      {productList.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "48px 16px",
            color: "#9ca3af",
          }}
        >
          <p style={{ fontSize: "14px" }}>No products available yet.</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "16px",
          }}
        >
          {productList.map((product) => (
            <a
              key={product.id}
              href={`${appUrl}/store/${slug}/products`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                overflow: "hidden",
                textDecoration: "none",
                color: "inherit",
                background: "white",
                transition: "box-shadow 0.2s",
              }}
            >
              {/* Product Image */}
              <div
                style={{
                  aspectRatio: "1",
                  backgroundColor: "#f3f4f6",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Package
                      size={32}
                      style={{ color: "#d1d5db" }}
                    />
                  </div>
                )}
                {product.is_bunker_safe && (
                  <span
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      backgroundColor: "#f59e0b",
                      color: "white",
                      fontSize: "10px",
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: "9999px",
                    }}
                  >
                    Bunker Safe
                  </span>
                )}
              </div>

              {/* Product Info */}
              <div style={{ padding: "12px" }}>
                <p
                  style={{
                    fontSize: "10px",
                    color: "#9ca3af",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "4px",
                    margin: "0 0 4px 0",
                  }}
                >
                  {product.category}
                </p>
                <h3
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#111827",
                    margin: "0 0 4px 0",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {product.name}
                </h3>
                {product.short_description && (
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      margin: "0 0 8px 0",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {product.short_description}
                  </p>
                )}
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "6px",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: "14px",
                      color: "var(--sf-primary)",
                    }}
                  >
                    {formatCurrency(product.price)}
                  </span>
                  {product.compare_at_price &&
                    product.compare_at_price > product.price && (
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#9ca3af",
                          textDecoration: "line-through",
                        }}
                      >
                        {formatCurrency(product.compare_at_price)}
                      </span>
                    )}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          marginTop: "16px",
          paddingTop: "12px",
          borderTop: "1px solid #e5e7eb",
          textAlign: "center",
        }}
      >
        <a
          href={storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 20px",
            borderRadius: "8px",
            backgroundColor: "var(--sf-primary)",
            color: "white",
            fontSize: "13px",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Buy on Aura
        </a>
        <p
          style={{
            fontSize: "10px",
            color: "#9ca3af",
            marginTop: "8px",
          }}
        >
          Powered by Aura
        </p>
      </div>
    </div>
  );
}
