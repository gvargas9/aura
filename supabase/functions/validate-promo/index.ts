import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, corsResponse, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { createAdminClient, getUser } from "../_shared/auth.ts";

interface CartItem {
  productId: string;
  quantity: number;
  price: number;
}

interface PromoRequest {
  code: string;
  cartItems: CartItem[];
  userId: string;
}

interface PromoResult {
  valid: boolean;
  discount: number;
  discountType: string;
  message: string;
  promotionId?: string;
  promotionName?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return corsResponse();
  }

  try {
    const supabase = createAdminClient();
    const body: PromoRequest = await req.json();

    if (!body.code || !body.cartItems || !Array.isArray(body.cartItems)) {
      return errorResponse("Missing required fields: code, cartItems");
    }

    const code = body.code.trim().toUpperCase();
    const now = new Date().toISOString();

    // ---- Fetch promotion by coupon code ----
    const { data: promo, error: promoError } = await supabase
      .from("promotions")
      .select("*")
      .eq("coupon_code", code)
      .eq("is_active", true)
      .single();

    if (promoError || !promo) {
      // Fallback: check legacy promo_codes table
      const { data: legacyPromo } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", code)
        .eq("is_active", true)
        .single();

      if (!legacyPromo) {
        return jsonResponse({
          valid: false,
          discount: 0,
          discountType: "",
          message: "Invalid promo code",
        } as PromoResult);
      }

      // Validate legacy promo code
      return await validateLegacyPromo(supabase, legacyPromo, body);
    }

    // ---- Date range check ----
    if (promo.starts_at && new Date(promo.starts_at) > new Date()) {
      return jsonResponse({
        valid: false,
        discount: 0,
        discountType: promo.discount_type,
        message: "This promo code is not yet active",
      } as PromoResult);
    }

    if (promo.ends_at && new Date(promo.ends_at) < new Date()) {
      return jsonResponse({
        valid: false,
        discount: 0,
        discountType: promo.discount_type,
        message: "This promo code has expired",
      } as PromoResult);
    }

    // ---- Global usage limit ----
    if (promo.usage_limit !== null && promo.usage_count >= promo.usage_limit) {
      return jsonResponse({
        valid: false,
        discount: 0,
        discountType: promo.discount_type,
        message: "This promo code has reached its usage limit",
      } as PromoResult);
    }

    // ---- Per-user usage limit ----
    if (body.userId && promo.per_user_limit !== null) {
      const { count } = await supabase
        .from("promotion_redemptions")
        .select("id", { count: "exact", head: true })
        .eq("promotion_id", promo.id)
        .eq("user_id", body.userId);

      if (count !== null && count >= promo.per_user_limit) {
        return jsonResponse({
          valid: false,
          discount: 0,
          discountType: promo.discount_type,
          message: "You have already used this promo code the maximum number of times",
        } as PromoResult);
      }
    }

    // ---- First order only check ----
    if (promo.first_order_only && body.userId) {
      const { count } = await supabase
        .from("aura_orders")
        .select("id", { count: "exact", head: true })
        .eq("user_id", body.userId);

      if (count !== null && count > 0) {
        return jsonResponse({
          valid: false,
          discount: 0,
          discountType: promo.discount_type,
          message: "This promo code is only valid for first orders",
        } as PromoResult);
      }
    }

    // ---- Calculate cart subtotal and filter applicable items ----
    let applicableItems = body.cartItems;

    // Filter by applicable products if specified
    if (promo.applicable_product_ids && promo.applicable_product_ids.length > 0) {
      applicableItems = applicableItems.filter((item) =>
        promo.applicable_product_ids.includes(item.productId)
      );
    }

    // Filter by applicable categories if specified
    if (promo.applicable_categories && promo.applicable_categories.length > 0) {
      const { data: products } = await supabase
        .from("aura_products")
        .select("id, category")
        .in(
          "id",
          applicableItems.map((i) => i.productId),
        );

      if (products) {
        const validIds = new Set(
          products
            .filter((p) => promo.applicable_categories.includes(p.category))
            .map((p) => p.id),
        );
        applicableItems = applicableItems.filter((item) =>
          validIds.has(item.productId)
        );
      }
    }

    // Exclude excluded products
    if (promo.excluded_product_ids && promo.excluded_product_ids.length > 0) {
      applicableItems = applicableItems.filter(
        (item) => !promo.excluded_product_ids.includes(item.productId),
      );
    }

    if (applicableItems.length === 0) {
      return jsonResponse({
        valid: false,
        discount: 0,
        discountType: promo.discount_type,
        message: "No items in your cart are eligible for this promo code",
      } as PromoResult);
    }

    const applicableSubtotal = applicableItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const fullSubtotal = body.cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // ---- Minimum order amount check ----
    if (promo.min_order_amount !== null && fullSubtotal < Number(promo.min_order_amount)) {
      return jsonResponse({
        valid: false,
        discount: 0,
        discountType: promo.discount_type,
        message: `Minimum order amount of $${Number(promo.min_order_amount).toFixed(2)} required`,
      } as PromoResult);
    }

    // ---- Minimum quantity check ----
    if (promo.min_quantity !== null) {
      const totalQty = body.cartItems.reduce((sum, item) => sum + item.quantity, 0);
      if (totalQty < promo.min_quantity) {
        return jsonResponse({
          valid: false,
          discount: 0,
          discountType: promo.discount_type,
          message: `Minimum ${promo.min_quantity} items required`,
        } as PromoResult);
      }
    }

    // ---- Calculate discount ----
    let discount = 0;

    switch (promo.discount_type) {
      case "percentage":
        discount = applicableSubtotal * (Number(promo.discount_value) / 100);
        break;
      case "fixed_amount":
        discount = Math.min(Number(promo.discount_value), applicableSubtotal);
        break;
      case "free_shipping":
        discount = 0; // Shipping handled at checkout
        break;
      case "bogo":
        if (promo.bogo_buy_quantity && promo.bogo_get_quantity && promo.bogo_get_discount_pct) {
          // Simplified BOGO: find the cheapest eligible items to discount
          const sortedItems = [...applicableItems].sort((a, b) => a.price - b.price);
          const totalQty = sortedItems.reduce((s, i) => s + i.quantity, 0);
          const sets = Math.floor(totalQty / (promo.bogo_buy_quantity + promo.bogo_get_quantity));
          let freeQty = sets * promo.bogo_get_quantity;
          for (const item of sortedItems) {
            const discountQty = Math.min(freeQty, item.quantity);
            discount += discountQty * item.price * (Number(promo.bogo_get_discount_pct) / 100);
            freeQty -= discountQty;
            if (freeQty <= 0) break;
          }
        }
        break;
      case "volume": {
        if (promo.volume_breaks && Array.isArray(promo.volume_breaks)) {
          const totalQty = applicableItems.reduce((s, i) => s + i.quantity, 0);
          const breaks = (promo.volume_breaks as Array<{ min_qty: number; discount_pct: number }>)
            .sort((a, b) => b.min_qty - a.min_qty);
          for (const vb of breaks) {
            if (totalQty >= vb.min_qty) {
              discount = applicableSubtotal * (vb.discount_pct / 100);
              break;
            }
          }
        }
        break;
      }
      default:
        discount = 0;
    }

    // ---- Cap discount if max_discount_amount is set ----
    if (promo.max_discount_amount !== null && discount > Number(promo.max_discount_amount)) {
      discount = Number(promo.max_discount_amount);
    }

    discount = Math.round(discount * 100) / 100;

    const result: PromoResult = {
      valid: true,
      discount,
      discountType: promo.discount_type,
      message:
        promo.discount_type === "free_shipping"
          ? "Free shipping applied!"
          : `Discount of $${discount.toFixed(2)} applied`,
      promotionId: promo.id,
      promotionName: promo.name,
    };

    return jsonResponse(result);
  } catch (err) {
    console.error("validate-promo error:", err);
    return errorResponse("Internal server error", 500);
  }
});

