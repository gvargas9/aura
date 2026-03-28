"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Header, Footer } from "@/components/ui";
import { BoxBuilderSkeleton } from "@/components/ui/SkeletonLoader";
import Image from "next/image";
import {
  Loader2,
  Search,
  Sparkles,
  Package,
  Plus,
  X,
  Truck,
  Tag,
  Check,
  ChevronDown,
  Clock,
  Shield,
  Star,
  Minus,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";
import { BOX_CONFIGS } from "@/types";

/* ============================================================
   Constants
   ============================================================ */

const DIETARY_FILTERS = [
  { label: "All", value: "" },
  { label: "Vegan", value: "vegan" },
  { label: "Keto", value: "keto" },
  { label: "Gluten-Free", value: "gluten-free" },
  { label: "High Protein", value: "high-protein" },
  { label: "Paleo", value: "paleo" },
];

const DIETARY_COLORS: Record<string, string> = {
  vegan: "bg-green-100 text-green-700",
  vegetarian: "bg-emerald-100 text-emerald-700",
  keto: "bg-purple-100 text-purple-700",
  paleo: "bg-amber-100 text-amber-700",
  "gluten-free": "bg-blue-100 text-blue-700",
  "high-protein": "bg-rose-100 text-rose-700",
  "low-carb": "bg-orange-100 text-orange-700",
};

/* ============================================================
   Progress Ring Component
   ============================================================ */

function ProgressRing({
  current,
  total,
  size = 80,
  strokeWidth = 6,
}: {
  current: number;
  total: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? current / total : 0;
  const offset = circumference - progress * circumference;
  const percentage = Math.round(progress * 100);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-100"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            "transition-all duration-700 ease-out",
            progress >= 1
              ? "text-aura-accent"
              : progress >= 0.5
                ? "text-aura-primary"
                : "text-aura-primary/60"
          )}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-gray-900">
          {current}/{total}
        </span>
        <span className="text-[10px] text-gray-400">slots</span>
      </div>
    </div>
  );
}

/* ============================================================
   Box Tier Selector
   ============================================================ */

