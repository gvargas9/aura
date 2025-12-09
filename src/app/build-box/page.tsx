"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Header, Footer } from "@/components/ui";
import { ProductCard } from "@/components/products";
import { BoxSlots, BoxSizeSelector, BoxSummary } from "@/components/box-builder";
import { BOX_CONFIGS } from "@/types";
import { Loader2, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui";
import type { Product } from "@/types";

export default function BuildBoxPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSize = searchParams.get("size") || "voyager";

  const [boxSize, setBoxSize] = useState(initialSize);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const supabase = createClient();

  // Fetch products
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

  // Get unique categories
  const categories = useMemo(() => {
    return [...new Set(products.map((p) => p.category))];
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches =
          product.name.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query);
        if (!matches) return false;
      }
      if (selectedCategory && product.category !== selectedCategory) {
        return false;
      }
      return true;
    });
  }, [products, searchQuery, selectedCategory]);

  // Box config
  const config = BOX_CONFIGS[boxSize];
  const maxSlots = config?.slots || 12;

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
    // If we have more products than the new box allows, trim the array
    const newConfig = BOX_CONFIGS[size];
    if (selectedProducts.length > newConfig.slots) {
      setSelectedProducts(selectedProducts.slice(0, newConfig.slots));
    }
  };

  const handleAuraFill = () => {
    // AI-powered fill: randomly select from available products to fill remaining slots
    const remainingSlots = maxSlots - selectedProducts.length;
    if (remainingSlots <= 0) return;

    const availableProducts = products.filter(
      (p) => !selectedProducts.find((sp) => sp.id === p.id)
    );

    const shuffled = [...availableProducts].sort(() => Math.random() - 0.5);
    const toAdd = shuffled.slice(0, remainingSlots);
    setSelectedProducts([...selectedProducts, ...toAdd]);
  };

  const handleCheckout = () => {
    // Get referral code from URL if present
    const refCode = searchParams.get("ref");

    // Store box config in localStorage for checkout
    localStorage.setItem(
      "aura_box_config",
      JSON.stringify({
        size: boxSize,
        products: selectedProducts.map((p) => p.id),
        price: config.price,
        dealerCode: refCode || undefined,
      })
    );
    router.push("/checkout");
  };

  const isProductInBox = (productId: string) => {
    return selectedProducts.some((p) => p.id === productId);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gray-50">
        {/* Hero */}
        <div className="bg-aura-gradient py-8 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl lg:text-4xl font-bold mb-2">
              Build Your Perfect Box
            </h1>
            <p className="text-lg opacity-90">
              Choose your box size and pick your favorite meals
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Step 1: Box Size */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              Step 1: Choose Your Box Size
            </h2>
            <BoxSizeSelector
              selectedSize={boxSize}
              onSelectSize={handleSizeChange}
            />
          </section>

          {/* Step 2: Select Products */}
          <section>
            <h2 className="text-xl font-semibold mb-4">
              Step 2: Fill Your Box
            </h2>

            <div className="lg:grid lg:grid-cols-4 lg:gap-8">
              {/* Sidebar - Box Preview & Summary */}
              <aside className="hidden lg:block space-y-6">
                <BoxSlots
                  totalSlots={maxSlots}
                  selectedProducts={selectedProducts}
                  onRemoveProduct={handleRemoveProduct}
                />
                <BoxSummary
                  boxSize={boxSize}
                  selectedProducts={selectedProducts}
                  onAuraFill={handleAuraFill}
                  onCheckout={handleCheckout}
                />
              </aside>

              {/* Products Grid */}
              <div className="lg:col-span-3">
                {/* Search & Filters */}
                <div className="mb-6 flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search meals..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      leftIcon={<Search className="w-5 h-5" />}
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                        !selectedCategory
                          ? "bg-aura-primary text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      All
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors capitalize ${
                          selectedCategory === category
                            ? "bg-aura-primary text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Products */}
                {isLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-aura-primary" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        variant="compact"
                        onAddToBox={handleAddProduct}
                        isInBox={isProductInBox(product.id)}
                        showAddButton={selectedProducts.length < maxSlots}
                      />
                    ))}
                  </div>
                )}

                {filteredProducts.length === 0 && !isLoading && (
                  <div className="text-center py-12 text-gray-500">
                    No products found matching your search
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Mobile Bottom Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Box Progress:</span>
              <span className="font-semibold">
                {selectedProducts.length}/{maxSlots}
              </span>
            </div>
            <span className="font-bold text-aura-primary">
              ${config.price}/mo
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAuraFill}
              disabled={selectedProducts.length === maxSlots}
              className="flex-1 py-3 bg-gray-100 rounded-lg font-medium text-gray-700 disabled:opacity-50"
            >
              Aura Fill
            </button>
            <button
              onClick={handleCheckout}
              disabled={selectedProducts.length < maxSlots}
              className="flex-1 py-3 bg-aura-primary text-white rounded-lg font-medium disabled:opacity-50"
            >
              Checkout
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