/**
 * Validate against the legacy promo_codes table (migration compatibility).
 */
async function validateLegacyPromo(
  supabase: ReturnType<typeof createAdminClient>,
  promo: Record<string, unknown>,
  body: PromoRequest,
) {
  const now = new Date();

  if (promo.valid_from && new Date(promo.valid_from as string) > now) {
    return jsonResponse({ valid: false, discount: 0, discountType: "", message: "Promo code not yet active" });
  }
  if (promo.valid_until && new Date(promo.valid_until as string) < now) {
    return jsonResponse({ valid: false, discount: 0, discountType: "", message: "Promo code has expired" });
  }
  if (promo.usage_limit !== null && (promo.usage_count as number) >= (promo.usage_limit as number)) {
    return jsonResponse({ valid: false, discount: 0, discountType: "", message: "Usage limit reached" });
  }

  const subtotal = body.cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  if (promo.min_order_amount !== null && subtotal < Number(promo.min_order_amount)) {
    return jsonResponse({
      valid: false,
      discount: 0,
      discountType: "",
      message: `Minimum order of $${Number(promo.min_order_amount).toFixed(2)} required`,
    });
  }

  let discount = 0;
  const discountType = promo.discount_type as string;

  switch (discountType) {
    case "percentage":
      discount = subtotal * (Number(promo.discount_value) / 100);
      break;
    case "fixed":
      discount = Math.min(Number(promo.discount_value), subtotal);
      break;
    case "free_shipping":
      discount = 0;
      break;
  }

  if (promo.max_discount !== null && promo.max_discount !== undefined && discount > Number(promo.max_discount)) {
    discount = Number(promo.max_discount);
  }

  discount = Math.round(discount * 100) / 100;

  return jsonResponse({
    valid: true,
    discount,
    discountType,
    message:
      discountType === "free_shipping"
        ? "Free shipping applied!"
        : `Discount of $${discount.toFixed(2)} applied`,
  } as PromoResult);
}
