import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, corsResponse, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { createAdminClient, requireServiceRole } from "../_shared/auth.ts";

type SubscriptionEvent =
  | "subscription.renewed"
  | "subscription.paused"
  | "subscription.cancelled"
  | "subscription.box_updated";

interface WebhookRequest {
  event: SubscriptionEvent;
  subscriptionId: string;
  data: Record<string, unknown>;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return corsResponse();
  }

  try {
    const supabase = createAdminClient();
    const body: WebhookRequest = await req.json();

    if (!body.event || !body.subscriptionId) {
      return errorResponse("Missing required fields: event, subscriptionId");
    }

    // ---- Fetch subscription ----
    const { data: subscription, error: subError } = await supabase
      .from("aura_subscriptions")
      .select("*")
      .eq("id", body.subscriptionId)
      .single();

    if (subError || !subscription) {
      return errorResponse("Subscription not found", 404);
    }

    let result: Record<string, unknown> = {};

    switch (body.event) {
      case "subscription.renewed":
        result = await handleRenewal(supabase, subscription, body.data);
        break;
      case "subscription.paused":
        result = await handlePause(supabase, subscription, body.data);
        break;
      case "subscription.cancelled":
        result = await handleCancellation(supabase, subscription, body.data);
        break;
      case "subscription.box_updated":
        result = await handleBoxUpdate(supabase, subscription, body.data);
        break;
      default:
        return errorResponse(`Unknown event: ${body.event}`);
    }

    // ---- Log event to omni_interaction_log ----
    await supabase.from("omni_interaction_log").insert({
      user_id: subscription.user_id,
      channel: "web",
      direction: "inbound",
      content: JSON.stringify({
        event: body.event,
        subscriptionId: body.subscriptionId,
        data: body.data,
        result,
      }),
      content_type: "system",
      intent: body.event,
      metadata: {
        source: "subscription-webhook",
        subscriptionId: body.subscriptionId,
        event: body.event,
      },
    });

    return jsonResponse({ success: true, event: body.event, ...result });
  } catch (err) {
    console.error("subscription-webhook error:", err);
    return errorResponse("Internal server error", 500);
  }
});

/**
 * Handle subscription renewal: create a new order and decrement inventory.
 */
async function handleRenewal(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Record<string, unknown>,
  data: Record<string, unknown>,
) {
  const boxConfig = subscription.box_config as string[] | null;
  if (!boxConfig || boxConfig.length === 0) {
    return { error: "No products configured in subscription box" };
  }

  // Fetch products from box config
  const { data: products } = await supabase
    .from("aura_products")
    .select("id, sku, name, price, image_url")
    .in("id", boxConfig);

  if (!products || products.length === 0) {
    return { error: "No valid products found in box config" };
  }

  // Build order items (each product qty=1 in a box)
  const orderItems = products.map((p) => ({
    productId: p.id,
    sku: p.sku,
    name: p.name,
    quantity: 1,
    price: Number(p.price),
    image: p.image_url,
  }));

  const subtotal = orderItems.reduce((s, i) => s + i.price, 0);

  // Generate order number
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  const orderNumber = `AUR-${datePart}-${randomPart}`;

  // Create the order
  const { data: order, error: orderError } = await supabase
    .from("aura_orders")
    .insert({
      order_number: orderNumber,
      user_id: subscription.user_id,
      subscription_id: subscription.id,
      organization_id: null,
      status: "pending",
      subtotal,
      discount: 0,
      shipping: 0,
      tax: Math.round(subtotal * 0.0825 * 100) / 100,
      total: Math.round(subtotal * 1.0825 * 100) / 100,
      currency: "USD",
      items: orderItems,
      shipping_address: subscription.shipping_address,
      purchase_type: "subscription",
    })
    .select("id, order_number, total")
    .single();

  if (orderError) {
    console.error("Renewal order error:", orderError);
    return { error: "Failed to create renewal order" };
  }

  // Decrement inventory for each product
  for (const item of orderItems) {
    const { data: inv } = await supabase
      .from("inventory")
      .select("quantity")
      .eq("product_id", item.productId)
      .limit(1)
      .single();

    if (inv) {
      await supabase
        .from("inventory")
        .update({ quantity: Math.max(0, inv.quantity - item.quantity) })
        .eq("product_id", item.productId);

      await supabase.from("inventory_transactions").insert({
        product_id: item.productId,
        warehouse_location: "el_paso",
        quantity_change: -item.quantity,
        type: "sale",
        reference_id: order.id,
        reference_type: "order",
        notes: `Subscription renewal ${orderNumber}`,
      });
    }
  }

  // Update next delivery date
  const freq = (subscription.delivery_frequency_days as number) || 30;
  const nextDelivery = new Date();
  nextDelivery.setDate(nextDelivery.getDate() + freq);

  await supabase
    .from("aura_subscriptions")
    .update({ next_delivery_date: nextDelivery.toISOString().split("T")[0] })
    .eq("id", subscription.id);

  return { orderId: order.id, orderNumber: order.order_number, total: order.total };
}

