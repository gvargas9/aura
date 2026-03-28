"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useStorefront } from "../layout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { BOX_CONFIGS } from "@/types";
import type { BoxConfig } from "@/types";
import {
  Package,
  Plus,
  Minus,
  ShoppingCart,
  Check,
  Loader2,
  X,
  ArrowRight,
  Search,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  short_description: string | null;
  price: number;
  image_url: string | null;
  category: string;
  is_bunker_safe: boolean;
  is_active: boolean;
}

interface BoxSlot {
  productId: string;
  name: string;
  image_url: string | null;
}

export default function StorefrontBuildBoxPage() {
  const { storefront } = useStorefront();
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialSize = searchParams.get("size") || "starter";
  const [selectedSize, setSelectedSize] = useState<string>(
    initialSize in BOX_CONFIGS ? initialSize : "starter"
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [slots, setSlots] = useState<BoxSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const boxConfig: BoxConfig = BOX_CONFIGS[selectedSize];
  const slotsRemaining = boxConfig.slots - slots.length;
  const fillPercent = (slots.length / boxConfig.slots) * 100;
  const categories = storefront?.settings.featuredCategories || [];

  useEffect(() => {
    if (!storefront) return;

    async function fetchProducts() {
      const supabase = createClient();
      let query = supabase
        .from("aura_products")
        .select(
          "id, name, short_description, price, image_url, category, is_bunker_safe, is_active"
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

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = !activeCategory || p.category === activeCategory;
      const matchesSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategory, searchQuery]);

  function addProduct(product: Product) {
    if (slots.length >= boxConfig.slots) return;
    setSlots((prev) => [
      ...prev,
      {
        productId: product.id,
        name: product.name,
        image_url: product.image_url,
      },
    ]);
  }

  function removeSlot(index: number) {
    setSlots((prev) => prev.filter((_, i) => i !== index));
  }

  function getProductCount(productId: string) {
    return slots.filter((s) => s.productId === productId).length;
  }

  function handleCheckout() {
    const boxData = {
      size: selectedSize,
      slots: slots.map((s) => s.productId),
      storefront: storefront?.slug,
    };
    localStorage.setItem("aura_box_config", JSON.stringify(boxData));
    router.push("/checkout");
  }

  if (!storefront) return null;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div style={{ backgroundColor: "var(--sf-dark)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl font-bold text-white">Build Your Box</h1>
          <p className="text-gray-400 mt-1">
            Select your meals and customize your{" "}
            {storefront.name} box
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Products */}
          <div className="lg:col-span-2">
            {/* Box Size Selector */}
            <div className="flex flex-wrap gap-3 mb-6">
              {Object.values(BOX_CONFIGS).map((box) => (
                <button
                  key={box.size}
                  onClick={() => {
                    setSelectedSize(box.size);
                    setSlots([]);
                  }}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                    selectedSize === box.size
                      ? "text-white border-transparent"
                      : "border-gray-200 text-gray-600 bg-white hover:border-gray-300"
                  }`}
                  style={
                    selectedSize === box.size
                      ? {
                          backgroundColor: "var(--sf-primary)",
                          borderColor: "var(--sf-primary)",
                        }
                      : undefined
                  }
                >
                  <span className="capitalize">{box.size}</span>
                  <span className="ml-1.5 opacity-70">
                    {box.slots} meals &middot; {formatCurrency(box.price)}/mo
                  </span>
                </button>
              ))}
            </div>

            {/* Search and Category filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search meals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:border-transparent outline-none"
                  style={
                    {
                      "--tw-ring-color": "var(--sf-primary)",
                    } as React.CSSProperties
                  }
                />
              </div>
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveCategory(null)}
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
                      onClick={() =>
                        setActiveCategory(
                          activeCategory === cat ? null : cat
                        )
                      }
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
            </div>

            {/* Product Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No products found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filtered.map((product) => {
                  const count = getProductCount(product.id);
                  const isFull = slotsRemaining <= 0;

                  return (
                    <div
                      key={product.id}
                      className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm line-clamp-1">
                          {product.name}
                        </h4>
                        <p className="text-xs text-gray-400 capitalize">
                          {product.category}
                        </p>
                        {product.is_bunker_safe && (
                          <span className="inline-block mt-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                            Bunker Safe
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {count > 0 && (
                          <button
                            onClick={() => {
                              const idx = slots.findLastIndex(
                                (s) => s.productId === product.id
                              );
                              if (idx >= 0) removeSlot(idx);
                            }}
                            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                            aria-label={`Remove one ${product.name}`}
                          >
                            <Minus className="w-4 h-4 text-gray-500" />
                          </button>
                        )}
                        {count > 0 && (
                          <span
                            className="w-8 text-center text-sm font-semibold"
                            style={{ color: "var(--sf-primary)" }}
                          >
                            {count}
                          </span>
                        )}
                        <button
                          onClick={() => addProduct(product)}
                          disabled={isFull}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ backgroundColor: "var(--sf-primary)" }}
                          aria-label={`Add ${product.name}`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Box Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <Card variant="bordered" padding="lg">
                <h3 className="text-lg font-bold text-gray-900 mb-1 capitalize">
                  {selectedSize} Box
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {slots.length} of {boxConfig.slots} meals selected
                </p>

                {/* Progress Ring */}
                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-28 h-28">
                    <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="8"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="var(--sf-primary)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${fillPercent * 2.64} ${264 - fillPercent * 2.64}`}
                        className="transition-all duration-300"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span
                        className="text-2xl font-bold"
                        style={{ color: "var(--sf-primary)" }}
                      >
                        {slots.length}
                      </span>
                      <span className="text-xs text-gray-400">
                        / {boxConfig.slots}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Selected Items */}
                {slots.length > 0 ? (
                  <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
                    {slots.map((slot, i) => (
                      <div
                        key={`${slot.productId}-${i}`}
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                      >
                        <div className="w-8 h-8 rounded bg-gray-200 overflow-hidden shrink-0">
                          {slot.image_url ? (
                            <img
                              src={slot.image_url}
                              alt={slot.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-3 h-3 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <span className="text-sm text-gray-700 flex-1 truncate">
                          {slot.name}
                        </span>
                        <button
                          onClick={() => removeSlot(i)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          aria-label={`Remove ${slot.name}`}
                        >
                          <X className="w-3 h-3 text-gray-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 mb-6">
                    <ShoppingCart className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">
                      Add meals to your box
                    </p>
                  </div>
                )}

                {/* Pricing */}
                <div className="border-t border-gray-100 pt-4 mb-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subscription</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(boxConfig.price)}/mo
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">One-time</span>
                    <span className="text-gray-400">
                      {formatCurrency(boxConfig.oneTimePrice)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "var(--sf-primary)" }}>
                      You save
                    </span>
                    <span
                      className="font-semibold"
                      style={{ color: "var(--sf-primary)" }}
                    >
                      {boxConfig.subscriptionSavings}%
                    </span>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  disabled={slots.length < boxConfig.slots}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                  style={{ backgroundColor: "var(--sf-primary)" }}
                >
                  {slots.length < boxConfig.slots ? (
                    <>
                      Add {slotsRemaining} more meal
                      {slotsRemaining !== 1 ? "s" : ""}
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Proceed to Checkout
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
