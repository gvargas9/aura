"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Header, Footer } from "@/components/ui";
import { ProductGridSkeleton } from "@/components/ui/SkeletonLoader";
import { useAuth, useWishlist } from "@/hooks";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  X,
  Star,
  Plus,
  Package,
  Grid3X3,
  List,
  ChevronDown,
  Leaf,
  Clock,
  Shield,
  Heart,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { Product, ProductFilters as FilterType } from "@/types";

/* ============================================================
   Dietary badge helpers
   ============================================================ */

const DIETARY_COLORS: Record<string, string> = {
  vegan: "bg-green-100 text-green-700",
  vegetarian: "bg-emerald-100 text-emerald-700",
  keto: "bg-purple-100 text-purple-700",
  paleo: "bg-amber-100 text-amber-700",
  "gluten-free": "bg-blue-100 text-blue-700",
  "high-protein": "bg-rose-100 text-rose-700",
  "low-carb": "bg-orange-100 text-orange-700",
  organic: "bg-lime-100 text-lime-700",
  "dairy-free": "bg-sky-100 text-sky-700",
};

const DIETARY_FILTER_OPTIONS = [
  { label: "All", value: "" },
  { label: "Vegan", value: "vegan" },
  { label: "Keto", value: "keto" },
  { label: "Gluten-Free", value: "gluten-free" },
  { label: "Paleo", value: "paleo" },
  { label: "High Protein", value: "high-protein" },
];

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Name A-Z", value: "name" },
];

/* ============================================================
   ProductCard for catalog
   ============================================================ */