function TierSelector({
  selectedSize,
  onSelectSize,
  isSubscription,
  onToggleSubscription,
}: {
  selectedSize: string;
  onSelectSize: (size: string) => void;
  isSubscription: boolean;
  onToggleSubscription: () => void;
}) {
  const tiers = [
    { key: "starter", name: "Starter", slots: 8, price: 59.99, perMeal: "$7.50" },
    { key: "voyager", name: "Voyager", slots: 12, price: 84.99, perMeal: "$7.08" },
    { key: "bunker", name: "Bunker", slots: 24, price: 149.99, perMeal: "$6.25" },
  ];

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex items-center justify-center gap-3">
        <span
          className={cn(
            "text-xs font-medium transition-colors",
            !isSubscription ? "text-gray-900" : "text-gray-400"
          )}
        >
          One-Time
        </span>
        <button
          onClick={onToggleSubscription}
          className={cn(
            "relative w-11 h-6 rounded-full transition-colors duration-200",
            isSubscription ? "bg-aura-primary" : "bg-gray-300"
          )}
          role="switch"
          aria-checked={isSubscription}
          aria-label="Toggle subscription mode"
        >
          <span
            className={cn(
              "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200",
              isSubscription ? "translate-x-[22px]" : "translate-x-0.5"
            )}
          />
        </button>
        <span
          className={cn(
            "text-xs font-medium transition-colors",
            isSubscription ? "text-gray-900" : "text-gray-400"
          )}
        >
          Monthly
        </span>
        {isSubscription && (
          <span className="text-[10px] font-semibold text-aura-primary bg-aura-light px-2 py-0.5 rounded-full">
            Save 15%
          </span>
        )}
      </div>

      {/* Tier cards */}
      <div className="grid grid-cols-3 gap-3">
        {tiers.map((tier) => {
          const isSelected = selectedSize === tier.key;
          const displayPrice = isSubscription
            ? tier.price
            : Math.round(tier.price * 1.15 * 100) / 100;

          return (
            <button
              key={tier.key}
              onClick={() => onSelectSize(tier.key)}
              className={cn(
                "relative rounded-2xl p-4 text-center transition-all duration-200 border-2",
                isSelected
                  ? "border-aura-primary bg-aura-light/50 shadow-md shadow-aura-primary/10"
                  : "border-gray-200 bg-white hover:border-gray-300"
              )}
              aria-label={`Select ${tier.name} box with ${tier.slots} slots`}
            >
              {isSelected && (
                <div className="absolute -top-2 -right-2 w-5 h-5 bg-aura-primary rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              <p
                className={cn(
                  "text-sm font-bold mb-0.5",
                  isSelected ? "text-aura-dark" : "text-gray-900"
                )}
              >
                {tier.name}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {tier.perMeal}
              </p>
              <p className="text-[10px] text-gray-400">/meal</p>
              <p className="text-xs text-gray-500 mt-1">
                {tier.slots} meals &middot; ${displayPrice.toFixed(2)}/mo
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   Slot Grid (sidebar)
   ============================================================ */

function SlotGrid({
  selectedProducts,
  maxSlots,
  onRemove,
}: {
  selectedProducts: Product[];
  maxSlots: number;
  onRemove: (index: number) => void;
}) {
  const emptySlots = maxSlots - selectedProducts.length;
  const columns = maxSlots <= 12 ? 4 : 6;

  return (
    <div
      className={cn(
        "grid gap-2",
        columns === 4 ? "grid-cols-4" : "grid-cols-6"
      )}
    >
      {selectedProducts.map((product, i) => (
        <div
          key={`${product.id}-${i}`}
          className="group relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-aura-primary/30 cursor-pointer"
          title={product.name}
        >
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-aura-light">
              <span className="text-[8px] text-aura-dark font-medium text-center leading-tight px-0.5">
                {product.name.split(" ").slice(0, 2).join(" ")}
              </span>
            </div>
          )}
          {/* Remove button on hover */}
          <button
            onClick={() => onRemove(i)}
            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label={`Remove ${product.name}`}
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      ))}

      {/* Empty slots */}
      {Array.from({ length: emptySlots }).map((_, i) => (
        <div
          key={`empty-${i}`}
          className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center"
        >
          <Plus className="w-3 h-3 text-gray-300" />
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   Product Card for builder
   ============================================================ */

function BuilderProductCard({
  product,
  onAdd,
  isInBox,
  canAdd,
}: {
  product: Product;
  onAdd: (product: Product) => void;
  isInBox: boolean;
  canAdd: boolean;
}) {
  const dietaryLabels = product.dietary_labels || [];

  return (
    <div
      className={cn(
        "group relative bg-white rounded-2xl border overflow-hidden transition-all duration-200",
        isInBox
          ? "border-aura-primary/30 bg-aura-light/20"
          : "border-gray-100 hover:border-aura-primary/20 hover:shadow-md"
      )}
    >
      {/* Image */}
      <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-10 h-10 text-gray-200" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.is_bunker_safe && (
            <span className="bg-aura-dark/80 backdrop-blur-sm text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <Shield className="w-2 h-2" />
              Bunker
            </span>
          )}
        </div>

        {/* Add button overlay */}
        {canAdd && !isInBox && (
          <button
            onClick={() => onAdd(product)}
            className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors"
            aria-label={`Add ${product.name} to box`}
          >
            <div className="w-10 h-10 rounded-full bg-aura-primary text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:scale-100 scale-75">
              <Plus className="w-5 h-5" />
            </div>
          </button>
        )}

        {/* Already added indicator */}
        {isInBox && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-aura-primary text-white flex items-center justify-center">
            <Check className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        {/* Dietary badges */}
        {dietaryLabels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {dietaryLabels.slice(0, 2).map((label) => (
              <span
                key={label}
                className={cn(
                  "inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-semibold uppercase tracking-wider",
                  DIETARY_COLORS[label.toLowerCase()] || "bg-gray-100 text-gray-600"
                )}
              >
                {label}
              </span>
            ))}
          </div>
        )}

        <h4 className="text-xs font-semibold text-gray-900 mb-0.5 line-clamp-1">
          {product.name}
        </h4>

        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-aura-dark">
            {formatCurrency(product.price)}
          </span>
          {product.shelf_life_months && (
            <span className="flex items-center gap-0.5 text-[9px] text-gray-400">
              <Clock className="w-2.5 h-2.5" />
              {product.shelf_life_months}mo
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Build Box Content
   ============================================================ */

function BuildBoxContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSize = searchParams.get("size") || "voyager";

  const [boxSize, setBoxSize] = useState(initialSize);
  const [isSubscription, setIsSubscription] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dietaryFilter, setDietaryFilter] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [sparkleAnim, setSparkleAnim] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("aura_products")
        .select("*")
        .eq("is_active", true)
        .gt("stock_level", 0)
        .order("sort_order", { ascending: true });

      if (!error && data) {
        setProducts(data);
      }
      setIsLoading(false);
    };

    fetchProducts();
  }, [supabase]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches =
          product.name.toLowerCase().includes(q) ||
          product.description?.toLowerCase().includes(q) ||
          product.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matches) return false;
      }
      if (dietaryFilter) {
        const labels = product.dietary_labels || [];
        if (!labels.some((l) => l.toLowerCase().includes(dietaryFilter.toLowerCase()))) {
          return false;
        }
      }
      return true;
    });
  }, [products, searchQuery, dietaryFilter]);

  // Box config
  const config = BOX_CONFIGS[boxSize];
  const maxSlots = config?.slots || 12;
  const isComplete = selectedProducts.length === maxSlots;
  const basePrice = config.price;
  const displayPrice = isSubscription
    ? basePrice
    : Math.round(basePrice * 1.15 * 100) / 100;

  // Handlers
  const handleAddProduct = (product: Product) => {
    if (selectedProducts.length < maxSlots) {
      setSelectedProducts([...selectedProducts, product]);
    }
  };

  const handleRemoveProduct = (index: number) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
  };

  const handleSizeChange = (size: string) => {
    setBoxSize(size);
    const newConfig = BOX_CONFIGS[size];
    if (selectedProducts.length > newConfig.slots) {
      setSelectedProducts(selectedProducts.slice(0, newConfig.slots));
    }
  };

  const handleAuraFill = () => {
    setSparkleAnim(true);
    setTimeout(() => setSparkleAnim(false), 1500);

    const remainingSlots = maxSlots - selectedProducts.length;
    if (remainingSlots <= 0) return;

    const availableProducts = products.filter(
      (p) => !selectedProducts.find((sp) => sp.id === p.id)
    );
    const shuffled = [...availableProducts].sort(() => Math.random() - 0.5);
    const toAdd = shuffled.slice(0, remainingSlots);
    setSelectedProducts([...selectedProducts, ...toAdd]);
  };

  const handleApplyPromo = () => {
    if (
      promoCode.toLowerCase() === "bato" ||
      promoCode.toLowerCase() === "aura10"
    ) {
      setAppliedPromo(promoCode.toUpperCase());
      setDiscount(10);
    }
    setPromoCode("");
  };

  const handleCheckout = () => {
    localStorage.setItem(
      "aura_box_config",
      JSON.stringify({
        size: boxSize,
        products: selectedProducts.map((p) => p.id),
        price: displayPrice,
        isSubscription,
        promoCode: appliedPromo,
        discount,
      })
    );
    router.push("/checkout");
  };

  const isProductInBox = (productId: string) =>
    selectedProducts.some((p) => p.id === productId);

  const finalPrice = discount > 0 ? displayPrice * (1 - discount / 100) : displayPrice;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <Header />

      <main className="flex-1 pb-24 lg:pb-0">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid lg:grid-cols-[1fr,360px]">
            {/* ========== Main Content ========== */}
            <div className="p-4 sm:p-6 lg:p-8">
              {/* Tier selector */}
              <section className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
                <TierSelector
                  selectedSize={boxSize}
                  onSelectSize={handleSizeChange}
                  isSubscription={isSubscription}
                  onToggleSubscription={() => setIsSubscription(!isSubscription)}
                />
              </section>

              {/* Progress + search row */}
              <div className="flex items-center gap-4 mb-6">
                <ProgressRing current={selectedProducts.length} total={maxSlots} />
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search meals..."
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-aura-primary/20 focus:border-aura-primary outline-none transition-all"
                      aria-label="Search products"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        aria-label="Clear search"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Dietary filter pills */}
              <div className="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
                {DIETARY_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() =>
                      setDietaryFilter(f.value === dietaryFilter ? "" : f.value)
                    }
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-all border whitespace-nowrap",
                      (f.value === "" && !dietaryFilter) || dietaryFilter === f.value
                        ? "bg-aura-dark text-white border-aura-dark"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Product grid */}
              {isLoading ? (
                <BoxBuilderSkeleton />
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-16">
                  <Package className="w-14 h-14 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No products match your search</p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setDietaryFilter("");
                    }}
                    className="text-sm text-aura-primary font-medium mt-2"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
                  {filteredProducts.map((product) => (
                    <BuilderProductCard
                      key={product.id}
                      product={product}
                      onAdd={handleAddProduct}
                      isInBox={isProductInBox(product.id)}
                      canAdd={selectedProducts.length < maxSlots}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ========== Desktop Sidebar ========== */}
            <aside className="hidden lg:flex flex-col bg-white border-l border-gray-100 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
              <div className="p-6 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-gray-900">Your Box</h3>
                  <span className="text-xs text-gray-400">
                    {selectedProducts.length} of {maxSlots} filled
                  </span>
                </div>

                {/* Visual slot grid */}
                <div className="mb-6">
                  <SlotGrid
                    selectedProducts={selectedProducts}
                    maxSlots={maxSlots}
                    onRemove={handleRemoveProduct}
                  />
                </div>

                {/* Aura Fill button */}
                {!isComplete && (
                  <button
                    onClick={handleAuraFill}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all duration-300 mb-4 border-2 border-dashed",
                      sparkleAnim
                        ? "border-aura-accent bg-aura-accent/5 text-aura-accent"
                        : "border-aura-primary/30 bg-aura-light/50 text-aura-primary hover:border-aura-primary hover:bg-aura-light"
                    )}
                  >
                    <Sparkles
                      className={cn(
                        "w-5 h-5",
                        sparkleAnim && "animate-sparkle"
                      )}
                    />
                    Aura Fill Remaining
                  </button>
                )}

                {/* Spacer */}
                <div className="flex-1" />

                {/* Order summary (when items selected) */}
                {selectedProducts.length > 0 && (
                  <div className="border-t border-gray-100 pt-4 space-y-3">
                    {/* Promo Code */}
                    <div>
                      {appliedPromo ? (
                        <div className="flex items-center justify-between px-3 py-2 bg-aura-light rounded-xl">
                          <div className="flex items-center gap-2">
                            <Tag className="w-3.5 h-3.5 text-aura-primary" />
                            <span className="text-sm font-medium text-aura-primary">
                              {appliedPromo} (-{discount}%)
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setAppliedPromo(null);
                              setDiscount(0);
                            }}
                            className="text-gray-400 hover:text-gray-600"
                            aria-label="Remove promo code"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={promoCode}
                            onChange={(e) =>
                              setPromoCode(e.target.value.toUpperCase())
                            }
                            placeholder="Promo code"
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-aura-primary focus:ring-1 focus:ring-aura-primary/20 outline-none"
                          />
                          <button
                            onClick={handleApplyPromo}
                            disabled={!promoCode.trim()}
                            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
                          >
                            Apply
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Totals */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-500">
                        <span>Subtotal ({selectedProducts.length} items)</span>
                        <span>{formatCurrency(displayPrice)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-aura-primary">
                          <span>Discount ({discount}%)</span>
                          <span>
                            -{formatCurrency(displayPrice * (discount / 100))}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-gray-500">
                        <span className="flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5" />
                          Shipping
                        </span>
                        <span className="font-medium text-aura-primary">
                          FREE
                        </span>
                      </div>
                      <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
                        <span>Total</span>
                        <span>{formatCurrency(finalPrice)}</span>
                      </div>
                      {isSubscription && (
                        <p className="text-[10px] text-gray-400 text-center">
                          Billed monthly. Cancel anytime.
                        </p>
                      )}
                    </div>

                    {/* Checkout */}
                    <button
                      onClick={handleCheckout}
                      disabled={!isComplete}
                      className={cn(
                        "w-full py-3.5 rounded-xl font-semibold text-center transition-all duration-300",
                        isComplete
                          ? "bg-aura-accent text-white hover:bg-aura-accent-hover shadow-lg shadow-aura-accent/20"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      )}
                    >
                      {isComplete
                        ? "Proceed to Checkout"
                        : `Add ${maxSlots - selectedProducts.length} more meals`}
                    </button>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>

        {/* ========== Mobile Bottom Bar ========== */}
        <div className="lg:hidden fixed bottom-16 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 p-3 z-40 safe-area-bottom">
          <div className="flex items-center gap-3">
            {/* Mini progress ring */}
            <ProgressRing
              current={selectedProducts.length}
              total={maxSlots}
              size={48}
              strokeWidth={4}
            />

            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">
                {formatCurrency(finalPrice)}
                <span className="text-xs font-normal text-gray-400">
                  {isSubscription ? "/mo" : " one-time"}
                </span>
              </p>
              <p className="text-[10px] text-gray-400">
                {selectedProducts.length}/{maxSlots} slots filled
              </p>
            </div>

            {!isComplete ? (
              <button
                onClick={handleAuraFill}
                className="px-4 py-2.5 bg-aura-light text-aura-primary rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Aura Fill
              </button>
            ) : null}

            <button
              onClick={handleCheckout}
              disabled={!isComplete}
              className={cn(
                "px-5 py-2.5 rounded-xl text-sm font-semibold transition-all",
                isComplete
                  ? "bg-aura-accent text-white shadow-md"
                  : "bg-gray-100 text-gray-400"
              )}
            >
              {isComplete ? "Checkout" : `+${maxSlots - selectedProducts.length} more`}
            </button>
          </div>
        </div>
      </main>

      <div className="hidden lg:block">
        <Footer />
      </div>
    </div>
  );
}

/* ============================================================
   Page Export with Suspense
   ============================================================ */

export default function BuildBoxPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-aura-primary mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading your box builder...</p>
          </div>
        </div>
      }
    >
      <BuildBoxContent />
    </Suspense>
  );
}
