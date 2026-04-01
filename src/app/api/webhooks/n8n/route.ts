import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logAutomationEvent } from "@/lib/n8n/events";

// Service-role client for direct DB writes
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function validateWebhookSecret(request: NextRequest): boolean {
  const secret = process.env.N8N_WEBHOOK_SECRET;
  if (!secret) {
    // If no secret is configured, allow (development mode)
    console.warn("[n8n-webhook] N8N_WEBHOOK_SECRET not set -- skipping auth");
    return true;
  }
  const headerSecret =
    request.headers.get("x-n8n-secret") ??
    request.headers.get("authorization")?.replace("Bearer ", "");
  return headerSecret === secret;
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

async function handleOrderStatusUpdated(data: Record<string, unknown>) {
  const supabaseAdmin = getServiceClient();
  const orderId = data.orderId as string | undefined;
  const status = data.status as string | undefined;

  if (!orderId || !status) {
    return { success: false, error: "Missing orderId or status" };
  }

  const { error } = await supabaseAdmin
    .from("aura_orders")
    .update({
      status,
      updated_at: new Date().toISOString(),
      internal_notes: data.notes as string | undefined,
    })
    .eq("id", orderId);

  if (error) {
    console.error("[n8n-webhook] order.status_updated failed:", error.message);
    return { success: false, error: error.message };
  }

  await logAutomationEvent({
    channel: "webhook",
    event: "order.status_updated",
    data: { orderId, status },
  });

  return { success: true };
}

async function handleShipmentConfirmed(data: Record<string, unknown>) {
  const supabaseAdmin = getServiceClient();
  const orderId = data.orderId as string | undefined;
  const trackingNumber = data.trackingNumber as string | undefined;
  const trackingUrl = data.trackingUrl as string | undefined;

  if (!orderId) {
    return { success: false, error: "Missing orderId" };
  }

  const { error } = await supabaseAdmin
    .from("aura_orders")
    .update({
      status: "shipped",
      tracking_number: trackingNumber ?? null,
      tracking_url: trackingUrl ?? null,
      shipped_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) {
    console.error("[n8n-webhook] shipment.confirmed failed:", error.message);
    return { success: false, error: error.message };
  }

  // Look up the order to get the user id for logging
  const { data: order } = await supabaseAdmin
    .from("aura_orders")
    .select("user_id, order_number")
    .eq("id", orderId)
    .single();

  await logAutomationEvent({
    userId: order?.user_id,
    channel: "webhook",
    event: "shipment.confirmed",
    data: {
      orderId,
      orderNumber: order?.order_number,
      trackingNumber,
      trackingUrl,
    },
  });

  return { success: true };
}

async function handleInventoryRestocked(data: Record<string, unknown>) {
  const supabaseAdmin = getServiceClient();
  const productId = data.productId as string | undefined;
  const quantity = data.quantity as number | undefined;
  const warehouseLocation = (data.warehouseLocation as string) ?? "main";

  if (!productId || quantity === undefined) {
    return { success: false, error: "Missing productId or quantity" };
  }

  // Update inventory quantity
  const { error } = await supabaseAdmin
    .from("inventory")
    .update({
      quantity,
      last_restock_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("product_id", productId)
    .eq("warehouse_location", warehouseLocation);

  if (error) {
    console.error(
      "[n8n-webhook] inventory.restocked failed:",
      error.message
    );
    return { success: false, error: error.message };
  }

  // Also update the stock level on the product itself
  await supabaseAdmin
    .from("aura_products")
    .update({
      stock_level: quantity,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  // Record the inventory transaction
  await supabaseAdmin.from("inventory_transactions").insert({
    product_id: productId,
    warehouse_location: warehouseLocation,
    quantity_change: quantity,
    type: "restock",
    reference_type: "n8n_webhook",
    notes: (data.notes as string) ?? "Restocked via n8n automation",
  });

  await logAutomationEvent({
    channel: "webhook",
    event: "inventory.restocked",
    data: { productId, quantity, warehouseLocation },
  });

  return { success: true };
}

async function handleSubscriptionReminderSent(data: Record<string, unknown>) {
  const userId = data.userId as string | undefined;
  const subscriptionId = data.subscriptionId as string | undefined;
  const reminderType = (data.reminderType as string) ?? "delivery_reminder";

  await logAutomationEvent({
    userId: userId ?? undefined,
    channel: "webhook",
    event: "subscription.reminder_sent",
    data: { subscriptionId, reminderType, ...data },
  });

  return { success: true };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // Validate webhook authentication
  if (!validateWebhookSecret(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const eventType = body.event as string | undefined;
  const data = (body.data as Record<string, unknown>) ?? {};

  if (!eventType) {
    return NextResponse.json(
      { error: "Missing event type" },
      { status: 400 }
    );
  }

  console.log(`[n8n-webhook] Received event: ${eventType}`);

  let result: { success: boolean; error?: string };

  switch (eventType) {
    case "order.status_updated":
      result = await handleOrderStatusUpdated(data);
      break;

    case "shipment.confirmed":
      result = await handleShipmentConfirmed(data);
      break;

    case "inventory.restocked":
      result = await handleInventoryRestocked(data);
      break;

    case "subscription.reminder_sent":
      result = await handleSubscriptionReminderSent(data);
      break;

    default:
      console.log(`[n8n-webhook] Unhandled event type: ${eventType}`);
      await logAutomationEvent({
        channel: "webhook",
        event: `unhandled.${eventType}`,
        data: { eventType, data },
      });
      result = { success: true };
  }

  if (!result.success) {
    return NextResponse.json(
      { received: true, processed: false, error: result.error },
      { status: 422 }
    );
  }

  return NextResponse.json({ received: true, processed: true });
}