function CatalogProductCard({
  product,
  viewMode,
  isWishlisted,
  onToggleWishlist,
  isAuthenticated,
}: {
  product: Product;
  viewMode: "grid" | "list";
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
  isAuthenticated: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  const dietaryLabels = product.dietary_labels || [];
  const shelfLife = product.shelf_life_months;
  const rating = 4.5 + Math.random() * 0.5; // Placeholder until reviews are aggregated
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
    : 0;

  if (viewMode === "list") {
    return (
      <Link href={`/products/${product.id}`}>
      <article className="group bg-white rounded-2xl border border-gray-100 hover:border-aura-primary/20 hover:shadow-lg transition-all duration-300 overflow-hidden flex">
        {/* Image */}
        <div className="relative w-48 flex-shrink-0 bg-gradient-to-br from-gray-50 to-gray-100">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-12 h-12 text-gray-300" />
            </div>
          )}
          {hasDiscount && (
            <span className="absolute top-3 left-3 bg-error text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              -{discountPercent}%
            </span>
          )}
        </div>
        {/* Content */}
        <div className="flex-1 p-5 flex flex-col justify-between">
          <div>
            {/* Dietary badges */}
            {dietaryLabels.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {dietaryLabels.slice(0, 4).map((label) => (
                  <span
                    key={label}
                    className={cn(
                      "badge-dietary",
                      DIETARY_COLORS[label.toLowerCase()] || "bg-gray-100 text-gray-600"
                    )}
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}
            <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
            <p className="text-sm text-gray-500 line-clamp-2">
              {product.short_description || product.description}
            </p>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(product.price)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-gray-400 line-through">
                  {formatCurrency(product.compare_at_price!)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {shelfLife && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {shelfLife}mo
                </span>
              )}
              <div className="flex items-center gap-0.5">
                <Star className="w-3.5 h-3.5 text-aura-accent fill-current" />
                <span className="text-xs font-medium text-gray-600">
                  {rating.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </article>
      </Link>
    );
  }

  return (
    <Link href={`/products/${product.id}`}>
    <article
      className="group bg-white rounded-2xl border border-gray-100 hover:border-aura-primary/20 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image container */}
      <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className={cn(
              "object-cover transition-transform duration-500",
              isHovered && "scale-110"
            )}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <Package className="w-16 h-16 text-gray-200 mx-auto mb-2" />
              <span className="text-xs text-gray-400">{product.name}</span>
            </div>
          </div>
        )}

        {/* Top badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          <div className="flex flex-col gap-1.5">
            {hasDiscount && (
              <span className="bg-error text-white text-[10px] font-bold px-2 py-0.5 rounded-full w-fit">
                -{discountPercent}%
              </span>
            )}
            {product.is_bunker_safe && (
              <span className="bg-aura-dark/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                <Shield className="w-2.5 h-2.5" />
                Bunker Safe
              </span>
            )}
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!isAuthenticated) {
                router.push("/auth/login?redirectTo=/products");
                return;
              }
              onToggleWishlist(product.id);
            }}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200",
              isWishlisted
                ? "bg-red-50 text-red-500 scale-100"
                : "bg-white/80 backdrop-blur-sm text-gray-400 opacity-0 group-hover:opacity-100"
            )}
            aria-label={isWishlisted ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              className={cn(
                "w-4 h-4 transition-transform duration-200",
                isWishlisted && "fill-current animate-[heartBounce_0.3s_ease-out]"
              )}
            />
          </button>
        </div>

        {/* Shelf life badge */}
        {shelfLife && (
          <div className="absolute bottom-3 left-3">
            <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {shelfLife} months
            </span>
          </div>
        )}

        {/* Quick-add overlay */}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 p-3 transition-all duration-300",
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          <button
            className="w-full bg-aura-dark/90 backdrop-blur-sm text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-aura-dark transition-colors flex items-center justify-center gap-2"
            aria-label={`Quick add ${product.name} to box`}
          >
            <Plus className="w-4 h-4" />
            Quick Add to Box
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Dietary labels */}
        {dietaryLabels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {dietaryLabels.slice(0, 3).map((label) => (
              <span
                key={label}
                className={cn(
                  "badge-dietary",
                  DIETARY_COLORS[label.toLowerCase()] || "bg-gray-100 text-gray-600"
                )}
              >
                {label}
              </span>
            ))}
            {dietaryLabels.length > 3 && (
              <span className="badge-dietary bg-gray-100 text-gray-500">
                +{dietaryLabels.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Name */}
        <h3 className="font-semibold text-gray-900 mb-1 text-sm leading-snug">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "w-3 h-3",
                  i < Math.floor(rating)
                    ? "text-aura-accent fill-current"
                    : "text-gray-200 fill-current"
                )}
              />
            ))}
          </div>
          <span className="text-[10px] text-gray-400">
            ({Math.floor(10 + Math.random() * 90)})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900">
              {formatCurrency(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">
                {formatCurrency(product.compare_at_price!)}
              </span>
            )}
          </div>
          <button
            className="w-9 h-9 rounded-full bg-aura-light text-aura-primary hover:bg-aura-primary hover:text-white flex items-center justify-center transition-all duration-200"
            aria-label={`Add ${product.name} to box`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Subscribe & Save badge */}
        {hasDiscount && (
          <div className="mt-2 bg-aura-light rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
            <Leaf className="w-3 h-3 text-aura-primary" />
            <span className="text-[10px] font-medium text-aura-primary">
              Subscribe & Save {discountPercent}%
            </span>
          </div>
        )}
      </div>
    </article>
    </Link>
  );
}

/* ============================================================
   Sidebar Filters
   ============================================================ */

