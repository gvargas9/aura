import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logAutomationEvent } from "@/lib/n8n/events";
import { triggerShippingNotification } from "@/lib/n8n/client";

// Service-role client for direct DB writes
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ---------------------------------------------------------------------------
// Types for common carrier webhook payloads
// ---------------------------------------------------------------------------

interface ShippingWebhookPayload {
  /** The order ID or reference we supplied to the carrier */
  orderId?: string;
  orderNumber?: string;
  trackingNumber: string;
  trackingUrl?: string;
  carrier?: string;
  status: "pre_transit" | "in_transit" | "out_for_delivery" | "delivered" | "returned" | "failure" | string;
  statusDetails?: string;
  estimatedDelivery?: string;
}

// ---------------------------------------------------------------------------
// Map carrier status to our internal order status
// ---------------------------------------------------------------------------

function mapCarrierStatus(
  carrierStatus: string
): "processing" | "shipped" | "delivered" {
  switch (carrierStatus) {
    case "pre_transit":
      return "processing";
    case "in_transit":
    case "out_for_delivery":
      return "shipped";
    case "delivered":
      return "delivered";
    default:
      return "shipped";
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  let body: ShippingWebhookPayload;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const {
    orderId,
    orderNumber,
    trackingNumber,
    trackingUrl,
    carrier,
    status,
    statusDetails,
    estimatedDelivery,
  } = body;

  if (!trackingNumber || !status) {
    return NextResponse.json(
      { error: "Missing trackingNumber or status" },
      { status: 400 }
    );
  }

  console.log(
    `[shipping-webhook] Received tracking update: ${trackingNumber} -> ${status}`
  );

  const supabaseAdmin = getServiceClient();

  // Look up the order by ID, order number, or tracking number
  let orderQuery = supabaseAdmin
    .from("aura_orders")
    .select("id, user_id, order_number");

  if (orderId) {
    orderQuery = orderQuery.eq("id", orderId);
  } else if (orderNumber) {
    orderQuery = orderQuery.eq("order_number", orderNumber);
  } else {
    orderQuery = orderQuery.eq("tracking_number", trackingNumber);
  }

  const { data: order, error: lookupError } = await orderQuery.single();

  if (lookupError || !order) {
    console.error(
      `[shipping-webhook] Order not found for tracking ${trackingNumber}:`,
      lookupError?.message ?? "no match"
    );
    // Return 200 so the carrier does not retry endlessly
    return NextResponse.json({
      received: true,
      processed: false,
      error: "Order not found",
    });
  }

  const internalStatus = mapCarrierStatus(status);

  // Update order with tracking information
  const updatePayload: Record<string, unknown> = {
    tracking_number: trackingNumber,
    status: internalStatus,
    updated_at: new Date().toISOString(),
  };

  if (trackingUrl) {
    updatePayload.tracking_url = trackingUrl;
  }

  if (internalStatus === "shipped" && !body.orderId) {
    updatePayload.shipped_at = new Date().toISOString();
  }

  if (internalStatus === "delivered") {
    updatePayload.delivered_at = new Date().toISOString();
  }

  if (statusDetails || estimatedDelivery) {
    updatePayload.metadata = {
      lastCarrierStatus: status,
      statusDetails,
      estimatedDelivery,
      carrier,
    };
  }

  const { error: updateError } = await supabaseAdmin
    .from("aura_orders")
    .update(updatePayload)
    .eq("id", order.id);

  if (updateError) {
    console.error(
      "[shipping-webhook] Failed to update order:",
      updateError.message
    );
    return NextResponse.json(
      { received: true, processed: false, error: updateError.message },
      { status: 500 }
    );
  }

  // Log the event
  await logAutomationEvent({
    userId: order.user_id,
    channel: "webhook",
    event: `shipping.${status}`,
    data: {
      orderId: order.id,
      orderNumber: order.order_number,
      trackingNumber,
      trackingUrl,
      carrier,
      status,
      statusDetails,
    },
  });

  // Trigger n8n notification workflow so the customer gets an SMS/email
  await triggerShippingNotification({
    orderId: order.id,
    orderNumber: order.order_number,
    userId: order.user_id,
    trackingNumber,
    trackingUrl: trackingUrl ?? "",
    carrier: carrier ?? "unknown",
    status,
  });

  return NextResponse.json({ received: true, processed: true });
}
