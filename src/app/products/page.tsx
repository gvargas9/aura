"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Header, Footer } from "@/components/ui";
import { ProductGrid, ProductFilters } from "@/components/products";
import { Loader2 } from "lucide-react";
import type { Product, ProductFilters as FilterType } from "@/types";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterType>({});
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const supabase = createClient();

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

  // Get unique categories
  const categories = useMemo(() => {
    return [...new Set(products.map((p) => p.category))];
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          product.name.toLowerCase().includes(searchLower) ||
          product.description?.toLowerCase().includes(searchLower) ||
          product.tags?.some((tag) => tag.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filters.category && product.category !== filters.category) {
        return false;
      }

      // Price filters
      if (filters.minPrice && product.price < filters.minPrice) {
        return false;
      }
      if (filters.maxPrice && product.price > filters.maxPrice) {
        return false;
      }

      // Bunker safe filter
      if (filters.isBunkerSafe && !product.is_bunker_safe) {
        return false;
      }

      // In stock filter
      if (filters.inStock && product.stock_level <= 0) {
        return false;
      }

      return true;
    });
  }, [products, filters]);

  // Sort products
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
      case "newest":
      default:
        sorted.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }
    return sorted;
  }, [filteredProducts, filters.sortBy]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gray-50">
        {/* Hero */}
        <div className="bg-aura-gradient py-12 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl lg:text-4xl font-bold mb-2">
              Our Products
            </h1>
            <p className="text-lg opacity-90">
              Premium, shelf-stable meals crafted with all-natural ingredients
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="lg:grid lg:grid-cols-4 lg:gap-8">
            {/* Sidebar Filters (Desktop) */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-lg mb-4">Filters</h3>
                <ProductFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  categories={categories}
                />
              </div>
            </aside>

            {/* Products */}
            <div className="lg:col-span-3">
              {/* Mobile Filters */}
              <div className="lg:hidden mb-4">
                <ProductFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  categories={categories}
                  showMobileFilters={showMobileFilters}
                  onToggleMobileFilters={() =>
                    setShowMobileFilters(!showMobileFilters)
                  }
                />
              </div>

              {/* Desktop Search & Sort */}
              <div className="hidden lg:block mb-6">
                <ProductFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  categories={categories}
                />
              </div>

              {/* Results Count */}
              <div className="mb-4 text-sm text-gray-500">
                Showing {sortedProducts.length} of {products.length} products
              </div>

              {/* Product Grid */}
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-aura-primary" />
                </div>
              ) : (
                <ProductGrid
                  products={sortedProducts}
                  showAddButton={false}
                  columns={3}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
