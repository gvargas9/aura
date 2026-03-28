import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  requireAuth,
  requireAdmin,
  isAuthError,
} from "@/lib/api/auth";
import type { ApiResponse, PaginatedResponse } from "@/types";
import type { Order, OrderStatus } from "@/types/database";

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

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10))
    );
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from("aura_orders").select("*", { count: "exact" });

    // Role-based access
    if (profile.role === "admin") {
      // Admin can see all orders
    } else if (profile.role === "dealer") {
      // Dealer can see orders attributed to them
      const { data: dealer } = await supabase
        .from("dealers")
        .select("id")
        .eq("profile_id", profile.id)
        .single();

      if (dealer) {
        query = query.eq("dealer_attribution_id", dealer.id);
      } else {
        // Dealer with no dealer record - return empty
        return NextResponse.json<
          ApiResponse<PaginatedResponse<Order>>
        >({
          success: true,
          data: {
            items: [],
            total: 0,
            page,
            pageSize,
            totalPages: 0,
          },
        });
      }
    } else {
      // Customer can only see their own orders
      query = query.eq("user_id", profile.id);
    }

    if (status) {
      query = query.eq("status", status as OrderStatus);
    }

    if (search && profile.role === "admin") {
      query = query.or(
        `order_number.ilike.%${search}%`
      );
    }

    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data: items, error, count } = await query;

    if (error) {
      console.error("Orders fetch error:", error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Failed to fetch orders" },
        { status: 500 }
      );
    }

    const total = count || 0;
    const response: PaginatedResponse<Order> = {
      items: items || [],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };

    return NextResponse.json<ApiResponse<PaginatedResponse<Order>>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Orders GET error:", error);
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
    const { user_id, items, shipping_address, total } = body;

    if (!user_id || !items || !shipping_address || total === undefined) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error:
            "Missing required fields: user_id, items, shipping_address, total",
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Items must be a non-empty array" },
        { status: 400 }
      );
    }

    if (typeof total !== "number" || total < 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Total must be a non-negative number" },
        { status: 400 }
      );
    }

    // Verify user exists
    const { data: targetUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user_id)
      .single();

    if (!targetUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Generate order number: AUR-YYYYMMDD-XXXX
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
    const randomPart = Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase();
    const orderNumber = `AUR-${datePart}-${randomPart}`;

    const { data: order, error: insertError } = await supabase
      .from("aura_orders")
      .insert({
        order_number: orderNumber,
        user_id,
        subscription_id: body.subscription_id || null,
        organization_id: body.organization_id || null,
        dealer_attribution_id: body.dealer_attribution_id || null,
        stripe_payment_intent_id: body.stripe_payment_intent_id || null,
        status: "pending",
        subtotal: body.subtotal || total,
        discount: body.discount || 0,
        shipping: body.shipping || 0,
        tax: body.tax || 0,
        total,
        items,
        shipping_address,
        billing_address: body.billing_address || null,
        notes: body.notes || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Order insert error:", insertError);
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Failed to create order" },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<Order>>(
      { success: true, data: order, message: "Order created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Orders POST error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
