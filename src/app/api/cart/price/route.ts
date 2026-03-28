import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { resolveCartPricing } from "@/lib/pricing/engine";
import {
  getActivePromotions,
  validateCouponCode,
  applyPromotions,
} from "@/lib/pricing/promotions";
import type { ApiResponse, PriceContext } from "@/types";

interface CartPriceRequest {
  items: { productId: string; quantity: number }[];
  couponCode?: string;
  purchaseType?: "subscription" | "one_time" | "gift" | "bulk_order";
  channel?: "web" | "b2b_portal" | "vending" | "api";
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body: CartPriceRequest = await request.json();

    // Validate input
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Items array is required and must not be empty" },
        { status: 400 }
      );
    }

    for (const item of body.items) {
      if (!item.productId || typeof item.quantity !== "number" || item.quantity < 1) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "Each item must have a valid productId and quantity >= 1",
          },
          { status: 400 }
        );
      }
    }

    // Get user context (optional - unauthenticated users get retail pricing)
    const auth = await getAuthenticatedUser(supabase);
    const userId = auth?.user.id;
    const organizationId = auth?.profile.organization_id || undefined;

    const purchaseType = body.purchaseType || "one_time";
    const channel = body.channel || "web";

    const ctx: PriceContext = {
      userId,
      organizationId: organizationId ?? undefined,
      channel,
      purchaseType,
      quantity: body.items.reduce((sum, i) => sum + i.quantity, 0),
    };

    // Resolve cart pricing
    const resolvedCart = await resolveCartPricing(supabase, body.items, ctx);

    // Get automatic promotions
    const autoPromotions = await getActivePromotions(supabase, ctx);

    // Validate coupon code if provided
    let couponPromotion = undefined;
    let couponError: string | undefined;

    if (body.couponCode) {
      const validation = await validateCouponCode(
        supabase,
        body.couponCode,
        body.items,
        ctx
      );

      if (validation.valid && validation.promotionId) {
        // Fetch the full promotion record
        const { data: promo } = await supabase
          .from("promotions")
          .select("*")
          .eq("id", validation.promotionId)
          .single();

        if (promo) {
          couponPromotion = promo;
        }
      } else {
        couponError = validation.error;
      }
    }

    // Apply promotions
    const discountedCart = await applyPromotions(
      supabase,
      resolvedCart,
      autoPromotions,
      couponPromotion
    );

    const responseData = {
      ...discountedCart,
      ...(couponError ? { couponError } : {}),
    };

    return NextResponse.json<ApiResponse>({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Cart price error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json<ApiResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
