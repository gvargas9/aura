import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type {
  PriceContext,
  ResolvedCart,
  ResolvedCartItem,
  DiscountedCart,
  DiscountLineItem,
  PromotionValidationResult,
  CartItem,
} from "@/types";

type TypedSupabaseClient = SupabaseClient<Database>;
type Promotion = Database["public"]["Tables"]["promotions"]["Row"];

/**
 * Get all currently active promotions that could apply to the given context.
 * Includes automatic promotions (no code needed).
 */
export async function getActivePromotions(
  supabase: TypedSupabaseClient,
  ctx: PriceContext
): Promise<Promotion[]> {
  const now = new Date().toISOString();

  const { data: promotions } = await supabase
    .from("promotions")
    .select("*")
    .eq("is_active", true)
    .eq("trigger_type", "automatic")
    .order("priority", { ascending: false });

  if (!promotions) {
    return [];
  }

  const filtered: Promotion[] = [];

  for (const promo of promotions) {
    if (!isPromotionInDateRange(promo, now)) continue;
    if (!isUsageLimitOk(promo)) continue;
    if (promo.subscription_only && ctx.purchaseType !== "subscription") continue;

    // Check per-user limit
    if (ctx.userId && promo.per_user_limit !== null) {
      const userOk = await checkPerUserLimit(
        supabase,
        promo.id,
        ctx.userId,
        promo.per_user_limit
      );
      if (!userOk) continue;
    }

    // Check first order only
    if (promo.first_order_only && ctx.userId) {
      const isFirst = await isFirstOrder(supabase, ctx.userId);
      if (!isFirst) continue;
    }

    filtered.push(promo);
  }

  return filtered;
}

/**
 * Validate a coupon code against the cart and context.
 */
export async function validateCouponCode(
  supabase: TypedSupabaseClient,
  code: string,
  cart: Pick<CartItem, "productId" | "quantity">[],
  ctx: PriceContext
): Promise<PromotionValidationResult> {
  const now = new Date().toISOString();
  const normalizedCode = code.trim().toUpperCase();

  const { data: promo } = await supabase
    .from("promotions")
    .select("*")
    .eq("coupon_code", normalizedCode)
    .eq("trigger_type", "coupon_code")
    .single();

  if (!promo) {
    return { valid: false, error: "Invalid coupon code" };
  }

  if (!promo.is_active) {
    return { valid: false, error: "This coupon is no longer active" };
  }

  if (!isPromotionInDateRange(promo, now)) {
    return { valid: false, error: "This coupon has expired" };
  }

  if (!isUsageLimitOk(promo)) {
    return { valid: false, error: "This coupon has reached its usage limit" };
  }

  if (promo.subscription_only && ctx.purchaseType !== "subscription") {
    return {
      valid: false,
      error: "This coupon is only valid for subscriptions",
    };
  }

  if (ctx.userId && promo.per_user_limit !== null) {
    const userOk = await checkPerUserLimit(
      supabase,
      promo.id,
      ctx.userId,
      promo.per_user_limit
    );
    if (!userOk) {
      return {
        valid: false,
        error: "You have already used this coupon the maximum number of times",
      };
    }
  }

  if (promo.first_order_only && ctx.userId) {
    const isFirst = await isFirstOrder(supabase, ctx.userId);
    if (!isFirst) {
      return {
        valid: false,
        error: "This coupon is only valid for first orders",
      };
    }
  }

  // Check if any cart items match the promotion's applicable products/categories
  if (
    promo.applicable_product_ids.length > 0 ||
    promo.applicable_categories.length > 0
  ) {
    const hasApplicable = await hasApplicableItems(
      supabase,
      cart,
      promo.applicable_product_ids,
      promo.applicable_categories,
      promo.excluded_product_ids
    );
    if (!hasApplicable) {
      return {
        valid: false,
        error: "This coupon does not apply to any items in your cart",
      };
    }
  }

  return {
    valid: true,
    promotionId: promo.id,
    promotionName: promo.name,
  };
}

/**
 * Apply promotions to a resolved cart to produce the final discounted cart.
 * Handles stacking groups, BOGO, volume breaks, and caps.
 */
