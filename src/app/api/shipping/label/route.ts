import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, isAuthError } from "@/lib/api/auth";
import { createLabel, isUsingMockProvider } from "@/lib/shipping/client";
import { triggerShippingNotification } from "@/lib/n8n/client";
import type { ShipmentLabel } from "@/lib/shipping/types";
import type { ApiResponse } from "@/types";

// ---------------------------------------------------------------------------
// POST /api/shipping/label
//
// Admin-only. Purchases a shipping label for a given order using a previously
// quoted rate ID. Updates the order record with tracking information and sets
// the status to "shipped".
// ---------------------------------------------------------------------------

interface LabelRequestBody {
  orderId: string;
  rateId: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const auth = await requireAdmin(supabase);

    if (isAuthError(auth)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const body: LabelRequestBody = await request.json();

    if (!body.orderId || !body.rateId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "orderId and rateId are required" },
        { status: 400 }
      );
    }

    // Verify order exists and is in a shippable state
    const { data: order, error: orderError } = await supabase
      .from("aura_orders")
      .select("id, order_number, user_id, status, tracking_number")
      .eq("id", body.orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.status === "delivered" || order.status === "cancelled") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `Cannot create label for an order with status "${order.status}"`,
        },
        { status: 400 }
      );
    }

    if (order.tracking_number) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "This order already has a shipping label. Cancel it first to create a new one.",
        },
        { status: 409 }
      );
    }

    // Purchase the label
    const label: ShipmentLabel = await createLabel(body.rateId, order.id);

    // Update order record
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("aura_orders")
      .update({
        tracking_number: label.trackingNumber,
        tracking_url: label.trackingUrl,
        status: "shipped" as const,
        shipped_at: now,
        metadata: {
          carrier: label.carrier,
          service: label.service,
          shippingRate: label.rate,
          labelUrl: label.labelUrl,
          mockMode: isUsingMockProvider(),
        },
        updated_at: now,
      })
      .eq("id", order.id);

    if (updateError) {
      console.error("Failed to update order after label creation:", updateError);
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Label created but failed to update order record" },
        { status: 500 }
      );
    }

    // Fire-and-forget: notify customer via n8n
    triggerShippingNotification({
      orderId: order.id,
      orderNumber: order.order_number,
      userId: order.user_id,
      trackingNumber: label.trackingNumber,
      trackingUrl: label.trackingUrl,
      carrier: label.carrier,
      status: "shipped",
    });

    return NextResponse.json<ApiResponse<ShipmentLabel>>({
      success: true,
      data: label,
      message: "Shipping label created and order marked as shipped",
    });
  } catch (error) {
    console.error("Shipping label creation error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to create shipping label" },
      { status: 500 }
    );
  }
}
