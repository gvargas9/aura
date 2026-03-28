import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, isAuthError } from "@/lib/api/auth";
import { getTracking } from "@/lib/shipping/client";
import type { TrackingInfo } from "@/lib/shipping/types";
import type { ApiResponse } from "@/types";
import type { Json } from "@/types/database";

// ---------------------------------------------------------------------------
// GET /api/shipping/track?orderId=xxx  OR  ?trackingNumber=xxx
//
// Auth required: order owner, admin, or attributed dealer.
// Returns full tracking timeline from the carrier.
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const auth = await requireAuth(supabase);

    if (isAuthError(auth)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const { profile } = auth;
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get("orderId");
    const trackingNumberParam = searchParams.get("trackingNumber");

    if (!orderId && !trackingNumberParam) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "orderId or trackingNumber query parameter is required" },
        { status: 400 }
      );
    }

    // Look up the order
    let orderQuery = supabase
      .from("aura_orders")
      .select("id, user_id, order_number, tracking_number, tracking_url, status, metadata, dealer_attribution_id");

    if (orderId) {
      orderQuery = orderQuery.eq("id", orderId);
    } else {
      orderQuery = orderQuery.eq("tracking_number", trackingNumberParam!);
    }

    const { data: order, error: orderError } = await orderQuery.single();

    if (orderError || !order) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Authorization: owner, admin, or attributed dealer
    if (profile.role === "admin") {
      // Full access
    } else if (profile.role === "dealer") {
      const { data: dealer } = await supabase
        .from("dealers")
        .select("id")
        .eq("profile_id", profile.id)
        .single();

      if (!dealer || order.dealer_attribution_id !== dealer.id) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "Order not found" },
          { status: 404 }
        );
      }
    } else if (order.user_id !== profile.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (!order.tracking_number) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "This order has not been shipped yet" },
        { status: 404 }
      );
    }

    // Extract carrier from order metadata
    const metadata = order.metadata as Record<string, Json> | null;
    const carrier = (metadata?.carrier as string) ?? "USPS";

    const tracking: TrackingInfo = await getTracking(
      order.tracking_number,
      carrier
    );

    return NextResponse.json<ApiResponse<TrackingInfo>>({
      success: true,
      data: tracking,
    });
  } catch (error) {
    console.error("Tracking fetch error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to fetch tracking information" },
      { status: 500 }
    );
  }
}
