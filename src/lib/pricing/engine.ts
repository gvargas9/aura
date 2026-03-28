import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type {
  PriceContext,
  ResolvedPrice,
  ResolvedCart,
  ResolvedCartItem,
  QuantityBreak,
  CartItem,
} from "@/types";

type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Resolve the correct price for a single product given a pricing context.
 *
 * Resolution order (highest priority wins):
 * 1. B2B contract price list (if organization has an active contract)
 * 2. Price list entries matching channel/role/tier, ordered by priority
 * 3. Product retail price (fallback)
 */
export async function resolvePrice(
  supabase: TypedSupabaseClient,
  productId: string,
  ctx: PriceContext
): Promise<ResolvedPrice> {
  // Step 1: Get the product retail price
  const { data: product, error: productError } = await supabase
    .from("aura_products")
    .select("id, name, price, compare_at_price, category")
    .eq("id", productId)
    .single();

  if (productError || !product) {
    throw new Error(`Product not found: ${productId}`);
  }

  const retailPrice = product.price;
  let resolvedPrice = retailPrice;
  let source: ResolvedPrice["source"] = "retail";
  let priceListName: string | undefined;
  let quantityBreaks: QuantityBreak[] | undefined;

  // Step 2: Check B2B contract if organization exists
  if (ctx.organizationId) {
    const contractResult = await resolveContractPrice(
      supabase,
      productId,
      product.category,
      ctx.organizationId,
      retailPrice
    );
    if (contractResult) {
      resolvedPrice = contractResult.price;
      source = "contract";
      priceListName = contractResult.priceListName;
      quantityBreaks = contractResult.quantityBreaks;
    }
  }

  // Step 3: Check price lists matching channel/role/tier (only if no contract price found)
  if (source === "retail") {
    const priceListResult = await resolvePriceListPrice(
      supabase,
      productId,
      product.category,
      ctx,
      retailPrice
    );
    if (priceListResult) {
      resolvedPrice = priceListResult.price;
      source = priceListResult.source;
      priceListName = priceListResult.priceListName;
      quantityBreaks = priceListResult.quantityBreaks;
    }
  }

  // Apply quantity breaks if we found any and quantity qualifies
  if (quantityBreaks && quantityBreaks.length > 0 && ctx.quantity > 1) {
    const applicableBreak = findApplicableBreak(quantityBreaks, ctx.quantity);
    if (applicableBreak) {
      resolvedPrice = applicableBreak.price;
      source = "volume_break";
    }
  }

  const savingsPercent =
    retailPrice > 0 && resolvedPrice < retailPrice
      ? Math.round(((retailPrice - resolvedPrice) / retailPrice) * 100)
      : 0;

  return {
    price: roundPrice(resolvedPrice),
    retailPrice: roundPrice(retailPrice),
    source,
    priceListName,
    savingsPercent,
    quantityBreaks,
  };
}

/**
 * Resolve pricing for an entire cart of items.
 */
export async function resolveCartPricing(
  supabase: TypedSupabaseClient,
  items: Pick<CartItem, "productId" | "quantity">[],
  ctx: PriceContext
): Promise<ResolvedCart> {
  if (items.length === 0) {
    return { items: [], subtotal: 0, itemCount: 0 };
  }

  // Fetch all product names in one query for efficiency
  const productIds = items.map((item) => item.productId);
  const { data: products } = await supabase
    .from("aura_products")
    .select("id, name")
    .in("id", productIds);

  const nameMap = new Map(
    (products || []).map((p) => [p.id, p.name])
  );

  const resolvedItems: ResolvedCartItem[] = [];
  let subtotal = 0;
  let itemCount = 0;

  for (const item of items) {
    const itemCtx: PriceContext = { ...ctx, quantity: item.quantity };
    const resolved = await resolvePrice(supabase, item.productId, itemCtx);
    const lineTotal = roundPrice(resolved.price * item.quantity);

    resolvedItems.push({
      productId: item.productId,
      productName: nameMap.get(item.productId) || "Unknown Product",
      quantity: item.quantity,
      resolvedPrice: resolved,
      lineTotal,
    });

    subtotal += lineTotal;
    itemCount += item.quantity;
  }

  return {
    items: resolvedItems,
    subtotal: roundPrice(subtotal),
    itemCount,
  };
}

// ---- Internal helpers ----

interface InternalPriceResult {
  price: number;
  source: ResolvedPrice["source"];
  priceListName: string;
  quantityBreaks?: QuantityBreak[];
}

