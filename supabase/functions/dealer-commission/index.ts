import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, corsResponse, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { createAdminClient, requireServiceRole } from "../_shared/auth.ts";

interface CommissionRequest {
  orderId: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return corsResponse();
  }

  try {
    const supabase = createAdminClient();

    // ---- Service role only (internal calls) ----
    if (!requireServiceRole(req)) {
      return errorResponse("Service role access required", 403);
    }

    const body: CommissionRequest = await req.json();

    if (!body.orderId) {
      return errorResponse("orderId is required");
    }

    // ---- Idempotency check: skip if commission already exists for this order ----
    const { count: existingCount } = await supabase
      .from("commission_transactions")
      .select("id", { count: "exact", head: true })
      .eq("order_id", body.orderId)
      .eq("type", "earned");

    if (existingCount !== null && existingCount > 0) {
      return jsonResponse({
        success: true,
        message: "Commission already processed for this order",
        skipped: true,
      });
    }

    // ---- Fetch order with dealer attribution ----
    const { data: order, error: orderError } = await supabase
      .from("aura_orders")
      .select("id, order_number, total, subtotal, dealer_attribution_id, organization_id")
      .eq("id", body.orderId)
      .single();

    if (orderError || !order) {
      return errorResponse("Order not found", 404);
    }

    if (!order.dealer_attribution_id) {
      return jsonResponse({
        success: true,
        message: "No dealer attribution on this order",
        skipped: true,
      });
    }

    // ---- Get dealer and organization ----
    const { data: dealer, error: dealerError } = await supabase
      .from("dealers")
      .select("id, profile_id, organization_id, is_active")
      .eq("id", order.dealer_attribution_id)
      .single();

    if (dealerError || !dealer) {
      return errorResponse("Dealer not found", 404);
    }

    if (!dealer.is_active) {
      return jsonResponse({
        success: true,
        message: "Dealer is inactive, commission not awarded",
        skipped: true,
      });
    }

    // ---- Get commission rate from organization ----
    const { data: org } = await supabase
      .from("organizations")
      .select("commission_rate, name")
      .eq("id", dealer.organization_id)
      .single();

    const commissionRate = org?.commission_rate ? Number(org.commission_rate) : 0.10;

    // ---- Calculate commission ----
    // Commission is based on the order subtotal (before tax/shipping)
    const commissionableAmount = Number(order.subtotal);
    const commissionAmount = Math.round(commissionableAmount * commissionRate * 100) / 100;

    if (commissionAmount <= 0) {
      return jsonResponse({
        success: true,
        message: "Commission amount is zero",
        skipped: true,
      });
    }

    // ---- Insert commission transaction ----
    const { error: txError } = await supabase.from("commission_transactions").insert({
      dealer_id: dealer.id,
      order_id: order.id,
      amount: commissionAmount,
      type: "earned",
      status: "pending",
      notes: `Commission on order ${order.order_number} at ${(commissionRate * 100).toFixed(1)}% rate`,
    });

    if (txError) {
      console.error("Commission transaction insert error:", txError);
      return errorResponse("Failed to record commission", 500);
    }

    // ---- Update dealer totals ----
    const { data: currentDealer } = await supabase
      .from("dealers")
      .select("commission_earned, commission_pending")
      .eq("id", dealer.id)
      .single();

    if (currentDealer) {
      await supabase
        .from("dealers")
        .update({
          commission_earned:
            Math.round((Number(currentDealer.commission_earned) + commissionAmount) * 100) / 100,
          commission_pending:
            Math.round((Number(currentDealer.commission_pending) + commissionAmount) * 100) / 100,
        })
        .eq("id", dealer.id);
    }

    return jsonResponse({
      success: true,
      dealerId: dealer.id,
      orderId: order.id,
      orderNumber: order.order_number,
      commissionRate,
      commissionableAmount,
      commissionAmount,
      organizationName: org?.name ?? null,
    });
  } catch (err) {
    console.error("dealer-commission error:", err);
    return errorResponse("Internal server error", 500);
  }
});
