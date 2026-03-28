import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireAdmin, isAuthError } from "@/lib/api/auth";
import type { ApiResponse } from "@/types";
import type { Subscription } from "@/types/database";

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

    const { data: subscription, error } = await supabase
      .from("aura_subscriptions")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !subscription) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Subscription not found" },
        { status: 404 }
      );
    }

    // Authorization: admin sees all, customer sees own
    if (profile.role !== "admin" && subscription.user_id !== profile.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Subscription not found" },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Subscription>>({
      success: true,
      data: subscription,
    });
  } catch (error) {
    console.error("Subscription GET error:", error);
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
    const auth = await requireAuth(supabase);

    if (isAuthError(auth)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const { profile } = auth;

    // Verify subscription exists and user has access
    const { data: existing } = await supabase
      .from("aura_subscriptions")
      .select("*")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Subscription not found" },
        { status: 404 }
      );
    }

    // Customers can update their own subscriptions, admins can update any
    if (profile.role !== "admin" && existing.user_id !== profile.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Subscription not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    // Fields that both customers and admins can update
    const customerFields = [
      "box_config",
      "box_size",
      "delivery_frequency_days",
      "next_delivery_date",
    ];

    // Status changes with special handling
    if (body.status !== undefined) {
      const validStatuses = ["active", "paused", "cancelled"];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
          },
          { status: 400 }
        );
      }

      // Prevent reactivating a cancelled subscription
      if (existing.status === "cancelled" && body.status !== "cancelled") {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "Cannot reactivate a cancelled subscription",
          },
          { status: 400 }
        );
      }

      updateData.status = body.status;

      // Handle pause
      if (body.status === "paused") {
        // pause_until is stored if the DB column exists
        if (body.pause_until) {
          updateData.pause_until = body.pause_until;
        }
      }

      // Handle cancel
      if (body.status === "cancelled") {
        updateData.cancelled_at = new Date().toISOString();
        if (body.cancellation_reason) {
          updateData.cancellation_reason = body.cancellation_reason;
        }
      }

      // Handle resume
      if (body.status === "active" && existing.status === "paused") {
        updateData.pause_until = null;
      }
    }

    for (const field of customerFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Validate box_size if provided
    if (body.box_size) {
      const validBoxSizes = ["starter", "voyager", "bunker"];
      if (!validBoxSizes.includes(body.box_size)) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: `Invalid box_size. Must be one of: ${validBoxSizes.join(", ")}`,
          },
          { status: 400 }
        );
      }
    }

    // Admin-only fields
    if (profile.role === "admin") {
      const adminFields = ["stripe_subscription_id", "price"];
      for (const field of adminFields) {
        if (body[field] !== undefined) {
          updateData[field] = body[field];
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "No valid fields to update" },
        { status: 400 }
      );
    }

    updateData.updated_at = new Date().toISOString();

    const { data: subscription, error: updateError } = await supabase
      .from("aura_subscriptions")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Subscription update error:", updateError);
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Failed to update subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<Subscription>>({
      success: true,
      data: subscription,
      message: "Subscription updated successfully",
    });
  } catch (error) {
    console.error("Subscription PUT error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
