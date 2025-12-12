"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Header,
  Footer,
  CategoryTabs,
  Input,
} from "@/components/ui";
import { ProductCard } from "@/components/products";
import { BoxSlots, BoxSizeSelector, BoxSummary } from "@/components/box-builder";
import { BOX_CONFIGS } from "@/types";
import {
  Loader2,
  Search,
  SlidersHorizontal,
  Sparkles,
  Package,
  Plus,
  Minus,
  X,
  Truck,
  Tag,
} from "lucide-react";
import Image from "next/image";
import { cn, formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";

function BuildBoxContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSize = searchParams.get("size") || "voyager";

  const [boxSize, setBoxSize] = useState(initialSize);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [featuredProduct, setFeaturedProduct] = useState<Product | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);

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
        if (data.length > 0) {
          setFeaturedProduct(data[0]);
        }
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

  // Recommended pairings
  const recommendedProducts = useMemo(() => {
    return products
      .filter((p) => !selectedProducts.find((sp) => sp.id === p.id))
      .slice(0, 4);
  }, [products, selectedProducts]);

  // Box config
  const config = BOX_CONFIGS[boxSize];
  const maxSlots = config?.slots || 12;
  const isComplete = selectedProducts.length === maxSlots;
  const total = config.price;

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
    if (promoCode.toLowerCase() === "bato" || promoCode.toLowerCase() === "aura10") {
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
        price: config.price,
        promoCode: appliedPromo,
        discount,
      })
    );
    router.push("/checkout");
  };

  const isProductInBox = (productId: string) => {
    return selectedProducts.some((p) => p.id === productId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid lg:grid-cols-[1fr,380px] min-h-[calc(100vh-64px)]">
            {/* Main Content */}
            <div className="p-6 lg:p-8 bg-white border-r border-gray-100">
              {/* Category Navigation */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Meal Category
                </h2>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <SlidersHorizontal className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <CategoryTabs
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                className="mb-8"
              />

              {/* Featured Product */}
              {featuredProduct && !searchQuery && !selectedCategory && (
                <div className="mb-8 grid md:grid-cols-2 gap-8 items-center">
                  {/* Product Image */}
                  <div className="relative aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                    {featuredProduct.image_url ? (
                      <Image
                        src={featuredProduct.image_url}
                        alt={featuredProduct.name}
                        fill
                        className="object-cover"
                        priority
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-24 h-24 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
                      {featuredProduct.name}
                    </h1>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {featuredProduct.description ||
                        featuredProduct.short_description}
                    </p>

                    {/* Size Selection */}
                    <div className="mb-6">
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                        SIZE
                      </p>
                      <div className="flex gap-2">
                        {["280g", "380g", "560g"].map((size, i) => (
                          <button
                            key={size}
                            className={cn(
                              "px-4 py-2 rounded-full text-sm font-medium transition-all",
                              i === 1
                                ? "bg-aura-dark text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            )}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Build Your Meal Tags */}
                    {featuredProduct.tags && featuredProduct.tags.length > 0 && (
                      <div className="mb-6">
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                          BUILD YOUR MEAL
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          {featuredProduct.tags.slice(0, 3).map((tag) => (
                            <div
                              key={tag}
                              className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center relative"
                            >
                              <span className="text-xs text-gray-500 text-center px-1">{tag}</span>
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-aura-dark text-white rounded-full flex items-center justify-center">
                                <span className="text-xs">✓</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add to Order */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3 bg-gray-100 rounded-full px-3 py-2">
                        <button className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700">
                          <Plus className="w-4 h-4" />
                        </button>
                        <span className="w-6 text-center font-semibold">1</span>
                        <button className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700">
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleAddProduct(featuredProduct)}
                        disabled={isProductInBox(featuredProduct.id)}
                        className={cn(
                          "flex-1 py-3.5 rounded-full font-semibold flex items-center justify-center gap-3 transition-all",
                          isProductInBox(featuredProduct.id)
                            ? "bg-aura-primary text-white"
                            : "bg-aura-dark text-white hover:bg-gray-800"
                        )}
                      >
                        <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                          {formatCurrency(featuredProduct.price)}
                        </span>
                        {isProductInBox(featuredProduct.id)
                          ? "Added to box"
                          : "Add to order"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommended Pairings */}
              {recommendedProducts.length > 0 && !searchQuery && !selectedCategory && (
                <div className="mb-8">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
                    RECOMMENDED PAIRINGS
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {recommendedProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        variant="minimal"
                        onAddToBox={handleAddProduct}
                        isInBox={isProductInBox(product.id)}
                        showAddButton={selectedProducts.length < maxSlots}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Search Results / All Products */}
              {(searchQuery || selectedCategory) && (
                <div>
                  <div className="mb-4">
                    <Input
                      placeholder="Search meals..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      leftIcon={<Search className="w-5 h-5" />}
                    />
                  </div>

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
                          onAddToBox={handleAddProduct}
                          isInBox={isProductInBox(product.id)}
                          showAddButton={selectedProducts.length < maxSlots}
                        />
                      ))}
                    </div>
                  )}

                  {filteredProducts.length === 0 && !isLoading && (
                    <div className="text-center py-12">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">
                        No products found matching your search
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Box Size Selector */}
              {!searchQuery && !selectedCategory && (
                <section className="mt-8 pt-8 border-t border-gray-100">
                  <h2 className="text-lg font-semibold mb-4">Choose Your Box Size</h2>
                  <BoxSizeSelector
                    selectedSize={boxSize}
                    onSelectSize={handleSizeChange}
                  />
                </section>
              )}
            </div>

            {/* Order Summary Sidebar */}
            <aside className="hidden lg:block bg-white p-6 lg:p-8 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">My Order</h3>
                <span className="text-sm text-gray-500">
                  {selectedProducts.length} positions
                </span>
              </div>

              {/* Order Items */}
              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto scrollbar-thin pr-1">
                {selectedProducts.slice(0, 10).map((product, index) => (
                  <div
                    key={`${product.id}-${index}`}
                    className="flex gap-3 p-3 bg-gray-50 rounded-xl group"
                  >
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-white flex-shrink-0">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm truncate">
                        {product.name}
                      </h4>
                      <p className="text-xs text-gray-500">380g</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-aura-accent font-semibold text-sm">
                          {formatCurrency(product.price)}
                        </span>
                        <div className="flex items-center gap-1 bg-white rounded-full border border-gray-200 px-1">
                          <button
                            onClick={() => handleRemoveProduct(index)}
                            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-4 text-center text-xs font-medium">
                            1
                          </span>
                          <button className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {selectedProducts.length === 0 && (
                  <div className="py-8 text-center">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Your box is empty</p>
                    <p className="text-sm text-gray-400">
                      Add items to get started
                    </p>
                  </div>
                )}
              </div>

              {selectedProducts.length > 0 && (
                <>
                  {/* Promo Code */}
                  <div className="mb-6">
                    <div className="flex items-center gap-4 text-gray-400 text-sm mb-4">
                      <div className="flex-1 border-t border-dashed border-gray-200" />
                      <span>PROMOCODE</span>
                      <div className="flex-1 border-t border-dashed border-gray-200" />
                    </div>

                    {appliedPromo ? (
                      <div className="flex items-center justify-between px-4 py-3 bg-aura-light rounded-xl">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-aura-primary" />
                          <span className="font-medium text-aura-primary">
                            {appliedPromo}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setAppliedPromo(null);
                            setDiscount(0);
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
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
                          placeholder="Enter code"
                          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-aura-primary focus:ring-1 focus:ring-aura-primary/20 outline-none"
                        />
                        <button
                          onClick={handleApplyPromo}
                          disabled={!promoCode.trim()}
                          className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-200 disabled:opacity-50 transition-colors"
                        >
                          Apply
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Order Totals */}
                  <div className="space-y-3 py-4 border-t border-dashed border-gray-200">
                    {discount > 0 && (
                      <div className="flex items-center justify-between text-aura-primary">
                        <span>DISCOUNT</span>
                        <span className="font-medium">-{discount}%</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-gray-600">
                      <span className="flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        DELIVERY
                      </span>
                      <span className="font-medium text-aura-primary">FREE</span>
                    </div>
                    <div className="flex items-center justify-between text-lg pt-2 border-t border-gray-100">
                      <span className="font-bold text-gray-900">TOTAL</span>
                      <span className="font-bold text-gray-900">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>

                  {/* Aura Fill Button */}
                  {!isComplete && (
                    <button
                      onClick={handleAuraFill}
                      className="w-full btn-secondary py-3 mb-3 flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-5 h-5" />
                      Let Aura Fill My Box
                    </button>
                  )}

                  {/* Checkout Button */}
                  <button
                    onClick={handleCheckout}
                    disabled={!isComplete}
                    className="w-full btn-accent py-4 text-lg"
                  >
                    {isComplete ? "Confirm Order" : `Add ${maxSlots - selectedProducts.length} more items`}
                  </button>
                </>
              )}
            </aside>
          </div>
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
            <span className="font-bold text-aura-accent">
              {formatCurrency(config.price)}/mo
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAuraFill}
              disabled={isComplete}
              className="flex-1 py-3 bg-gray-100 rounded-full font-medium text-gray-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Aura Fill
            </button>
            <button
              onClick={handleCheckout}
              disabled={!isComplete}
              className="flex-1 py-3 btn-accent disabled:opacity-50"
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

export default function BuildBoxPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-aura-primary" />
      </div>
    }>
      <BuildBoxContent />
    </Suspense>
  );
}
