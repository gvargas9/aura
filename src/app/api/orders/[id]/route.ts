import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireAdmin, isAuthError } from "@/lib/api/auth";
import type { ApiResponse } from "@/types";
import type { Order } from "@/types/database";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const auth = await requireAuth(supabase);

    if (isAuthError(auth)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const { profile } = auth;

    const { data: order, error } = await supabase
      .from("aura_orders")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !order) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Authorization: admin sees all, customer sees own, dealer sees attributed
    if (profile.role === "admin") {
      // Admin has access to all orders
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

    return NextResponse.json<ApiResponse<Order>>({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Order GET error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const auth = await requireAdmin(supabase);

    if (isAuthError(auth)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const body = await request.json();

    // Verify order exists
    const { data: existing } = await supabase
      .from("aura_orders")
      .select("*")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      "status",
      "tracking_number",
      "notes",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Auto-set timestamps based on status transitions
    if (body.status === "shipped" && existing.status !== "shipped") {
      updateData.status = "shipped";
      // shipped_at is set if the column exists in the table
      if (body.tracking_number) {
        updateData.tracking_number = body.tracking_number;
      }
    }

    if (body.status === "delivered" && existing.status !== "delivered") {
      updateData.status = "delivered";
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "No valid fields to update" },
        { status: 400 }
      );
    }

    updateData.updated_at = new Date().toISOString();

    const { data: order, error: updateError } = await supabase
      .from("aura_orders")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Order update error:", updateError);
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Failed to update order" },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<Order>>({
      success: true,
      data: order,
      message: "Order updated successfully",
    });
  } catch (error) {
    console.error("Order PUT error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
