import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, isAuthError } from "@/lib/api/auth";
import type { ApiResponse } from "@/types";
import type { Product } from "@/types/database";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: product, error } = await supabase
      .from("aura_products")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !product) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Product>>({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Product GET error:", error);
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

    // Verify product exists
    const { data: existing } = await supabase
      .from("aura_products")
      .select("id")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    // If SKU is being updated, check uniqueness
    if (body.sku) {
      const { data: skuConflict } = await supabase
        .from("aura_products")
        .select("id")
        .eq("sku", body.sku)
        .neq("id", id)
        .single();

      if (skuConflict) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: `Product with SKU '${body.sku}' already exists`,
          },
          { status: 409 }
        );
      }
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      "sku",
      "name",
      "description",
      "short_description",
      "price",
      "compare_at_price",
      "image_url",
      "images",
      "stock_level",
      "is_bunker_safe",
      "shelf_life_months",
      "weight_oz",
      "nutritional_info",
      "ingredients",
      "category",
      "tags",
      "is_active",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "No valid fields to update" },
        { status: 400 }
      );
    }

    updateData.updated_at = new Date().toISOString();

    const { data: product, error: updateError } = await supabase
      .from("aura_products")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Product update error:", updateError);
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Failed to update product" },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<Product>>({
      success: true,
      data: product,
      message: "Product updated successfully",
    });
  } catch (error) {
    console.error("Product PUT error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
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

    // Soft delete: set is_active to false
    const { data: product, error } = await supabase
      .from("aura_products")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error || !product) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Product>>({
      success: true,
      data: product,
      message: "Product deactivated successfully",
    });
  } catch (error) {
    console.error("Product DELETE error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