function FilterSidebar({
  filters,
  onFiltersChange,
  categories,
  productCount,
  onClose,
}: {
  filters: FilterType;
  onFiltersChange: (f: FilterType) => void;
  categories: string[];
  productCount: number;
  onClose?: () => void;
}) {
  const [priceRange, setPriceRange] = useState([0, 50]);

  return (
    <div className="space-y-6">
      {/* Header (mobile) */}
      {onClose && (
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <h3 className="font-semibold text-lg">Filters</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
            aria-label="Close filters"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Results count */}
      <p className="text-sm text-gray-500">{productCount} products</p>

      {/* Category */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Category</h4>
        <div className="space-y-1.5">
          <button
            onClick={() => onFiltersChange({ ...filters, category: undefined })}
            className={cn(
              "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
              !filters.category
                ? "bg-aura-light text-aura-dark font-medium"
                : "text-gray-600 hover:bg-gray-50"
            )}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onFiltersChange({ ...filters, category: cat })}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors capitalize",
                filters.category === cat
                  ? "bg-aura-light text-aura-dark font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Dietary */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Dietary</h4>
        <div className="flex flex-wrap gap-2">
          {DIETARY_FILTER_OPTIONS.slice(1).map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                // Toggle dietary filter (simplified - could be multi-select)
                onFiltersChange({ ...filters, search: opt.value === filters.search ? undefined : opt.value });
              }}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                filters.search === opt.value
                  ? "bg-aura-dark text-white border-aura-dark"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">
          Price Range
        </h4>
        <div className="px-1">
          <input
            type="range"
            min={0}
            max={50}
            value={priceRange[1]}
            onChange={(e) => {
              const val = Number(e.target.value);
              setPriceRange([0, val]);
              onFiltersChange({
                ...filters,
                maxPrice: val === 50 ? undefined : val,
              });
            }}
            className="w-full accent-aura-primary"
            aria-label="Maximum price filter"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>$0</span>
            <span className="font-medium text-gray-700">
              ${priceRange[1] === 50 ? "50+" : priceRange[1]}
            </span>
          </div>
        </div>
      </div>

      {/* Quick filters */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">
          Quick Filters
        </h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.isBunkerSafe || false}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  isBunkerSafe: e.target.checked || undefined,
                })
              }
              className="w-4 h-4 rounded border-gray-300 text-aura-primary focus:ring-aura-primary/20"
            />
            <span className="text-sm text-gray-600 group-hover:text-gray-900">
              Bunker Safe Only
            </span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.inStock || false}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  inStock: e.target.checked || undefined,
                })
              }
              className="w-4 h-4 rounded border-gray-300 text-aura-primary focus:ring-aura-primary/20"
            />
            <span className="text-sm text-gray-600 group-hover:text-gray-900">
              In Stock Only
            </span>
          </label>
        </div>
      </div>

      {/* Clear filters */}
      <button
        onClick={() => onFiltersChange({})}
        className="w-full text-sm text-aura-primary hover:text-aura-secondary font-medium py-2 transition-colors"
      >
        Clear All Filters
      </button>
    </div>
  );
}

