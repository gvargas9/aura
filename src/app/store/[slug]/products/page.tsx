"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useStorefront } from "../layout";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import { useLocale } from "@/hooks/useLocale";
import { Package, Search, Loader2, Filter, X } from "lucide-react";

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
  tags: string[];
}

export default function StorefrontProductsPage() {
  const { storefront } = useStorefront();
  const { t } = useLocale();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const categories = storefront?.settings.featuredCategories || [];

  useEffect(() => {
    if (!storefront) return;

    async function fetchProducts() {
      setLoading(true);
      const supabase = createClient();

      let query = supabase
        .from("aura_products")
        .select(
          "id, name, short_description, price, compare_at_price, image_url, category, is_bunker_safe, is_active, tags"
        )
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (categories.length > 0) {
        query = query.in("category", categories);
      }

      const { data } = await query;
      setProducts((data as Product[]) || []);
      setLoading(false);
    }

    fetchProducts();
  }, [storefront]);

  if (!storefront) return null;

  const filtered = products.filter((p) => {
    const matchesCategory = !activeCategory || p.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.short_description || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div
        className="border-b"
        style={{ backgroundColor: "var(--sf-dark)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl font-bold text-white">{t("store.products")}</h1>
          <p className="text-gray-400 mt-1">
            {storefront.settings.tagline ||
              `${t("store.browseSelection")} ${storefront.settings.targetAudience || t("store.everyNeed")}`}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t("store.searchProducts")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:border-transparent outline-none transition-all"
              style={
                {
                  "--tw-ring-color": "var(--sf-primary)",
                } as React.CSSProperties
              }
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                aria-label="Clear search"
              >
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Mobile filter toggle */}
          {categories.length > 0 && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 bg-white"
            >
              <Filter className="w-4 h-4" />
              {t("store.filters")}
              {activeCategory && (
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: "var(--sf-primary)" }}
                />
              )}
            </button>
          )}

          {/* Category Filters - Desktop */}
          {categories.length > 0 && (
            <div className="hidden sm:flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveCategory(null)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  !activeCategory
                    ? "text-white"
                    : "text-gray-600 bg-white border border-gray-200 hover:bg-gray-50"
                }`}
                style={
                  !activeCategory
                    ? { backgroundColor: "var(--sf-primary)" }
                    : undefined
                }
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() =>
                    setActiveCategory(activeCategory === cat ? null : cat)
                  }
                  className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
                    activeCategory === cat
                      ? "text-white"
                      : "text-gray-600 bg-white border border-gray-200 hover:bg-gray-50"
                  }`}
                  style={
                    activeCategory === cat
                      ? { backgroundColor: "var(--sf-primary)" }
                      : undefined
                  }
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Category Filters - Mobile */}
        {showFilters && categories.length > 0 && (
          <div className="sm:hidden flex flex-wrap items-center gap-2 mb-6 pb-4 border-b border-gray-200">
            <button
              onClick={() => {
                setActiveCategory(null);
                setShowFilters(false);
              }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !activeCategory
                  ? "text-white"
                  : "text-gray-600 bg-white border border-gray-200"
              }`}
              style={
                !activeCategory
                  ? { backgroundColor: "var(--sf-primary)" }
                  : undefined
              }
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(activeCategory === cat ? null : cat);
                  setShowFilters(false);
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
                  activeCategory === cat
                    ? "text-white"
                    : "text-gray-600 bg-white border border-gray-200"
                }`}
                style={
                  activeCategory === cat
                    ? { backgroundColor: "var(--sf-primary)" }
                    : undefined
                }
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Results count */}
        <p className="text-sm text-gray-500 mb-4">
          {loading ? t("common.loading") : `${filtered.length} ${t("store.productsCount")}`}
          {activeCategory && (
            <span>
              {" "}
              {t("store.in")}{" "}
              <span className="capitalize font-medium text-gray-700">
                {activeCategory}
              </span>
            </span>
          )}
        </p>

        {/* Product Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-1">{t("store.noProductsFound")}</p>
            <p className="text-sm text-gray-400">
              {t("store.tryAdjusting")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((product) => (
              <Card
                key={product.id}
                variant="bordered"
                padding="none"
                className="group"
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
                      {t("store.bunkerSafe")}
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
      </div>
    </div>
  );
}