export async function applyPromotions(
  supabase: TypedSupabaseClient,
  cart: ResolvedCart,
  promotions: Promotion[],
  couponPromotion?: Promotion
): Promise<DiscountedCart> {
  const allPromos = couponPromotion
    ? [...promotions, couponPromotion]
    : [...promotions];

  if (allPromos.length === 0) {
    return buildDiscountedCart(cart, []);
  }

  // Sort by priority descending
  allPromos.sort((a, b) => b.priority - a.priority);

  // Group by stacking_group: within the same group, only highest priority applies
  const stackingGroups = new Map<string, Promotion[]>();
  const ungrouped: Promotion[] = [];

  for (const promo of allPromos) {
    if (promo.stacking_group) {
      const group = stackingGroups.get(promo.stacking_group) || [];
      group.push(promo);
      stackingGroups.set(promo.stacking_group, group);
    } else if (promo.is_stackable) {
      ungrouped.push(promo);
    } else {
      // Non-stackable and no group: treat as its own group
      ungrouped.push(promo);
    }
  }

  // From each stacking group, take only the highest priority promo
  const effectivePromos: Promotion[] = [];

  for (const [, group] of stackingGroups) {
    // Already sorted by priority desc
    effectivePromos.push(group[0]);
  }

  // Add ungrouped promos - if any are non-stackable, only take the highest priority one
  const stackable = ungrouped.filter((p) => p.is_stackable);
  const nonStackable = ungrouped.filter((p) => !p.is_stackable);

  effectivePromos.push(...stackable);
  if (nonStackable.length > 0) {
    effectivePromos.push(nonStackable[0]);
  }

  // Apply each effective promotion
  const discounts: DiscountLineItem[] = [];

  for (const promo of effectivePromos) {
    const discount = await calculateDiscount(supabase, cart, promo);
    if (discount > 0) {
      discounts.push({
        promotionId: promo.id,
        promotionName: promo.name,
        discountType: promo.discount_type,
        discountAmount: roundPrice(discount),
        couponCode: promo.coupon_code || undefined,
      });
    }
  }

  return buildDiscountedCart(cart, discounts);
}

// ---- Internal helpers ----

async function calculateDiscount(
  supabase: TypedSupabaseClient,
  cart: ResolvedCart,
  promo: Promotion
): Promise<number> {
  // Identify applicable items
  const applicableItems = await getApplicableCartItems(
    supabase,
    cart.items,
    promo
  );

  if (applicableItems.length === 0) {
    return 0;
  }

  const applicableSubtotal = applicableItems.reduce(
    (sum, item) => sum + item.lineTotal,
    0
  );
  const applicableQuantity = applicableItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  // Check min order amount against entire cart subtotal
  if (promo.min_order_amount !== null && cart.subtotal < promo.min_order_amount) {
    return 0;
  }

  // Check min quantity against applicable items
  if (promo.min_quantity !== null && applicableQuantity < promo.min_quantity) {
    return 0;
  }

  let discount = 0;

  switch (promo.discount_type) {
    case "percentage": {
      discount = applicableSubtotal * (promo.discount_value / 100);
      break;
    }
    case "fixed_amount": {
      discount = Math.min(promo.discount_value, applicableSubtotal);
      break;
    }
    case "free_shipping": {
      // Handled at the cart level; return a nominal marker value
      // The actual shipping discount is applied in buildDiscountedCart
      discount = 0;
      break;
    }
    case "bogo": {
      discount = calculateBogoDiscount(applicableItems, promo);
      break;
    }
    case "volume": {
      discount = calculateVolumeDiscount(
        applicableItems,
        applicableSubtotal,
        promo
      );
      break;
    }
    case "bundle": {
      discount = applicableSubtotal * (promo.discount_value / 100);
      break;
    }
  }

  // Cap the discount
  if (promo.max_discount_amount !== null && discount > promo.max_discount_amount) {
    discount = promo.max_discount_amount;
  }

  return discount;
}

function calculateBogoDiscount(
  items: ResolvedCartItem[],
  promo: Promotion
): number {
  const buyQty = promo.bogo_buy_quantity || 1;
  const getQty = promo.bogo_get_quantity || 1;
  const discountPct = promo.bogo_get_discount_pct || 100;

  const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);
  const setSize = buyQty + getQty;
  const completeSets = Math.floor(totalQty / setSize);

  if (completeSets === 0) return 0;

  // Sort items by price ascending so we discount the cheapest items
  const sortedItems = [...items].sort(
    (a, b) => a.resolvedPrice.price - b.resolvedPrice.price
  );

  let freeItemsRemaining = completeSets * getQty;
  let discount = 0;

  for (const item of sortedItems) {
    if (freeItemsRemaining <= 0) break;
    const freeFromThis = Math.min(freeItemsRemaining, item.quantity);
    discount +=
      freeFromThis * item.resolvedPrice.price * (discountPct / 100);
    freeItemsRemaining -= freeFromThis;
  }

  return discount;
}

function calculateVolumeDiscount(
  items: ResolvedCartItem[],
  subtotal: number,
  promo: Promotion
): number {
  // volume_breaks is an array of { minQty: number, discountPct: number }
  // spend_breaks is an array of { minSpend: number, discountPct: number }
  const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);

  if (promo.volume_breaks && Array.isArray(promo.volume_breaks)) {
    const breaks = (promo.volume_breaks as { minQty: number; discountPct: number }[])
      .sort((a, b) => b.minQty - a.minQty);
    for (const b of breaks) {
      if (totalQty >= b.minQty) {
        return subtotal * (b.discountPct / 100);
      }
    }
  }

  if (promo.spend_breaks && Array.isArray(promo.spend_breaks)) {
    const breaks = (promo.spend_breaks as { minSpend: number; discountPct: number }[])
      .sort((a, b) => b.minSpend - a.minSpend);
    for (const b of breaks) {
      if (subtotal >= b.minSpend) {
        return subtotal * (b.discountPct / 100);
      }
    }
  }

  return 0;
}

