import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, corsResponse, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { createAdminClient, getUser } from "../_shared/auth.ts";

interface PriceRequest {
  productId: string;
  quantity: number;
  userId?: string;
  organizationId?: string;
  channel: "web" | "b2b_portal" | "vending" | "api";
  purchaseType: "subscription" | "one_time" | "gift" | "bulk_order";
}

interface QuantityBreak {
  minQty: number;
  price: number;
}

interface ResolvedPrice {
  price: number;
  retailPrice: number;
  source: "contract" | "price_list" | "volume_break" | "retail";
  priceListName?: string;
  savingsPercent: number;
  quantityBreaks: QuantityBreak[];
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return corsResponse();
  }

  try {
    const supabase = createAdminClient();
    const body: PriceRequest = await req.json();

    // ---- Validate input ----
    if (!body.productId || !body.channel || !body.purchaseType) {
      return errorResponse("Missing required fields: productId, channel, purchaseType");
    }
    const quantity = body.quantity ?? 1;

    // ---- Fetch the product's retail price ----
    const { data: product, error: productError } = await supabase
      .from("aura_products")
      .select("id, price, compare_at_price, category")
      .eq("id", body.productId)
      .eq("is_active", true)
      .single();

    if (productError || !product) {
      return errorResponse("Product not found", 404);
    }

    const retailPrice = Number(product.price);
    let resolvedPrice = retailPrice;
    let source: ResolvedPrice["source"] = "retail";
    let priceListName: string | undefined;
    const quantityBreaks: QuantityBreak[] = [];

    // ---- Determine organization from user if not provided ----
    let orgId = body.organizationId;
    if (!orgId && body.userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", body.userId)
        .single();
      orgId = profile?.organization_id ?? undefined;
    }

    // ---- Priority 1: B2B contract pricing ----
    if (orgId) {
      const now = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const { data: contracts } = await supabase
        .from("b2b_contracts")
        .select("id, price_list_id, name")
        .eq("organization_id", orgId)
        .eq("status", "active")
        .lte("effective_from", now)
        .gte("effective_until", now)
        .order("created_at", { ascending: false })
        .limit(1);

      if (contracts && contracts.length > 0) {
        const contract = contracts[0];

        // Look up contract price list entry for this product
        const { data: entry } = await supabase
          .from("price_list_entries")
          .select("fixed_price, discount_percentage, quantity_breaks, min_quantity, max_quantity")
          .eq("price_list_id", contract.price_list_id)
          .eq("is_active", true)
          .or(`product_id.eq.${body.productId},category.eq.${product.category}`)
          .order("product_id", { ascending: false, nullsFirst: false }) // product-specific first
          .limit(1);

        if (entry && entry.length > 0) {
          const e = entry[0];

          // Check quantity constraints
          const meetsMin = !e.min_quantity || quantity >= e.min_quantity;
          const meetsMax = !e.max_quantity || quantity <= e.max_quantity;

          if (meetsMin && meetsMax) {
            if (e.fixed_price !== null && e.fixed_price !== undefined) {
              resolvedPrice = Number(e.fixed_price);
              source = "contract";
              priceListName = contract.name;
            } else if (e.discount_percentage !== null && e.discount_percentage !== undefined) {
              resolvedPrice = retailPrice * (1 - Number(e.discount_percentage) / 100);
              source = "contract";
              priceListName = contract.name;
            }

            // Extract quantity breaks if present
            if (e.quantity_breaks && Array.isArray(e.quantity_breaks)) {
              for (const qb of e.quantity_breaks as Array<{ min_qty: number; price: number }>) {
                quantityBreaks.push({ minQty: qb.min_qty, price: qb.price });
                if (quantity >= qb.min_qty) {
                  resolvedPrice = qb.price;
                  source = "contract";
                }
              }
            }
          }
        }
      }
    }

    // ---- Priority 2: Price lists (channel / role-based) ----
    if (source === "retail") {
      // Determine user role for price list matching
      let userRole: string | null = null;
      if (body.userId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", body.userId)
          .single();
        userRole = profile?.role ?? null;
      }

      // Get dealer tier if organization
      let dealerTier: string | null = null;
      if (orgId) {
        const { data: org } = await supabase
          .from("organizations")
          .select("dealer_tier")
          .eq("id", orgId)
          .single();
        dealerTier = org?.dealer_tier ?? null;
      }

      const now = new Date().toISOString();

      // Fetch applicable price lists ordered by priority
      const { data: priceLists } = await supabase
        .from("price_lists")
        .select("id, name, priority")
        .eq("is_active", true)
        .or(`effective_from.is.null,effective_from.lte.${now}`)
        .or(`effective_until.is.null,effective_until.gte.${now}`)
        .order("priority", { ascending: false });

      if (priceLists && priceLists.length > 0) {
        for (const pl of priceLists) {
          // Check channel / role / tier applicability via a separate query
          const { data: fullPl } = await supabase
            .from("price_lists")
            .select("applies_to_channels, applies_to_roles, applies_to_dealer_tiers")
            .eq("id", pl.id)
            .single();

          if (!fullPl) continue;

          const channelMatch =
            !fullPl.applies_to_channels?.length ||
            (fullPl.applies_to_channels as string[]).includes(body.channel);
          const roleMatch =
            !fullPl.applies_to_roles?.length ||
            (userRole && (fullPl.applies_to_roles as string[]).includes(userRole));
          const tierMatch =
            !fullPl.applies_to_dealer_tiers?.length ||
            (dealerTier && (fullPl.applies_to_dealer_tiers as string[]).includes(dealerTier));

          if (!channelMatch || !roleMatch || !tierMatch) continue;

          // Fetch entry for this product or category
          const { data: entries } = await supabase
            .from("price_list_entries")
            .select("fixed_price, discount_percentage, quantity_breaks, min_quantity, max_quantity")
            .eq("price_list_id", pl.id)
            .eq("is_active", true)
            .or(`product_id.eq.${body.productId},category.eq.${product.category}`)
            .order("product_id", { ascending: false, nullsFirst: false })
            .limit(1);

          if (entries && entries.length > 0) {
            const e = entries[0];
            const meetsMin = !e.min_quantity || quantity >= e.min_quantity;
            const meetsMax = !e.max_quantity || quantity <= e.max_quantity;

            if (meetsMin && meetsMax) {
              if (e.fixed_price !== null && e.fixed_price !== undefined) {
                resolvedPrice = Number(e.fixed_price);
                source = "price_list";
                priceListName = pl.name;
              } else if (e.discount_percentage !== null && e.discount_percentage !== undefined) {
                resolvedPrice = retailPrice * (1 - Number(e.discount_percentage) / 100);
                source = "price_list";
                priceListName = pl.name;
              }

              if (e.quantity_breaks && Array.isArray(e.quantity_breaks)) {
                for (const qb of e.quantity_breaks as Array<{ min_qty: number; price: number }>) {
                  quantityBreaks.push({ minQty: qb.min_qty, price: qb.price });
                  if (quantity >= qb.min_qty) {
                    resolvedPrice = qb.price;
                    source = "volume_break";
                  }
                }
              }
              break; // Use the highest-priority matching price list
            }
          }
        }
      }
    }

    // ---- Round to 2 decimal places ----
    resolvedPrice = Math.round(resolvedPrice * 100) / 100;

    const savingsPercent =
      retailPrice > 0
        ? Math.round(((retailPrice - resolvedPrice) / retailPrice) * 10000) / 100
        : 0;

    // Sort quantity breaks by minQty ascending
    quantityBreaks.sort((a, b) => a.minQty - b.minQty);

    const result: ResolvedPrice = {
      price: resolvedPrice,
      retailPrice,
      source,
      priceListName,
      savingsPercent: Math.max(0, savingsPercent),
      quantityBreaks,
    };

    return jsonResponse(result);
  } catch (err) {
    console.error("resolve-price error:", err);
    return errorResponse("Internal server error", 500);
  }
});