/**
 * Handle subscription pause.
 */
async function handlePause(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Record<string, unknown>,
  data: Record<string, unknown>,
) {
  const pauseUntil = data.pauseUntil as string | undefined;

  const updatePayload: Record<string, unknown> = {
    status: "paused",
  };

  if (pauseUntil) {
    updatePayload.pause_until = pauseUntil;
  }

  const { error } = await supabase
    .from("aura_subscriptions")
    .update(updatePayload)
    .eq("id", subscription.id);

  if (error) {
    console.error("Pause error:", error);
    return { error: "Failed to pause subscription" };
  }

  return { status: "paused", pauseUntil: pauseUntil ?? null };
}

/**
 * Handle subscription cancellation with churn tracking.
 */
async function handleCancellation(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Record<string, unknown>,
  data: Record<string, unknown>,
) {
  const reason = (data.reason as string) ?? "No reason provided";

  const { error } = await supabase
    .from("aura_subscriptions")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason,
    })
    .eq("id", subscription.id);

  if (error) {
    console.error("Cancellation error:", error);
    return { error: "Failed to cancel subscription" };
  }

  // Update user's churn risk score to 1.0 (churned)
  await supabase
    .from("profiles")
    .update({ churn_risk_score: 1.0 })
    .eq("id", subscription.user_id);

  // Calculate subscription lifetime
  const createdAt = new Date(subscription.created_at as string);
  const lifetimeDays = Math.floor(
    (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24),
  );

  return {
    status: "cancelled",
    reason,
    lifetimeDays,
    cancelledAt: new Date().toISOString(),
  };
}

/**
 * Handle box configuration update.
 */
async function handleBoxUpdate(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Record<string, unknown>,
  data: Record<string, unknown>,
) {
  const newBoxConfig = data.boxConfig as string[] | undefined;
  const newBoxSize = data.boxSize as string | undefined;

  if (!newBoxConfig || !Array.isArray(newBoxConfig) || newBoxConfig.length === 0) {
    return { error: "boxConfig array is required" };
  }

  // Validate box size constraints
  const sizeSlots: Record<string, number> = {
    starter: 8,
    voyager: 12,
    bunker: 24,
  };
  const currentSize = (newBoxSize ?? subscription.box_size) as string;
  const maxSlots = sizeSlots[currentSize] ?? 24;

  if (newBoxConfig.length > maxSlots) {
    return {
      error: `Box size "${currentSize}" supports max ${maxSlots} items. Got ${newBoxConfig.length}.`,
    };
  }

  // Validate all product IDs exist
  const { data: products, error: prodError } = await supabase
    .from("aura_products")
    .select("id")
    .in("id", newBoxConfig)
    .eq("is_active", true);

  if (prodError || !products) {
    return { error: "Failed to validate products" };
  }

  const validIds = new Set(products.map((p) => p.id));
  const invalidIds = newBoxConfig.filter((id) => !validIds.has(id));

  if (invalidIds.length > 0) {
    return { error: `Invalid or inactive product IDs: ${invalidIds.join(", ")}` };
  }

  const updatePayload: Record<string, unknown> = {
    box_config: newBoxConfig,
  };

  if (newBoxSize && sizeSlots[newBoxSize]) {
    updatePayload.box_size = newBoxSize;
  }

  const { error } = await supabase
    .from("aura_subscriptions")
    .update(updatePayload)
    .eq("id", subscription.id);

  if (error) {
    console.error("Box update error:", error);
    return { error: "Failed to update box configuration" };
  }

  // Record selection history
  const nextDelivery = subscription.next_delivery_date as string | null;
  if (nextDelivery) {
    await supabase.from("subscription_selections").upsert(
      {
        subscription_id: subscription.id as string,
        delivery_date: nextDelivery,
        product_ids: newBoxConfig,
        is_confirmed: true,
        confirmed_at: new Date().toISOString(),
      },
      { onConflict: "subscription_id,delivery_date" },
    );
  }

  return {
    boxConfig: newBoxConfig,
    boxSize: updatePayload.box_size ?? currentSize,
    itemCount: newBoxConfig.length,
  };
}