async function getApplicableCartItems(
  supabase: TypedSupabaseClient,
  items: ResolvedCartItem[],
  promo: Promotion
): Promise<ResolvedCartItem[]> {
  // If no restrictions, all items apply
  if (
    promo.applicable_product_ids.length === 0 &&
    promo.applicable_categories.length === 0 &&
    promo.excluded_product_ids.length === 0
  ) {
    return items;
  }

  // Need product categories for category-level matching
  const productIds = items.map((i) => i.productId);
  const { data: products } = await supabase
    .from("aura_products")
    .select("id, category")
    .in("id", productIds);

  const categoryMap = new Map(
    (products || []).map((p) => [p.id, p.category])
  );

  return items.filter((item) => {
    // Exclude check
    if (promo.excluded_product_ids.includes(item.productId)) {
      return false;
    }

    // If applicable lists are empty (after exclusion check), all items qualify
    if (
      promo.applicable_product_ids.length === 0 &&
      promo.applicable_categories.length === 0
    ) {
      return true;
    }

    // Product-level match
    if (promo.applicable_product_ids.includes(item.productId)) {
      return true;
    }

    // Category-level match
    const cat = categoryMap.get(item.productId);
    if (cat && promo.applicable_categories.includes(cat)) {
      return true;
    }

    return false;
  });
}

function buildDiscountedCart(
  cart: ResolvedCart,
  discounts: DiscountLineItem[]
): DiscountedCart {
  const totalDiscount = roundPrice(
    discounts.reduce((sum, d) => sum + d.discountAmount, 0)
  );

  // Check if any promotion offers free shipping
  const hasFreeShipping = discounts.some(
    (d) => d.discountType === "free_shipping"
  );

  const shipping = hasFreeShipping ? 0 : calculateShipping(cart);
  const subtotalAfterDiscount = Math.max(0, cart.subtotal - totalDiscount);
  const taxEstimate = roundPrice(subtotalAfterDiscount * 0.08); // 8% estimate
  const total = roundPrice(subtotalAfterDiscount + shipping + taxEstimate);
  const savings = roundPrice(
    cart.items.reduce(
      (sum, item) =>
        sum +
        (item.resolvedPrice.retailPrice - item.resolvedPrice.price) *
          item.quantity,
      0
    ) + totalDiscount
  );

  return {
    items: cart.items,
    subtotal: cart.subtotal,
    discounts,
    totalDiscount,
    shipping,
    taxEstimate,
    total,
    savings,
  };
}

function calculateShipping(cart: ResolvedCart): number {
  // Free shipping over $75
  if (cart.subtotal >= 75) return 0;
  // Flat rate
  return 7.99;
}

function isPromotionInDateRange(promo: Promotion, now: string): boolean {
  if (promo.starts_at && new Date(promo.starts_at) > new Date(now)) {
    return false;
  }
  if (promo.ends_at && new Date(promo.ends_at) < new Date(now)) {
    return false;
  }
  return true;
}

function isUsageLimitOk(promo: Promotion): boolean {
  if (promo.usage_limit !== null && promo.usage_count >= promo.usage_limit) {
    return false;
  }
  return true;
}

async function checkPerUserLimit(
  supabase: TypedSupabaseClient,
  promotionId: string,
  userId: string,
  limit: number
): Promise<boolean> {
  const { count } = await supabase
    .from("promotion_redemptions")
    .select("*", { count: "exact", head: true })
    .eq("promotion_id", promotionId)
    .eq("user_id", userId);

  return (count || 0) < limit;
}

async function isFirstOrder(
  supabase: TypedSupabaseClient,
  userId: string
): Promise<boolean> {
  const { count } = await supabase
    .from("aura_orders")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  return (count || 0) === 0;
}

async function hasApplicableItems(
  supabase: TypedSupabaseClient,
  cart: Pick<CartItem, "productId" | "quantity">[],
  applicableProductIds: string[],
  applicableCategories: string[],
  excludedProductIds: string[]
): Promise<boolean> {
  const productIds = cart.map((i) => i.productId);

  // Check direct product match
  if (applicableProductIds.length > 0) {
    const match = productIds.some(
      (pid) =>
        applicableProductIds.includes(pid) && !excludedProductIds.includes(pid)
    );
    if (match) return true;
  }

  // Check category match
  if (applicableCategories.length > 0) {
    const { data: products } = await supabase
      .from("aura_products")
      .select("id, category")
      .in("id", productIds);

    if (products) {
      const match = products.some(
        (p) =>
          applicableCategories.includes(p.category) &&
          !excludedProductIds.includes(p.id)
      );
      if (match) return true;
    }
  }

  return false;
}

function roundPrice(amount: number): number {
  return Math.round(amount * 100) / 100;
}