/* ============================================================
   Main Page
   ============================================================ */

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterType>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const supabase = createClient();
  const { isAuthenticated } = useAuth();
  const { toggle: toggleWishlist, isWishlisted } = useWishlist();

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("aura_products")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (!error && data) {
        setProducts(data);
      }
      setIsLoading(false);
    };

    fetchProducts();
  }, [supabase]);

  const categories = useMemo(() => {
    return [...new Set(products.map((p) => p.category))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches =
          product.name.toLowerCase().includes(q) ||
          product.description?.toLowerCase().includes(q) ||
          product.tags?.some((t) => t.toLowerCase().includes(q)) ||
          product.dietary_labels?.some((d) => d.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // Dietary / search filter from sidebar
      if (filters.search) {
        const dietary = product.dietary_labels || [];
        if (!dietary.some((d) => d.toLowerCase().includes(filters.search!.toLowerCase()))) {
          return false;
        }
      }

      if (filters.category && product.category !== filters.category) return false;
      if (filters.minPrice && product.price < filters.minPrice) return false;
      if (filters.maxPrice && product.price > filters.maxPrice) return false;
      if (filters.isBunkerSafe && !product.is_bunker_safe) return false;
      if (filters.inStock && product.stock_level <= 0) return false;

      return true;
    });
  }, [products, searchQuery, filters]);

  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];
    switch (filters.sortBy) {
      case "price_asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        sorted.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }
    return sorted;
  }, [filteredProducts, filters.sortBy]);

  const currentSort =
    SORT_OPTIONS.find((s) => s.value === filters.sortBy) || SORT_OPTIONS[0];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative bg-gradient-to-br from-aura-dark to-aura-darker py-12 lg:py-16 overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-20" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-aura-primary/10 rounded-full blur-[100px]" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
              Our Products
            </h1>
            <p className="text-lg text-white/60 max-w-xl">
              50+ premium, shelf-stable meals crafted with all-natural
              ingredients. Filter by diet, browse by category.
            </p>
          </div>
        </section>

        {/* Toolbar */}
        <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-lg border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search meals, ingredients..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-aura-primary/20 focus:border-aura-primary outline-none transition-all bg-gray-50/50"
                  aria-label="Search products"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Dietary filter pills (desktop) */}
              <div className="hidden lg:flex items-center gap-1.5">
                {DIETARY_FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() =>
                      setFilters({
                        ...filters,
                        search: opt.value === filters.search ? undefined : opt.value || undefined,
                      })
                    }
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                      (opt.value === "" && !filters.search) || filters.search === opt.value
                        ? "bg-aura-dark text-white border-aura-dark"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Sort dropdown */}
              <div className="relative">
                <button
                  onClick={() => setSortOpen(!sortOpen)}
                  className="hidden sm:flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:border-gray-300 transition-colors"
                  aria-label="Sort products"
                >
                  {currentSort.label}
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {sortOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setSortOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20 min-w-[180px]">
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            setFilters({ ...filters, sortBy: opt.value as FilterType["sortBy"] });
                            setSortOpen(false);
                          }}
                          className={cn(
                            "w-full text-left px-4 py-2 text-sm transition-colors",
                            filters.sortBy === opt.value
                              ? "bg-aura-light text-aura-dark font-medium"
                              : "text-gray-600 hover:bg-gray-50"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* View toggle */}
              <div className="hidden sm:flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "p-2.5 transition-colors",
                    viewMode === "grid"
                      ? "bg-aura-dark text-white"
                      : "text-gray-400 hover:text-gray-600"
                  )}
                  aria-label="Grid view"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "p-2.5 transition-colors",
                    viewMode === "list"
                      ? "bg-aura-dark text-white"
                      : "text-gray-400 hover:text-gray-600"
                  )}
                  aria-label="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile filter toggle */}
              <button
                onClick={() => setShowMobileFilters(true)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600"
                aria-label="Open filters"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="lg:grid lg:grid-cols-[240px,1fr] lg:gap-8">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-36">
                <FilterSidebar
                  filters={filters}
                  onFiltersChange={setFilters}
                  categories={categories}
                  productCount={sortedProducts.length}
                />
              </div>
            </aside>

            {/* Product Grid */}
            <div>
              {/* Active filter tags */}
              {(filters.category || filters.isBunkerSafe || filters.search) && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {filters.category && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                      {filters.category}
                      <button
                        onClick={() =>
                          setFilters({ ...filters, category: undefined })
                        }
                        aria-label="Remove category filter"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.search && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full capitalize">
                      {filters.search}
                      <button
                        onClick={() =>
                          setFilters({ ...filters, search: undefined })
                        }
                        aria-label="Remove dietary filter"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.isBunkerSafe && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                      Bunker Safe
                      <button
                        onClick={() =>
                          setFilters({ ...filters, isBunkerSafe: undefined })
                        }
                        aria-label="Remove bunker safe filter"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}

              {isLoading ? (
                <ProductGridSkeleton count={9} columns={3} />
              ) : sortedProducts.length === 0 ? (
                <div className="text-center py-20">
                  <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">
                    No products found
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Try adjusting your filters or search query
                  </p>
                  <button
                    onClick={() => {
                      setFilters({});
                      setSearchQuery("");
                    }}
                    className="text-sm font-medium text-aura-primary hover:text-aura-secondary"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                  {sortedProducts.map((product) => (
                    <CatalogProductCard
                      key={product.id}
                      product={product}
                      viewMode="grid"
                      isWishlisted={isWishlisted(product.id)}
                      onToggleWishlist={toggleWishlist}
                      isAuthenticated={isAuthenticated}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedProducts.map((product) => (
                    <CatalogProductCard
                      key={product.id}
                      product={product}
                      viewMode="list"
                      isWishlisted={isWishlisted(product.id)}
                      onToggleWishlist={toggleWishlist}
                      isAuthenticated={isAuthenticated}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Filters Drawer */}
        {showMobileFilters && (
          <>
            <div
              className="fixed inset-0 bg-black/30 z-40 lg:hidden"
              onClick={() => setShowMobileFilters(false)}
            />
            <div className="fixed inset-y-0 right-0 w-80 max-w-full bg-white z-50 lg:hidden shadow-2xl overflow-y-auto p-6">
              <FilterSidebar
                filters={filters}
                onFiltersChange={(f) => {
                  setFilters(f);
                }}
                categories={categories}
                productCount={sortedProducts.length}
                onClose={() => setShowMobileFilters(false)}
              />
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
