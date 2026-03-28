import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, corsResponse, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { createAdminClient, getUser } from "../_shared/auth.ts";

interface OrderItemInput {
  productId: string;
  quantity: number;
}

interface OrderRequest {
  items: OrderItemInput[];
  shippingAddress: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
  };
  purchaseType: "subscription" | "one_time" | "gift" | "bulk_order";
  boxSize?: "starter" | "voyager" | "bunker";
  couponCode?: string;
  giftCardCode?: string;
  dealerCode?: string;
  poNumber?: string;
}

const TAX_RATE = 0.0825; // 8.25% default tax rate
const FREE_SHIPPING_THRESHOLD = 75;
const FLAT_SHIPPING_RATE = 9.99;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return corsResponse();
  }

  try {
    const supabase = createAdminClient();

    // ---- Authenticate user ----
    const user = await getUser(req, supabase);
    if (!user) {
      return errorResponse("Authentication required", 401);
    }

    const body: OrderRequest = await req.json();

    // ---- Validate input ----
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return errorResponse("At least one item is required");
    }
    if (!body.shippingAddress || !body.shippingAddress.address1 || !body.shippingAddress.city) {
      return errorResponse("Valid shipping address is required");
    }
    if (!body.purchaseType) {
      return errorResponse("purchaseType is required");
    }

    // ---- Step 1: Resolve prices for all items ----
    const resolvedItems: Array<{
      productId: string;
      sku: string;
      name: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
      imageUrl: string | null;
    }> = [];

    for (const item of body.items) {
      // Fetch product details
      const { data: product, error: productError } = await supabase
        .from("aura_products")
        .select("id, sku, name, price, image_url, category, is_active")
        .eq("id", item.productId)
        .single();

      if (productError || !product) {
        return errorResponse(`Product not found: ${item.productId}`, 404);
      }
      if (!product.is_active) {
        return errorResponse(`Product is no longer available: ${product.name}`);
      }

      // Check inventory
      const { data: inv } = await supabase
        .from("inventory")
        .select("quantity, reserved_quantity")
        .eq("product_id", item.productId)
        .limit(1)
        .single();

      const available = inv ? inv.quantity - inv.reserved_quantity : 0;
      if (available < item.quantity) {
        return errorResponse(
          `Insufficient stock for ${product.name}. Available: ${available}`,
        );
      }

      // Resolve price via the pricing waterfall
      let unitPrice = Number(product.price);

      // Call resolve-price logic inline to avoid extra network hop
      // Check B2B contract pricing
      if (user.organizationId) {
        const now = new Date().toISOString().split("T")[0];
        const { data: contracts } = await supabase
          .from("b2b_contracts")
          .select("id, price_list_id")
          .eq("organization_id", user.organizationId)
          .eq("status", "active")
          .lte("effective_from", now)
          .gte("effective_until", now)
          .limit(1);

        if (contracts && contracts.length > 0) {
          const { data: entry } = await supabase
            .from("price_list_entries")
            .select("fixed_price, discount_percentage, quantity_breaks")
            .eq("price_list_id", contracts[0].price_list_id)
            .eq("is_active", true)
            .or(`product_id.eq.${item.productId},category.eq.${product.category}`)
            .order("product_id", { ascending: false, nullsFirst: false })
            .limit(1);

          if (entry && entry.length > 0) {
            const e = entry[0];
            if (e.fixed_price !== null && e.fixed_price !== undefined) {
              unitPrice = Number(e.fixed_price);
            } else if (e.discount_percentage !== null && e.discount_percentage !== undefined) {
              unitPrice = unitPrice * (1 - Number(e.discount_percentage) / 100);
            }
            // Apply quantity breaks
            if (e.quantity_breaks && Array.isArray(e.quantity_breaks)) {
              for (const qb of e.quantity_breaks as Array<{ min_qty: number; price: number }>) {
                if (item.quantity >= qb.min_qty) {
                  unitPrice = qb.price;
                }
              }
            }
          }
        }
      }

      unitPrice = Math.round(unitPrice * 100) / 100;

      resolvedItems.push({
        productId: product.id,
        sku: product.sku,
        name: product.name,
        quantity: item.quantity,
        unitPrice,
        lineTotal: Math.round(unitPrice * item.quantity * 100) / 100,
        imageUrl: product.image_url,
      });
    }

    let subtotal = resolvedItems.reduce((sum, item) => sum + item.lineTotal, 0);
    subtotal = Math.round(subtotal * 100) / 100;

    // ---- Step 2: Apply promotions/coupons ----
    let discountAmount = 0;
    let promotionId: string | null = null;
    let promotionName: string | null = null;

    if (body.couponCode) {
      const code = body.couponCode.trim().toUpperCase();

      const { data: promo } = await supabase
        .from("promotions")
        .select("*")
        .eq("coupon_code", code)
        .eq("is_active", true)
        .single();

      if (promo) {
        const now = new Date();
        const started = !promo.starts_at || new Date(promo.starts_at) <= now;
        const notExpired = !promo.ends_at || new Date(promo.ends_at) >= now;
        const underLimit = promo.usage_limit === null || promo.usage_count < promo.usage_limit;

        // Per-user limit check
        let underUserLimit = true;
        if (promo.per_user_limit !== null) {
          const { count } = await supabase
            .from("promotion_redemptions")
            .select("id", { count: "exact", head: true })
            .eq("promotion_id", promo.id)
            .eq("user_id", user.id);
          underUserLimit = count === null || count < promo.per_user_limit;
        }

        // First order check
        let firstOrderOk = true;
        if (promo.first_order_only) {
          const { count } = await supabase
            .from("aura_orders")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id);
          firstOrderOk = count === null || count === 0;
        }

        const meetsMinOrder = promo.min_order_amount === null || subtotal >= Number(promo.min_order_amount);

        if (started && notExpired && underLimit && underUserLimit && firstOrderOk && meetsMinOrder) {
          promotionId = promo.id;
          promotionName = promo.name;

          switch (promo.discount_type) {
            case "percentage":
              discountAmount = subtotal * (Number(promo.discount_value) / 100);
              break;
            case "fixed_amount":
              discountAmount = Math.min(Number(promo.discount_value), subtotal);
              break;
            case "free_shipping":
              // Handled in shipping calculation below
              break;
          }

          if (promo.max_discount_amount !== null && discountAmount > Number(promo.max_discount_amount)) {
            discountAmount = Number(promo.max_discount_amount);
          }
        }
      }
    }

    discountAmount = Math.round(discountAmount * 100) / 100;

    // ---- Step 3: Apply gift card if provided ----
    let giftCardCredit = 0;
    let giftCardId: string | null = null;

    if (body.giftCardCode) {
      const { data: gc } = await supabase
        .from("gift_cards")
        .select("id, current_balance, is_active, expires_at")
        .eq("code", body.giftCardCode.trim().toUpperCase())
        .single();

      if (gc && gc.is_active) {
        const notExpired = !gc.expires_at || new Date(gc.expires_at) > new Date();
        if (notExpired && Number(gc.current_balance) > 0) {
          giftCardId = gc.id;
          const remainingAfterDiscount = subtotal - discountAmount;
          giftCardCredit = Math.min(
            Number(gc.current_balance),
            Math.max(0, remainingAfterDiscount),
          );
          giftCardCredit = Math.round(giftCardCredit * 100) / 100;
        }
      }
    }

    // ---- Step 4: Calculate shipping + tax ----
    const afterDiscounts = subtotal - discountAmount - giftCardCredit;
    const isFreeShipping =
      afterDiscounts >= FREE_SHIPPING_THRESHOLD ||
      (promotionId !== null &&
        body.couponCode &&
        (await checkFreeShipping(supabase, body.couponCode)));

    const shipping = isFreeShipping ? 0 : FLAT_SHIPPING_RATE;
    const taxableAmount = Math.max(0, afterDiscounts);
    const tax = Math.round(taxableAmount * TAX_RATE * 100) / 100;
    const total = Math.round((afterDiscounts + shipping + tax) * 100) / 100;

    // ---- Step 5: Generate order number ----
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomPart = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
    const orderNumber = `AUR-${datePart}-${randomPart}`;

    // ---- Step 6: Look up dealer attribution ----
    let dealerAttributionId: string | null = null;
    let dealerId: string | null = null;

    if (body.dealerCode) {
      const { data: dealer } = await supabase
        .from("dealers")
        .select("id")
        .eq("referral_code", body.dealerCode.trim().toUpperCase())
        .eq("is_active", true)
        .single();

      if (dealer) {
        dealerAttributionId = dealer.id;
        dealerId = dealer.id;
      }
    }

    // ---- Step 7: Insert order ----
    const orderItems = resolvedItems.map((item) => ({
      productId: item.productId,
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      price: item.unitPrice,
      image: item.imageUrl,
    }));

    const { data: order, error: orderError } = await supabase
      .from("aura_orders")
      .insert({
        order_number: orderNumber,
        user_id: user.id,
        organization_id: user.organizationId,
        dealer_attribution_id: dealerAttributionId,
        status: "pending",
        subtotal,
        discount: discountAmount + giftCardCredit,
        shipping,
        tax,
        total: Math.max(0, total),
        currency: "USD",
        items: orderItems,
        shipping_address: body.shippingAddress,
        purchase_type: body.purchaseType,
        metadata: {
          couponCode: body.couponCode ?? null,
          giftCardCode: body.giftCardCode ?? null,
          dealerCode: body.dealerCode ?? null,
          poNumber: body.poNumber ?? null,
          boxSize: body.boxSize ?? null,
          promotionId,
          promotionName,
          giftCardId,
          giftCardCredit,
        },
        notes: body.poNumber ? `PO: ${body.poNumber}` : null,
      })
      .select()
      .single();

    if (orderError) {
      console.error("Order insert error:", orderError);
      return errorResponse("Failed to create order", 500);
    }

    // ---- Step 8: Insert normalized order items ----
    const normalizedItems = resolvedItems.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.lineTotal,
    }));

    await supabase.from("order_items").insert(normalizedItems);

    // ---- Step 9: Decrement inventory ----
    for (const item of resolvedItems) {
      // Read current quantity, then decrement
      const { data: currentInv } = await supabase
        .from("inventory")
        .select("quantity")
        .eq("product_id", item.productId)
        .limit(1)
        .single();

      if (currentInv) {
        await supabase
          .from("inventory")
          .update({ quantity: Math.max(0, currentInv.quantity - item.quantity) })
          .eq("product_id", item.productId);
      }

      // Record the inventory transaction for audit trail
      await supabase.from("inventory_transactions").insert({
        product_id: item.productId,
        warehouse_location: "el_paso",
        quantity_change: -item.quantity,
        type: "sale",
        reference_id: order.id,
        reference_type: "order",
        notes: `Order ${orderNumber}`,
      });
    }

    // ---- Step 10: Deduct gift card balance ----
    if (giftCardId && giftCardCredit > 0) {
      const { data: gc } = await supabase
        .from("gift_cards")
        .select("current_balance")
        .eq("id", giftCardId)
        .single();

      if (gc) {
        const newBalance = Math.round((Number(gc.current_balance) - giftCardCredit) * 100) / 100;
        await supabase
          .from("gift_cards")
          .update({ current_balance: newBalance })
          .eq("id", giftCardId);

        await supabase.from("gift_card_transactions").insert({
          gift_card_id: giftCardId,
          order_id: order.id,
          amount: -giftCardCredit,
          balance_after: newBalance,
          type: "debit",
          notes: `Applied to order ${orderNumber}`,
        });
      }
    }

    // ---- Step 11: Track promotion redemption ----
    if (promotionId) {
      await supabase.from("promotion_redemptions").insert({
        promotion_id: promotionId,
        user_id: user.id,
        order_id: order.id,
        discount_amount: discountAmount,
      });

      // Increment usage count
      const { data: currentPromo } = await supabase
        .from("promotions")
        .select("usage_count")
        .eq("id", promotionId)
        .single();

      await supabase
        .from("promotions")
        .update({ usage_count: (currentPromo?.usage_count ?? 0) + 1 })
        .eq("id", promotionId);
    }

    // ---- Step 12: Track dealer commission (async via Edge Function) ----
    if (dealerId) {
      // Fire-and-forget call to dealer-commission function
      const funcUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/dealer-commission`;
      fetch(funcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        },
        body: JSON.stringify({ orderId: order.id }),
      }).catch((err) => console.error("Dealer commission trigger failed:", err));
    }

    return jsonResponse({
      orderId: order.id,
      orderNumber,
      subtotal,
      discount: discountAmount,
      giftCardCredit,
      shipping,
      tax,
      total: Math.max(0, total),
      itemCount: resolvedItems.reduce((s, i) => s + i.quantity, 0),
      items: resolvedItems.map((i) => ({
        productId: i.productId,
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        lineTotal: i.lineTotal,
      })),
    });
  } catch (err) {
    console.error("process-order error:", err);
    return errorResponse("Internal server error", 500);
  }
});

async function checkFreeShipping(
  supabase: ReturnType<typeof createAdminClient>,
  couponCode: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("promotions")
    .select("discount_type")
    .eq("coupon_code", couponCode.trim().toUpperCase())
    .single();
  return data?.discount_type === "free_shipping";
}
