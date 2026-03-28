import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, isAuthError } from "@/lib/api/auth";
import type { ApiResponse, PaginatedResponse } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const auth = await requireAdmin(supabase);

    if (isAuthError(auth)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const searchParams = request.nextUrl.searchParams;

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10))
    );
    const isActive = searchParams.get("isActive");

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("promo_codes")
      .select("*", { count: "exact" });

    if (isActive === "true") {
      query = query.eq("is_active", true);
    } else if (isActive === "false") {
      query = query.eq("is_active", false);
    }

    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data: items, error, count } = await query;

    if (error) {
      console.error("Promo codes fetch error:", error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Failed to fetch promo codes" },
        { status: 500 }
      );
    }

    const total = count || 0;

    return NextResponse.json<ApiResponse<PaginatedResponse<unknown>>>({
      success: true,
      data: {
        items: items || [],
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Promo codes GET error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
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

    const body = await request.json();
    const { code, discount_type, discount_value } = body;

    if (!code || !discount_type || discount_value === undefined) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error:
            "Missing required fields: code, discount_type, discount_value",
        },
        { status: 400 }
      );
    }

    const validDiscountTypes = ["percentage", "fixed", "free_shipping"];
    if (!validDiscountTypes.includes(discount_type)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `Invalid discount_type. Must be one of: ${validDiscountTypes.join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (
      discount_type !== "free_shipping" &&
      (typeof discount_value !== "number" || discount_value <= 0)
    ) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "discount_value must be a positive number",
        },
        { status: 400 }
      );
    }

    if (discount_type === "percentage" && discount_value > 100) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Percentage discount cannot exceed 100",
        },
        { status: 400 }
      );
    }

    // Check code uniqueness
    const { data: existing } = await supabase
      .from("promo_codes")
      .select("id")
      .eq("code", code.toUpperCase())
      .single();

    if (existing) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: `Promo code '${code}' already exists` },
        { status: 409 }
      );
    }

    const { data: promoCode, error: insertError } = await supabase
      .from("promo_codes")
      .insert({
        code: code.toUpperCase(),
        description: body.description || null,
        discount_type,
        discount_value: discount_type === "free_shipping" ? 0 : discount_value,
        min_order_amount: body.min_order_amount || 0,
        max_discount: body.max_discount || null,
        usage_limit: body.usage_limit || null,
        usage_count: 0,
        per_user_limit: body.per_user_limit || null,
        valid_from: body.valid_from || new Date().toISOString(),
        valid_until: body.valid_until || null,
        applicable_products: body.applicable_products || null,
        applicable_categories: body.applicable_categories || null,
        is_active: body.is_active !== undefined ? body.is_active : true,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Promo code insert error:", insertError);
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Failed to create promo code" },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: promoCode,
        message: "Promo code created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Promo codes POST error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
