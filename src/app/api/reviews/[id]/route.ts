import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, isAuthError } from "@/lib/api/auth";
import type { ApiResponse } from "@/types";

/**
 * PUT /api/reviews/:id
 * Update own review, or admin can moderate (approve/reject).
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const auth = await requireAuth(supabase);

    if (isAuthError(auth)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Fetch the existing review
    const { data: existing } = await supabase
      .from("product_reviews")
      .select("*")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Review not found" },
        { status: 404 }
      );
    }

    const isOwner = existing.user_id === auth.user.id;
    const isAdmin = auth.profile.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "You can only update your own reviews" },
        { status: 403 }
      );
    }

    // Build the update object depending on role
    const update: Record<string, unknown> = {};

    if (isOwner) {
      // Owner can update content fields
      if (body.rating !== undefined) {
        if (typeof body.rating !== "number" || body.rating < 1 || body.rating > 5) {
          return NextResponse.json<ApiResponse>(
            { success: false, error: "Rating must be between 1 and 5" },
            { status: 400 }
          );
        }
        update.rating = Math.round(body.rating);
        // Reset status to pending since content changed
        update.status = "pending";
      }
      if (body.title !== undefined) update.title = body.title || null;
      if (body.body !== undefined) update.body = body.body || null;
      if (body.tasteRating !== undefined) update.taste_rating = body.tasteRating ?? null;
      if (body.valueRating !== undefined) update.value_rating = body.valueRating ?? null;
      if (body.preparationEase !== undefined) update.preparation_ease = body.preparationEase ?? null;
      if (body.images !== undefined) update.images = Array.isArray(body.images) ? body.images : [];
    }

    if (isAdmin) {
      // Admin can moderate
      if (body.status !== undefined) {
        if (!["pending", "approved", "rejected"].includes(body.status)) {
          return NextResponse.json<ApiResponse>(
            { success: false, error: "Status must be pending, approved, or rejected" },
            { status: 400 }
          );
        }
        update.status = body.status;
      }
      if (body.adminResponse !== undefined) {
        update.admin_response = body.adminResponse || null;
      }
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "No valid fields to update" },
        { status: 400 }
      );
    }

    update.updated_at = new Date().toISOString();

    const { data: updated, error: updateError } = await supabase
      .from("product_reviews")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Review update error:", updateError);
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Failed to update review" },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: updated,
      message: isAdmin && body.status ? `Review ${body.status}` : "Review updated",
    });
  } catch (error) {
    console.error("Reviews PUT error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reviews/:id
 * Delete own review. Admins can also delete any review.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const auth = await requireAuth(supabase);

    if (isAuthError(auth)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const { id } = await params;

    // Fetch the existing review
    const { data: existing } = await supabase
      .from("product_reviews")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Review not found" },
        { status: 404 }
      );
    }

    const isOwner = existing.user_id === auth.user.id;
    const isAdmin = auth.profile.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "You can only delete your own reviews" },
        { status: 403 }
      );
    }

    const { error: deleteError } = await supabase
      .from("product_reviews")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Review delete error:", deleteError);
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Failed to delete review" },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Review deleted",
    });
  } catch (error) {
    console.error("Reviews DELETE error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