async function resolveContractPrice(
  supabase: TypedSupabaseClient,
  productId: string,
  category: string,
  organizationId: string,
  retailPrice: number
): Promise<InternalPriceResult | null> {
  const now = new Date().toISOString();

  // Find active contract for the organization
  const { data: contracts } = await supabase
    .from("b2b_contracts")
    .select("id, price_list_id, name")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .lte("effective_from", now)
    .gte("effective_until", now)
    .order("created_at", { ascending: false })
    .limit(1);

  if (!contracts || contracts.length === 0) {
    return null;
  }

  const contract = contracts[0];

  // Look for product-specific entry first, then category-level
  const { data: entries } = await supabase
    .from("price_list_entries")
    .select("*")
    .eq("price_list_id", contract.price_list_id)
    .eq("is_active", true)
    .or(`product_id.eq.${productId},category.eq.${category}`);

  if (!entries || entries.length === 0) {
    return null;
  }

  // Product-specific entry takes precedence over category-level
  const productEntry = entries.find((e) => e.product_id === productId);
  const categoryEntry = entries.find(
    (e) => e.category === category && !e.product_id
  );
  const bestEntry = productEntry || categoryEntry;

  if (!bestEntry) {
    return null;
  }

  const quantityBreaks = parseQuantityBreaks(bestEntry.quantity_breaks);
  let price = retailPrice;

  if (bestEntry.fixed_price !== null) {
    price = bestEntry.fixed_price;
  } else if (bestEntry.discount_percentage !== null) {
    price = retailPrice * (1 - bestEntry.discount_percentage / 100);
  }

  return {
    price,
    source: "contract",
    priceListName: contract.name,
    quantityBreaks: quantityBreaks.length > 0 ? quantityBreaks : undefined,
  };
}

async function resolvePriceListPrice(
  supabase: TypedSupabaseClient,
  productId: string,
  category: string,
  ctx: PriceContext,
  retailPrice: number
): Promise<InternalPriceResult | null> {
  const now = new Date().toISOString();

  // Fetch user profile to determine role and dealer tier
  let userRole: string | null = null;
  let dealerTier: string | null = null;

  if (ctx.userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, organization_id")
      .eq("id", ctx.userId)
      .single();

    if (profile) {
      userRole = profile.role;

      // If user belongs to an org, get the dealer tier
      if (profile.organization_id) {
        const { data: org } = await supabase
          .from("organizations")
          .select("dealer_tier")
          .eq("id", profile.organization_id)
          .single();
        if (org) {
          dealerTier = org.dealer_tier;
        }
      }
    }
  }

  // Find active price lists matching the context, ordered by priority (highest first)
  const { data: priceLists } = await supabase
    .from("price_lists")
    .select("*")
    .eq("is_active", true)
    .contains("applies_to_channels", [ctx.channel])
    .order("priority", { ascending: false });

  if (!priceLists || priceLists.length === 0) {
    return null;
  }

  // Filter by date range and role/tier matching in application code
  const matchingLists = priceLists.filter((pl) => {
    // Date range check
    if (pl.effective_from && new Date(pl.effective_from) > new Date(now)) {
      return false;
    }
    if (pl.effective_until && new Date(pl.effective_until) < new Date(now)) {
      return false;
    }

    // Role check: if the list specifies roles, the user must match
    if (
      pl.applies_to_roles &&
      pl.applies_to_roles.length > 0 &&
      userRole
    ) {
      if (!pl.applies_to_roles.includes(userRole as Database["public"]["Enums"]["user_role"])) {
        return false;
      }
    }

    // Dealer tier check
    if (
      pl.applies_to_dealer_tiers &&
      pl.applies_to_dealer_tiers.length > 0
    ) {
      if (
        !dealerTier ||
        !pl.applies_to_dealer_tiers.includes(dealerTier as Database["public"]["Enums"]["dealer_tier"])
      ) {
        return false;
      }
    }

    return true;
  });

  if (matchingLists.length === 0) {
    return null;
  }

  // Check entries from highest priority list first
  for (const priceList of matchingLists) {
    const { data: entries } = await supabase
      .from("price_list_entries")
      .select("*")
      .eq("price_list_id", priceList.id)
      .eq("is_active", true)
      .or(`product_id.eq.${productId},category.eq.${category}`);

    if (!entries || entries.length === 0) {
      continue;
    }

    // Product-specific takes precedence
    const productEntry = entries.find((e) => e.product_id === productId);
    const categoryEntry = entries.find(
      (e) => e.category === category && !e.product_id
    );
    const bestEntry = productEntry || categoryEntry;

    if (!bestEntry) {
      continue;
    }

    const quantityBreaks = parseQuantityBreaks(bestEntry.quantity_breaks);
    let price = retailPrice;

    if (bestEntry.fixed_price !== null) {
      price = bestEntry.fixed_price;
    } else if (bestEntry.discount_percentage !== null) {
      price = retailPrice * (1 - bestEntry.discount_percentage / 100);
    }

    return {
      price,
      source: "price_list" as const,
      priceListName: priceList.name,
      quantityBreaks: quantityBreaks.length > 0 ? quantityBreaks : undefined,
    };
  }

  return null;
}

function parseQuantityBreaks(raw: unknown): QuantityBreak[] {
  if (!raw || !Array.isArray(raw)) {
    return [];
  }
  return raw
    .filter(
      (b): b is { minQty: number; price: number } =>
        typeof b === "object" &&
        b !== null &&
        typeof (b as Record<string, unknown>).minQty === "number" &&
        typeof (b as Record<string, unknown>).price === "number"
    )
    .sort((a, b) => b.minQty - a.minQty);
}

function findApplicableBreak(
  breaks: QuantityBreak[],
  quantity: number
): QuantityBreak | null {
  // breaks are sorted descending by minQty
  for (const b of breaks) {
    if (quantity >= b.minQty) {
      return b;
    }
  }
  return null;
}

function roundPrice(amount: number): number {
  return Math.round(amount * 100) / 100;
}
