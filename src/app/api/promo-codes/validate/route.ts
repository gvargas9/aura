import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, isAuthError } from "@/lib/api/auth";
import { applyRateLimit, rateLimiters } from "@/lib/api/rate-limit";
import { safeError } from "@/lib/api/safe-error";
import type { ApiResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 20 requests/minute
    const rateLimitResponse = await applyRateLimit(request, rateLimiters.promoValidate);
    if (rateLimitResponse) return rateLimitResponse;

    const supabase = await createClient();
    const auth = await requireAuth(supabase);

    if (isAuthError(auth)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const { profile } = auth;
    const body = await request.json();
    const { code, cart_total, product_ids, categories } = body;

    if (!code) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Missing required field: code" },
        { status: 400 }
      );
    }

    if (cart_total === undefined || typeof cart_total !== "number") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Missing or invalid cart_total" },
        { status: 400 }
      );
    }

    // Fetch the promo code
    const { data: promo, error } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", code.toUpperCase())
      .single();

    if (error || !promo) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Invalid promo code" },
        { status: 404 }
      );
    }

    // Check is_active
    if (!promo.is_active) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "This promo code is no longer active" },
        { status: 400 }
      );
    }

    const now = new Date();

    // Check valid_from
    if (promo.valid_from && new Date(promo.valid_from) > now) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "This promo code is not yet valid" },
        { status: 400 }
      );
    }

    // Check valid_until
    if (promo.valid_until && new Date(promo.valid_until) < now) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "This promo code has expired" },
        { status: 400 }
      );
    }

    // Check usage_limit
    if (
      promo.usage_limit !== null &&
      promo.usage_count >= promo.usage_limit
    ) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "This promo code has reached its usage limit" },
        { status: 400 }
      );
    }

    // Check per_user_limit by counting orders with this promo for the user
    if (promo.per_user_limit !== null) {
      // We count orders where the user used this promo via metadata or a separate tracking table
      // For simplicity, we check orders that have a discount and were placed by this user
      // A more robust approach would use a dedicated promo_usage table
      const { count: userUsageCount } = await supabase
        .from("aura_orders")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .contains("metadata" as never, { promo_code: code.toUpperCase() } as never);

      if (
        userUsageCount !== null &&
        userUsageCount >= promo.per_user_limit
      ) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "You have reached the usage limit for this promo code",
          },
          { status: 400 }
        );
      }
    }

    // Check min_order_amount
    if (promo.min_order_amount && cart_total < promo.min_order_amount) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `Minimum order amount of $${promo.min_order_amount.toFixed(2)} required`,
        },
        { status: 400 }
      );
    }

    // Check applicable_products
    if (
      promo.applicable_products &&
      Array.isArray(promo.applicable_products) &&
      promo.applicable_products.length > 0 &&
      product_ids
    ) {
      const hasApplicableProduct = product_ids.some((pid: string) =>
        promo.applicable_products!.includes(pid)
      );
      if (!hasApplicableProduct) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "This promo code does not apply to the items in your cart",
          },
          { status: 400 }
        );
      }
    }

    // Check applicable_categories
    if (
      promo.applicable_categories &&
      Array.isArray(promo.applicable_categories) &&
      promo.applicable_categories.length > 0 &&
      categories
    ) {
      const hasApplicableCategory = categories.some((cat: string) =>
        promo.applicable_categories!.includes(cat)
      );
      if (!hasApplicableCategory) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error:
              "This promo code does not apply to the categories in your cart",
          },
          { status: 400 }
        );
      }
    }

    // Calculate discount amount
    let discountAmount = 0;

    switch (promo.discount_type) {
      case "percentage":
        discountAmount = (cart_total * promo.discount_value) / 100;
        break;
      case "fixed":
        discountAmount = promo.discount_value;
        break;
      case "free_shipping":
        discountAmount = 0; // Shipping discount handled separately
        break;
    }

    // Apply max_discount cap
    if (promo.max_discount && discountAmount > promo.max_discount) {
      discountAmount = promo.max_discount;
    }

    // Discount should not exceed cart total
    if (discountAmount > cart_total) {
      discountAmount = cart_total;
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        valid: true,
        code: promo.code,
        discount_type: promo.discount_type,
        discount_value: promo.discount_value,
        discount_amount: Math.round(discountAmount * 100) / 100,
        free_shipping: promo.discount_type === "free_shipping",
        description: promo.description,
      },
      message: "Promo code is valid",
    });
  } catch (error) {
    console.error("Promo code validation error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, ...safeError(error, "Internal server error") },
      { status: 500 }
    );
  }
}
