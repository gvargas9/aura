"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth, useWishlist, useLocale } from "@/hooks";
import { Header, Footer, Button } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Heart,
  Package,
  Plus,
  Loader2,
  ArrowRight,
  SortAsc,
  Clock,
  DollarSign,
  ArrowUpDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/types/database";

type SortBy = "date_added" | "price_asc" | "price_desc" | "name";

const SORT_ICONS: Record<SortBy, React.ReactNode> = {
  date_added: <Clock className="w-3.5 h-3.5" />,
  price_asc: <DollarSign className="w-3.5 h-3.5" />,
  price_desc: <DollarSign className="w-3.5 h-3.5" />,
  name: <SortAsc className="w-3.5 h-3.5" />,
};

export default function WishlistPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useLocale();
  const sortOptions = useMemo(() => [
    { label: t("wishlist.sortDateAdded"), value: "date_added" as SortBy, icon: SORT_ICONS.date_added },
    { label: t("wishlist.sortPriceLow"), value: "price_asc" as SortBy, icon: SORT_ICONS.price_asc },
    { label: t("wishlist.sortPriceHigh"), value: "price_desc" as SortBy, icon: SORT_ICONS.price_desc },
    { label: t("wishlist.sortName"), value: "name" as SortBy, icon: SORT_ICONS.name },
  ], [t]);
  const { items: wishlistItems, toggle, isLoading: wishlistLoading } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>("date_added");
  const [removingId, setRemovingId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login?redirectTo=/dashboard/wishlist");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch product details for wishlist items
  useEffect(() => {
    const fetchProducts = async () => {
      if (wishlistItems.length === 0) {
        setProducts([]);
        setIsLoadingProducts(false);
        return;
      }

      setIsLoadingProducts(true);
      const productIds = wishlistItems.map((w) => w.product_id);

      const { data, error } = await supabase
        .from("aura_products")
        .select("*")
        .in("id", productIds);

      if (!error && data) {
        setProducts(data as Product[]);
      }
      setIsLoadingProducts(false);
    };

    if (!wishlistLoading) {
      fetchProducts();
    }
  }, [wishlistItems, wishlistLoading, supabase]);

  // Join products with wishlist items and sort
  const sortedProducts = useMemo(() => {
    const productMap = new Map(products.map((p) => [p.id, p]));
    const joined = wishlistItems
      .map((w) => ({
        wishlistItem: w,
        product: productMap.get(w.product_id),
      }))
      .filter((j) => j.product !== undefined) as Array<{
      wishlistItem: (typeof wishlistItems)[0];
      product: Product;
    }>;

    switch (sortBy) {
      case "price_asc":
        joined.sort((a, b) => a.product.price - b.product.price);
        break;
      case "price_desc":
        joined.sort((a, b) => b.product.price - a.product.price);
        break;
      case "name":
        joined.sort((a, b) => a.product.name.localeCompare(b.product.name));
        break;
      default:
        joined.sort(
          (a, b) =>
            new Date(b.wishlistItem.created_at).getTime() -
            new Date(a.wishlistItem.created_at).getTime()
        );
    }

    return joined;
  }, [products, wishlistItems, sortBy]);

  const handleRemove = async (productId: string) => {
    setRemovingId(productId);
    await toggle(productId);
    setRemovingId(null);
  };

  const isLoading = authLoading || wishlistLoading || isLoadingProducts;

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <Loader2 className="w-8 h-8 animate-spin text-aura-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t("wishlist.title")}</h1>
              <p className="text-gray-500 mt-1">
                {sortedProducts.length === 1
                  ? t("wishlist.savedProduct", { count: String(sortedProducts.length) })
                  : t("wishlist.savedProducts", { count: String(sortedProducts.length) })}
              </p>
            </div>

            {/* Sort Controls */}
            {sortedProducts.length > 0 && (
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-gray-400" />
                <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200 p-1">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSortBy(opt.value)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                        sortBy === opt.value
                          ? "bg-aura-dark text-white"
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      {opt.icon}
                      <span className="hidden sm:inline">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse"
                >
                  <div className="aspect-square bg-gray-100" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                    <div className="h-5 bg-gray-100 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : sortedProducts.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <Heart className="w-10 h-10 text-gray-300" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {t("wishlist.empty")}
              </h2>
              <p className="text-gray-500 mb-6 text-center max-w-md">
                {t("wishlist.emptyMessage")}
              </p>
              <Link href="/products">
                <Button variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  {t("wishlist.exploreProducts")}
                </Button>
              </Link>
            </div>
          ) : (
            /* Product Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedProducts.map(({ product, wishlistItem }) => {
                const isRemoving = removingId === product.id;
                const hasDiscount =
                  product.compare_at_price &&
                  product.compare_at_price > product.price;
                const discountPercent = hasDiscount
                  ? Math.round(
                      ((product.compare_at_price! - product.price) /
                        product.compare_at_price!) *
                        100
                    )
                  : 0;

                return (
                  <div
                    key={wishlistItem.id}
                    className={cn(
                      "group bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
                      isRemoving && "opacity-50 scale-95"
                    )}
                  >
                    {/* Image */}
                    <Link href={`/products/${product.id}`}>
                      <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                        {product.image_url ? (
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-16 h-16 text-gray-200" />
                          </div>
                        )}
                        {hasDiscount && (
                          <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            -{discountPercent}%
                          </span>
                        )}
                      </div>
                    </Link>

                    {/* Content */}
                    <div className="p-4">
                      {/* Dietary labels */}
                      {product.dietary_labels && product.dietary_labels.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {product.dietary_labels.slice(0, 2).map((label) => (
                            <span
                              key={label}
                              className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      )}

                      <Link href={`/products/${product.id}`}>
                        <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1 hover:text-aura-primary transition-colors">
                          {product.name}
                        </h3>
                      </Link>

                      <p className="text-xs text-gray-500 capitalize mb-3">
                        {product.category}
                      </p>

                      {/* Price */}
                      <div className="flex items-center gap-2 mb-4">
                        <span className="font-bold text-gray-900">
                          {formatCurrency(product.price)}
                        </span>
                        {hasDiscount && (
                          <span className="text-xs text-gray-400 line-through">
                            {formatCurrency(product.compare_at_price!)}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Link href="/build-box" className="flex-1">
                          <Button
                            variant="primary"
                            size="sm"
                            className="w-full"
                            leftIcon={<Plus className="w-3.5 h-3.5" />}
                          >
                            {t("wishlist.addToBox")}
                          </Button>
                        </Link>
                        <button
                          onClick={() => handleRemove(product.id)}
                          disabled={isRemoving}
                          className="w-9 h-9 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-all duration-200 active:scale-90"
                          aria-label={t("wishlist.remove")}
                        >
                          <Heart className="w-4 h-4 fill-current" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
