"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useStorefront } from "./layout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { BOX_CONFIGS } from "@/types";
import {
  ShoppingCart,
  Star,
  Package,
  Truck,
  Shield,
  Loader2,
  ArrowRight,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  short_description: string | null;
  price: number;
  compare_at_price: number | null;
  image_url: string | null;
  category: string;
  is_bunker_safe: boolean;
  is_active: boolean;
}

const AUDIENCE_HERO: Record<
  string,
  { headline: string; subheadline: string; bgGradient: string }
> = {
  camping: {
    headline: "Fuel Your Next Adventure",
    subheadline:
      "Premium freeze-dried meals built for the trail. Lightweight, nutritious, and ready in minutes.",
    bgGradient:
      "from-amber-900/90 via-amber-800/70 to-transparent",
  },
  marine: {
    headline: "Provisions for Open Water",
    subheadline:
      "Compact, shelf-stable meals designed for life at sea. No refrigeration required.",
    bgGradient:
      "from-blue-900/90 via-blue-800/70 to-transparent",
  },
  prep: {
    headline: "Be Ready for Anything",
    subheadline:
      "Long-shelf-life emergency food supplies. Build your bunker stock with confidence.",
    bgGradient:
      "from-gray-900/90 via-gray-800/70 to-transparent",
  },
  default: {
    headline: "Premium Freeze-Dried Meals",
    subheadline:
      "Delicious, nutritious meals ready in minutes. Build your custom box today.",
    bgGradient:
      "from-emerald-900/90 via-emerald-800/70 to-transparent",
  },
};

const STATS = [
  { label: "Meals Shipped", value: "250K+" },
  { label: "5-Star Reviews", value: "4,800+" },
  { label: "Shelf Life", value: "25 yrs" },
  { label: "Categories", value: "12+" },
];

export default function StorefrontPage() {
  const { storefront } = useStorefront();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storefront) return;

    async function fetchProducts() {
      const supabase = createClient();
      const categories = storefront!.settings.featuredCategories;

      let query = supabase
        .from("aura_products")
        .select(
          "id, name, short_description, price, compare_at_price, image_url, category, is_bunker_safe, is_active"
        )
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(8);

      if (categories && categories.length > 0) {
        query = query.in("category", categories);
      }

      const { data } = await query;
      setProducts((data as Product[]) || []);
      setLoading(false);
    }

    fetchProducts();
  }, [storefront]);

  if (!storefront) return null;

  const audience =
    storefront.settings.targetAudience || "default";
  const hero =
    AUDIENCE_HERO[audience] || AUDIENCE_HERO.default;

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ backgroundColor: "var(--sf-dark)" }}
        />
        <div
          className={`absolute inset-0 bg-gradient-to-r ${hero.bgGradient}`}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-4">
              {hero.headline}
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-3">
              {hero.subheadline}
            </p>
            {storefront.settings.tagline && (
              <p
                className="text-base font-medium mb-8"
                style={{ color: "var(--sf-accent)" }}
              >
                {storefront.settings.tagline}
              </p>
            )}
            <div className="flex flex-wrap gap-4">
              <Link
                href={`/store/${storefront.slug}/build-box`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-lg shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
                style={{ backgroundColor: "var(--sf-primary)" }}
              >
                <ShoppingCart className="w-5 h-5" />
                Build Your Box
              </Link>
              <Link
                href={`/store/${storefront.slug}/products`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-lg border-2 border-white/20 text-white hover:bg-white/10 transition-colors"
              >
                Browse Products
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <p
                  className="text-2xl sm:text-3xl font-bold"
                  style={{ color: "var(--sf-primary)" }}
                >
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Featured Products
              </h2>
              <p className="text-gray-500 mt-1">
                Top picks for{" "}
                {audience === "default" ? "every occasion" : audience}
              </p>
            </div>
            <Link
              href={`/store/${storefront.slug}/products`}
              className="hidden sm:inline-flex items-center gap-1 text-sm font-medium transition-colors hover:underline"
              style={{ color: "var(--sf-primary)" }}
            >
              View all
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                No products available yet. Check back soon.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <Card
                  key={product.id}
                  variant="bordered"
                  padding="none"
                  className="group cursor-pointer"
                >
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                    {product.is_bunker_safe && (
                      <span className="absolute top-2 right-2 bg-amber-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                        Bunker Safe
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                      {product.category}
                    </p>
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                      {product.name}
                    </h3>
                    {product.short_description && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                        {product.short_description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <span
                          className="font-bold"
                          style={{ color: "var(--sf-primary)" }}
                        >
                          {formatCurrency(product.price)}
                        </span>
                        {product.compare_at_price &&
                          product.compare_at_price > product.price && (
                            <span className="text-sm text-gray-400 line-through">
                              {formatCurrency(product.compare_at_price)}
                            </span>
                          )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div className="sm:hidden mt-6 text-center">
            <Link
              href={`/store/${storefront.slug}/products`}
              className="inline-flex items-center gap-1 text-sm font-medium"
              style={{ color: "var(--sf-primary)" }}
            >
              View all products
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Box Tiers CTA */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Choose Your Box Size
            </h2>
            <p className="text-gray-500 mt-2">
              Subscribe and save on every shipment
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {Object.values(BOX_CONFIGS).map((box) => (
              <Card key={box.size} variant="bordered" padding="lg" className="text-center">
                <h3 className="text-lg font-bold text-gray-900 capitalize mb-1">
                  {box.size}
                </h3>
                <p className="text-sm text-gray-500 mb-4">{box.description}</p>
                <p
                  className="text-3xl font-extrabold mb-1"
                  style={{ color: "var(--sf-primary)" }}
                >
                  {formatCurrency(box.price)}
                </p>
                <p className="text-xs text-gray-400 mb-4">/month</p>
                <Link
                  href={`/store/${storefront.slug}/build-box?size=${box.size}`}
                  className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-lg text-white font-semibold text-sm transition-colors hover:opacity-90"
                  style={{ backgroundColor: "var(--sf-primary)" }}
                >
                  Build {box.size} Box
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section
        className="border-t"
        style={{ borderColor: "rgba(0,0,0,0.05)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: "var(--sf-primary)",
                  opacity: 0.1,
                }}
              >
                <Truck
                  className="w-6 h-6"
                  style={{ color: "var(--sf-primary)" }}
                />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Free Shipping</p>
                <p className="text-sm text-gray-500">On all subscription boxes</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: "var(--sf-primary)",
                  opacity: 0.1,
                }}
              >
                <Shield
                  className="w-6 h-6"
                  style={{ color: "var(--sf-primary)" }}
                />
              </div>
              <div>
                <p className="font-semibold text-gray-900">25-Year Shelf Life</p>
                <p className="text-sm text-gray-500">
                  Premium freeze-dried quality
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: "var(--sf-primary)",
                  opacity: 0.1,
                }}
              >
                <Star
                  className="w-6 h-6"
                  style={{ color: "var(--sf-primary)" }}
                />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Top Rated</p>
                <p className="text-sm text-gray-500">4.9 average from 4,800+ reviews</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
