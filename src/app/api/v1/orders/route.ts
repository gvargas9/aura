import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, isApiKeyError, hasScope } from "@/lib/api/api-keys";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { sanitizeString, validateEmail, validateUUID } from "@/lib/api/validation";
import { safeError } from "@/lib/api/safe-error";
import { createClient } from "@supabase/supabase-js";
import type { ApiResponse } from "@/types";

interface OrderItem {
  product_id: string;
  quantity: number;
}

interface CreateOrderBody {
  storefront_slug: string;
  items: OrderItem[];
  customer_email: string;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate via API key
    const auth = await validateApiKey(request);
    if (isApiKeyError(auth)) return auth;

    // Check scope
    if (!hasScope(auth, "orders:write")) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Insufficient scope: orders:write required" },
        { status: 403 }
      );
    }

    // Rate limit per API key
    const rl = await applyRateLimit(request, {
      windowMs: 60_000,
      maxRequests: auth.rate_limit,
      keyGenerator: () => `apikey:${auth.key_id}`,
    });
    if (rl) return rl;

    const body: CreateOrderBody = await request.json();

    // Validate required fields
    if (!body.storefront_slug || !body.items || !body.customer_email) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Missing required fields: storefront_slug, items, customer_email",
        },
        { status: 400 }
      );
    }

    if (!validateEmail(body.customer_email)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Items must be a non-empty array" },
        { status: 400 }
      );
    }

    // Validate each item
    for (const item of body.items) {
      if (!item.product_id || !validateUUID(item.product_id)) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: `Invalid product_id: ${item.product_id}` },
          { status: 400 }
        );
      }
      if (
        typeof item.quantity !== "number" ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1
      ) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: `Invalid quantity for product ${item.product_id}: must be a positive integer`,
          },
          { status: 400 }
        );
      }
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify storefront belongs to this organization
    const sanitizedSlug = sanitizeString(body.storefront_slug);
    const { data: storefront } = await supabase
      .from("storefronts")
      .select("id, organization_id, is_active")
      .eq("slug", sanitizedSlug)
      .eq("organization_id", auth.organization_id)
      .eq("is_active", true)
      .single();

    if (!storefront) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Storefront not found or not owned by your organization" },
        { status: 404 }
      );
    }

    // Validate all products exist and are active
    const productIds = body.items.map((i) => i.product_id);
    const { data: products } = await supabase
      .from("aura_products")
      .select("id, price, name")
      .in("id", productIds)
      .eq("is_active", true);

    if (!products || products.length !== productIds.length) {
      const foundIds = new Set((products || []).map((p) => p.id));
      const missing = productIds.filter((id) => !foundIds.has(id));
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `Products not found or inactive: ${missing.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Calculate order total
    const productMap = new Map(products.map((p) => [p.id, p]));
    let totalAmount = 0;
    const orderItems = body.items.map((item) => {
      const product = productMap.get(item.product_id)!;
      const lineTotal = product.price * item.quantity;
      totalAmount += lineTotal;
      return {
        product_id: item.product_id,
        product_name: product.name,
        quantity: item.quantity,
        unit_price: product.price,
        line_total: lineTotal,
      };
    });

    // Find dealer for attribution
    const { data: dealer } = await supabase
      .from("dealers")
      .select("id")
      .eq("organization_id", auth.organization_id)
      .limit(1)
      .single();

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from("aura_orders")
      .insert({
        customer_email: body.customer_email,
        status: "pending" as const,
        total_amount: totalAmount,
        items: orderItems,
        purchase_type: "one_time",
        channel: "api",
        dealer_attribution_id: dealer?.id || null,
        storefront_id: storefront.id,
      })
      .select("id, status, total_amount, created_at")
      .single();

    if (orderError) {
      console.error("[v1/orders] Insert error:", orderError);
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Failed to create order" },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          order_id: order.id,
          status: order.status,
          total_amount: order.total_amount,
          items: orderItems,
          created_at: order.created_at,
        },
        message: "Order created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[v1/orders] POST error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, ...safeError(error, "Internal server error") },
      { status: 500 }
    );
  }
}
