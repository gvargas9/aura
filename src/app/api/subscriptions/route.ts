import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireAdmin, isAuthError } from "@/lib/api/auth";
import type { ApiResponse, PaginatedResponse } from "@/types";
import type { Subscription, SubscriptionStatus } from "@/types/database";

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

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("aura_subscriptions")
      .select("*", { count: "exact" });

    // Role-based access
    if (profile.role !== "admin") {
      query = query.eq("user_id", profile.id);
    }

    if (status) {
      query = query.eq("status", status as SubscriptionStatus);
    }

    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data: items, error, count } = await query;

    if (error) {
      console.error("Subscriptions fetch error:", error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Failed to fetch subscriptions" },
        { status: 500 }
      );
    }

    const total = count || 0;
    const response: PaginatedResponse<Subscription> = {
      items: items || [],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };

    return NextResponse.json<
      ApiResponse<PaginatedResponse<Subscription>>
    >({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Subscriptions GET error:", error);
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
    const { user_id, box_size, price } = body;

    if (!user_id || !box_size || price === undefined) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Missing required fields: user_id, box_size, price",
        },
        { status: 400 }
      );
    }

    const validBoxSizes = ["starter", "voyager", "bunker"];
    if (!validBoxSizes.includes(box_size)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `Invalid box_size. Must be one of: ${validBoxSizes.join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (typeof price !== "number" || price < 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Price must be a non-negative number" },
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

    const { data: subscription, error: insertError } = await supabase
      .from("aura_subscriptions")
      .insert({
        user_id,
        stripe_subscription_id: body.stripe_subscription_id || null,
        box_size,
        box_config: body.box_config || [],
        status: body.status || "active",
        price,
        next_delivery_date: body.next_delivery_date || null,
        delivery_frequency_days: body.delivery_frequency_days || 30,
        shipping_address: body.shipping_address || {},
      })
      .select()
      .single();

    if (insertError) {
      console.error("Subscription insert error:", insertError);
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Failed to create subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<Subscription>>(
      {
        success: true,
        data: subscription,
        message: "Subscription created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Subscriptions POST error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
