"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks";
import { Card, Button, Input } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Package,
  X,
  ArrowRight,
  Loader2,
  Tag,
  Star,
  Heart,
  ChevronDown,
  Box,
  AlertCircle,
} from "lucide-react";
import type { Product, Organization } from "@/types";

interface PriceRule {
  id: string;
  organization_id: string;
  product_id: string | null;
  category: string | null;
  discount_percentage: number | null;
  fixed_price: number | null;
  min_quantity: number | null;
  is_active: boolean;
}

interface PriceListEntry {
  id: string;
  price_list_id: string;
  product_id: string;
  price: number;
  min_quantity: number;
  max_quantity: number | null;
}

interface B2BCartItem {
  product: Product;
  quantity: number;
  b2bPrice: number;
}

const DIETARY_FILTERS = [
  { key: "Vegan", label: "Vegan", emoji: "🌱" },
  { key: "Keto", label: "Keto", emoji: "🥑" },
  { key: "Gluten-Free", label: "Gluten-Free", emoji: "🌾" },
  { key: "High Protein", label: "High Protein", emoji: "💪" },
  { key: "Organic", label: "Organic", emoji: "🍃" },
  { key: "Dairy-Free", label: "Dairy-Free", emoji: "🥛" },
];

export default function B2BProductsPage() {
  const { user, profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [priceRules, setPriceRules] = useState<PriceRule[]>([]);
  const [priceListEntries, setPriceListEntries] = useState<PriceListEntry[]>([]);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [cart, setCart] = useState<B2BCartItem[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeDietaryFilters, setActiveDietaryFilters] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [quantityInputs, setQuantityInputs] = useState<Record<string, string>>({});

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    const { data: dealerData } = await supabase
      .from("dealers")
      .select("*")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (!dealerData) {
      setIsLoading(false);
      return;
    }

    const orgId = dealerData.organization_id;

    const [orgResult, productsResult, rulesResult, priceListResult] =
      await Promise.all([
        orgId
          ? supabase
              .from("organizations")
              .select("*")
              .eq("id", orgId)
              .single()
          : Promise.resolve({ data: null }),
        supabase
          .from("aura_products")
          .select("*")
          .eq("is_active", true)
          .order("name"),
        orgId
          ? supabase
              .from("organization_price_rules")
              .select("*")
              .eq("organization_id", orgId)
              .eq("is_active", true)
          : Promise.resolve({ data: [] }),
        orgId
          ? supabase
              .from("price_list_entries")
              .select("*, price_lists!inner(organization_id, is_active)")
              .eq("price_lists.organization_id", orgId)
              .eq("price_lists.is_active", true)
          : Promise.resolve({ data: [] }),
      ]);

    if (orgResult.data) setOrganization(orgResult.data as Organization);
    if (productsResult.data) setProducts(productsResult.data as Product[]);
    if (rulesResult.data) setPriceRules(rulesResult.data as PriceRule[]);
    if (priceListResult.data)
      setPriceListEntries(priceListResult.data as PriceListEntry[]);

    // Load favorites from localStorage
    const storedFavs = localStorage.getItem("aura_b2b_favorites");
    if (storedFavs) {
      try {
        setFavorites(new Set(JSON.parse(storedFavs)));
      } catch {
        // ignore
      }
    }

    setIsLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    if (user && (profile?.role === "dealer" || profile?.role === "admin")) {
      fetchData();
    } else if (user && profile) {
      setIsLoading(false);
    }
  }, [user, profile, fetchData]);

  const getB2BPrice = useCallback(
    (product: Product, quantity?: number): number => {
      // Check price list entries for volume pricing
      const entries = priceListEntries
        .filter((e) => e.product_id === product.id)
        .sort((a, b) => a.min_quantity - b.min_quantity);

      if (entries.length > 0 && quantity) {
        for (let i = entries.length - 1; i >= 0; i--) {
          if (quantity >= entries[i].min_quantity) {
            return entries[i].price;
          }
        }
        return entries[0].price;
      }

      // Check for product-specific fixed price
      const productRule = priceRules.find(
        (r) => r.product_id === product.id && r.fixed_price !== null
      );
      if (productRule?.fixed_price) return productRule.fixed_price;

      // Check for product-specific discount
      const productDiscount = priceRules.find(
        (r) => r.product_id === product.id && r.discount_percentage !== null
      );
      if (productDiscount?.discount_percentage) {
        return product.price * (1 - productDiscount.discount_percentage / 100);
      }

      // Check for category-level discount
      const categoryRule = priceRules.find(
        (r) =>
          r.category === product.category &&
          !r.product_id &&
          r.discount_percentage !== null
      );
      if (categoryRule?.discount_percentage) {
        return product.price * (1 - categoryRule.discount_percentage / 100);
      }

      return product.price;
    },
    [priceRules, priceListEntries]
  );

  const getVolumeTiers = useCallback(
    (product: Product): { min: number; max: number | null; price: number }[] => {
      const entries = priceListEntries
        .filter((e) => e.product_id === product.id)
        .sort((a, b) => a.min_quantity - b.min_quantity);

      if (entries.length === 0) return [];

      return entries.map((e) => ({
        min: e.min_quantity,
        max: e.max_quantity,
        price: e.price,
      }));
    },
    [priceListEntries]
  );

  const hasB2BPricing = useCallback(
    (product: Product): boolean => {
      return (
        priceRules.some(
          (r) => r.product_id === product.id || r.category === product.category
        ) || priceListEntries.some((e) => e.product_id === product.id)
      );
    },
    [priceRules, priceListEntries]
  );

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category));
    return ["all", ...Array.from(cats).sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory =
        selectedCategory === "all" || p.category === selectedCategory;
      const matchesDietary =
        activeDietaryFilters.size === 0 ||
        Array.from(activeDietaryFilters).every(
          (filter) =>
            p.dietary_labels?.some(
              (dl) => dl.toLowerCase() === filter.toLowerCase()
            ) ||
            p.tags?.some((t) => t.toLowerCase() === filter.toLowerCase())
        );
      return matchesSearch && matchesCategory && matchesDietary;
    });
  }, [products, searchQuery, selectedCategory, activeDietaryFilters]);

  const toggleFavorite = (productId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      localStorage.setItem("aura_b2b_favorites", JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const toggleDietaryFilter = (key: string) => {
    setActiveDietaryFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const addToCart = (product: Product, qty: number) => {
    if (qty <= 0) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const newQty = existing.quantity + qty;
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: newQty, b2bPrice: getB2BPrice(product, newQty) }
            : item
        );
      }
      return [
        ...prev,
        { product, quantity: qty, b2bPrice: getB2BPrice(product, qty) },
      ];
    });
    setCartOpen(true);
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.product.id !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity,
              b2bPrice: getB2BPrice(item.product, quantity),
            }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.b2bPrice * item.quantity, 0);
  }, [cart]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const savingsTotal = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + (item.product.price - item.b2bPrice) * item.quantity,
      0
    );
  }, [cart]);

  const minOrderAmount = organization?.min_order_amount ?? 0;
  const meetsMinimum = cartTotal >= minOrderAmount || minOrderAmount === 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
          B2B Product Catalog
        </h1>
        <p className="text-slate-500 mt-1">
          {organization
            ? `Wholesale pricing for ${organization.name}`
            : "Browse products at B2B pricing"}
        </p>
      </div>

      {/* Dietary Filter Pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {DIETARY_FILTERS.map((filter) => {
          const isActive = activeDietaryFilters.has(filter.key);
          return (
            <button
              key={filter.key}
              onClick={() => toggleDietaryFilter(filter.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                isActive
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span>{filter.emoji}</span>
              {filter.label}
              {isActive && <X className="w-3 h-3 ml-0.5" />}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Category Sidebar on desktop */}
        <div className="hidden lg:block lg:w-48 flex-shrink-0">
          <div className="sticky top-8">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Categories
            </h3>
            <nav className="space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === cat
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {cat === "all" ? "All Products" : cat}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Products Section */}
        <div className="flex-1 min-w-0">
          {/* Search and Mobile Category Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search products by name, SKU, or brand..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
                className="focus:ring-blue-600 focus:border-blue-600"
              />
            </div>
            <div className="relative lg:hidden">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none w-full sm:w-44 px-4 py-2 pr-10 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                aria-label="Filter by category"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "all" ? "All Categories" : cat}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Results count */}
          <p className="text-sm text-slate-500 mb-4">
            {filteredProducts.length} product
            {filteredProducts.length !== 1 ? "s" : ""}
            {selectedCategory !== "all" && ` in ${selectedCategory}`}
          </p>

          {/* Products Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProducts.map((product) => {
                const b2bPrice = getB2BPrice(product);
                const hasDiscount = b2bPrice < product.price;
                const discountPct = hasDiscount
                  ? Math.round(
                      ((product.price - b2bPrice) / product.price) * 100
                    )
                  : 0;
                const inCart = cart.find(
                  (item) => item.product.id === product.id
                );
                const isFav = favorites.has(product.id);
                const volumeTiers = getVolumeTiers(product);
                const qtyValue =
                  quantityInputs[product.id] !== undefined
                    ? quantityInputs[product.id]
                    : "10";

                return (
                  <Card
                    key={product.id}
                    padding="none"
                    className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow group"
                  >
                    {/* Product Image */}
                    <div className="relative aspect-square bg-slate-100">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-slate-300" />
                        </div>
                      )}
                      {hasDiscount && (
                        <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-md">
                          {discountPct}% OFF
                        </span>
                      )}
                      {product.is_bunker_safe && (
                        <span className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1">
                          <Box className="w-3 h-3" />
                          Case of 12
                        </span>
                      )}
                      {inCart && (
                        <span className="absolute top-2 right-10 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                          {inCart.quantity}
                        </span>
                      )}
                      <button
                        onClick={() => toggleFavorite(product.id)}
                        className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          isFav
                            ? "bg-red-50 text-red-500"
                            : "bg-white/80 text-slate-400 opacity-0 group-hover:opacity-100"
                        }`}
                        aria-label={
                          isFav
                            ? `Remove ${product.name} from favorites`
                            : `Add ${product.name} to favorites`
                        }
                      >
                        <Heart
                          className={`w-4 h-4 ${isFav ? "fill-red-500" : ""}`}
                        />
                      </button>
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs text-slate-400 font-mono">
                          {product.sku}
                        </p>
                        {product.dietary_labels &&
                          product.dietary_labels.length > 0 && (
                            <div className="flex gap-1">
                              {product.dietary_labels.slice(0, 2).map((dl) => (
                                <span
                                  key={dl}
                                  className="text-xs bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded"
                                >
                                  {dl}
                                </span>
                              ))}
                            </div>
                          )}
                      </div>
                      <h3 className="font-semibold text-slate-900 text-sm mb-2 line-clamp-2">
                        {product.name}
                      </h3>

                      {/* Pricing */}
                      <div className="mb-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold text-blue-700">
                            Your Price: {formatCurrency(b2bPrice)}
                          </span>
                        </div>
                        {hasDiscount && (
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-sm text-slate-400 line-through">
                              Retail: {formatCurrency(product.price)}
                            </span>
                            <span className="text-xs font-semibold text-emerald-600">
                              You Save: {discountPct}%
                            </span>
                          </div>
                        )}
                      </div>

                      {hasB2BPricing(product) && !hasDiscount && (
                        <p className="text-xs text-blue-600 flex items-center gap-1 mb-2">
                          <Tag className="w-3 h-3" />
                          B2B Price
                        </p>
                      )}

                      {/* Volume break table */}
                      {volumeTiers.length > 0 && (
                        <div className="mb-3 border border-slate-100 rounded-md overflow-hidden">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-slate-50">
                                <th className="text-left px-2 py-1 text-slate-500 font-medium">
                                  Qty
                                </th>
                                <th className="text-right px-2 py-1 text-slate-500 font-medium">
                                  Unit Price
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {volumeTiers.map((tier, i) => (
                                <tr
                                  key={i}
                                  className="border-t border-slate-50"
                                >
                                  <td className="px-2 py-1 text-slate-700">
                                    {tier.max
                                      ? `${tier.min}-${tier.max}`
                                      : `${tier.min}+`}
                                  </td>
                                  <td className="px-2 py-1 text-right font-medium text-blue-700">
                                    {formatCurrency(tier.price)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Add to cart */}
                      <div className="flex items-center gap-2 mt-3">
                        <input
                          type="number"
                          min={1}
                          value={qtyValue}
                          onChange={(e) =>
                            setQuantityInputs((prev) => ({
                              ...prev,
                              [product.id]: e.target.value,
                            }))
                          }
                          className="w-20 px-2 py-1.5 border border-slate-200 rounded-lg text-sm text-center focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                          aria-label={`Quantity for ${product.name}`}
                        />
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex-1 bg-blue-600 hover:bg-blue-700 focus:ring-blue-600"
                          onClick={() => {
                            const qty = parseInt(qtyValue, 10);
                            if (qty > 0) addToCart(product, qty);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">
                No products match your search.
              </p>
            </div>
          )}
        </div>

        {/* Cart Sidebar - Desktop */}
        <div className="hidden lg:block lg:w-80 flex-shrink-0">
          <div className="sticky top-8">
            <CartSidebar
              cart={cart}
              cartTotal={cartTotal}
              savingsTotal={savingsTotal}
              updateCartQuantity={updateCartQuantity}
              removeFromCart={removeFromCart}
              minOrderAmount={minOrderAmount}
              meetsMinimum={meetsMinimum}
              paymentTerms={organization?.payment_terms || "immediate"}
            />
          </div>
        </div>
      </div>

      {/* Mobile Cart FAB */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setCartOpen(!cartOpen)}
            className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-colors relative"
            aria-label="Open cart"
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
              {cart.length}
            </span>
          </button>
        </div>
      )}

      {/* Mobile Cart Drawer */}
      {cartOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setCartOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] overflow-y-auto animate-slide-up shadow-xl">
            <div className="sticky top-0 bg-white px-4 pt-4 pb-2 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">
                Cart ({cartItemCount} items)
              </h3>
              <button
                onClick={() => setCartOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100"
                aria-label="Close cart"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-4">
              <CartSidebar
                cart={cart}
                cartTotal={cartTotal}
                savingsTotal={savingsTotal}
                updateCartQuantity={updateCartQuantity}
                removeFromCart={removeFromCart}
                minOrderAmount={minOrderAmount}
                meetsMinimum={meetsMinimum}
                paymentTerms={organization?.payment_terms || "immediate"}
                compact
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CartSidebar({
  cart,
  cartTotal,
  savingsTotal,
  updateCartQuantity,
  removeFromCart,
  minOrderAmount,
  meetsMinimum,
  paymentTerms,
  compact = false,
}: {
  cart: B2BCartItem[];
  cartTotal: number;
  savingsTotal: number;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  minOrderAmount: number;
  meetsMinimum: boolean;
  paymentTerms: string;
  compact?: boolean;
}) {
  // Persist cart to localStorage for the orders page
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "aura_b2b_cart",
        JSON.stringify(
          cart.map((item) => ({
            productId: item.product.id,
            sku: item.product.sku,
            name: item.product.name,
            quantity: item.quantity,
            price: item.b2bPrice,
            retailPrice: item.product.price,
            image: item.product.image_url,
          }))
        )
      );
    }
  }, [cart]);

  if (cart.length === 0) {
    return (
      <Card
        padding="lg"
        className={`border border-slate-200 shadow-sm ${
          compact ? "border-0 shadow-none p-0" : ""
        }`}
      >
        <div className="text-center py-6">
          <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Your B2B cart is empty</p>
          <p className="text-xs text-slate-400 mt-1">
            Add products to place a wholesale order
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      padding="lg"
      className={`border border-slate-200 shadow-sm ${
        compact ? "border-0 shadow-none p-0" : ""
      }`}
    >
      {!compact && (
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-blue-600" />
          B2B Cart
        </h3>
      )}

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {cart.map((item) => (
          <div
            key={item.product.id}
            className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0"
          >
            <div className="w-12 h-12 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">
              {item.product.image_url ? (
                <img
                  src={item.product.image_url}
                  alt={item.product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-5 h-5 text-slate-300" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {item.product.name}
              </p>
              <p className="text-xs text-blue-600">
                {formatCurrency(item.b2bPrice)} each
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <button
                  onClick={() =>
                    updateCartQuantity(
                      item.product.id,
                      Math.max(0, item.quantity - 1)
                    )
                  }
                  className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors"
                  aria-label={`Decrease quantity of ${item.product.name}`}
                >
                  <Minus className="w-3 h-3" />
                </button>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    updateCartQuantity(
                      item.product.id,
                      Math.max(0, parseInt(e.target.value, 10) || 0)
                    )
                  }
                  className="w-14 text-center text-sm border border-slate-200 rounded py-0.5 focus:ring-1 focus:ring-blue-600 outline-none"
                  min={0}
                  aria-label={`Quantity for ${item.product.name}`}
                />
                <button
                  onClick={() =>
                    updateCartQuantity(item.product.id, item.quantity + 1)
                  }
                  className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors"
                  aria-label={`Increase quantity of ${item.product.name}`}
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="ml-auto p-1 text-slate-400 hover:text-red-500 transition-colors"
                  aria-label={`Remove ${item.product.name} from cart`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-900 flex-shrink-0">
              {formatCurrency(item.b2bPrice * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      {/* Min order indicator */}
      {minOrderAmount > 0 && (
        <div
          className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
            meetsMinimum
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {meetsMinimum
            ? "Minimum order amount met"
            : `Minimum order: ${formatCurrency(minOrderAmount)} (${formatCurrency(minOrderAmount - cartTotal)} more needed)`}
        </div>
      )}

      {/* Totals */}
      <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
        {savingsTotal > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-emerald-600">B2B Savings</span>
            <span className="font-medium text-emerald-600">
              -{formatCurrency(savingsTotal)}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="font-semibold text-slate-900">Total</span>
          <span className="font-bold text-lg text-slate-900">
            {formatCurrency(cartTotal)}
          </span>
        </div>
        {paymentTerms !== "immediate" && (
          <p className="text-xs text-slate-500">
            Payment: {paymentTerms.replace("_", " ").replace("net", "Net-")}
          </p>
        )}
      </div>

      <a href="/b2b/portal/orders">
        <Button
          variant="primary"
          size="lg"
          className="w-full mt-4 bg-blue-600 hover:bg-blue-700 focus:ring-blue-600"
          disabled={!meetsMinimum && minOrderAmount > 0}
        >
          Proceed to Order
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </a>
    </Card>
  );
}
