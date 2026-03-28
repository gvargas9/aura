import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, isAuthError } from "@/lib/api/auth";
import type { ApiResponse, PaginatedResponse } from "@/types";
import type { Inventory } from "@/types/database";

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
    const lowStock = searchParams.get("lowStock") === "true";

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Fetch inventory with product info via a join
    let query = supabase
      .from("inventory")
      .select("*, aura_products(id, sku, name, image_url, is_active)", {
        count: "exact",
      });

    if (lowStock) {
      // For low stock filter, we fetch all and filter in app since
      // Supabase doesn't support column-to-column comparison in .filter()
      // We'll use a raw filter expression instead
      query = query.filter("quantity", "lt", "safety_stock");
    }

    query = query.order("updated_at", { ascending: false }).range(from, to);

    const { data: items, error, count } = await query;

    if (error) {
      // If the column comparison filter fails, fall back to fetching all
      // and filtering in application code
      if (lowStock && error.message?.includes("safety_stock")) {
        const fallbackQuery = supabase
          .from("inventory")
          .select("*, aura_products(id, sku, name, image_url, is_active)", {
            count: "exact",
          })
          .order("updated_at", { ascending: false });

        const { data: allItems, error: fallbackError } = await fallbackQuery;

        if (fallbackError) {
          console.error("Inventory fetch error:", fallbackError);
          return NextResponse.json<ApiResponse>(
            { success: false, error: "Failed to fetch inventory" },
            { status: 500 }
          );
        }

        const filteredItems = (allItems || []).filter(
          (item) => item.quantity < item.safety_stock
        );
        const paginatedItems = filteredItems.slice(from, to + 1);
        const total = filteredItems.length;

        return NextResponse.json<ApiResponse<PaginatedResponse<unknown>>>({
          success: true,
          data: {
            items: paginatedItems,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
          },
        });
      }

      console.error("Inventory fetch error:", error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Failed to fetch inventory" },
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
    console.error("Inventory GET error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    const { updates } = body;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error:
            "Missing required field: updates (array of {id, quantity, ...})",
        },
        { status: 400 }
      );
    }

    const results: { id: string; success: boolean; error?: string }[] = [];

    for (const update of updates) {
      if (!update.id) {
        results.push({
          id: "unknown",
          success: false,
          error: "Missing inventory id",
        });
        continue;
      }

      const updateData: Record<string, unknown> = {};
      const allowedFields = [
        "quantity",
        "reserved_quantity",
        "safety_stock",
        "reorder_point",
        "warehouse_location",
        "last_restock_date",
      ];

      for (const field of allowedFields) {
        if (update[field] !== undefined) {
          updateData[field] = update[field];
        }
      }

      if (Object.keys(updateData).length === 0) {
        results.push({
          id: update.id,
          success: false,
          error: "No valid fields to update",
        });
        continue;
      }

      updateData.updated_at = new Date().toISOString();

      const { error: updateError } = await supabase
        .from("inventory")
        .update(updateData)
        .eq("id", update.id);

      if (updateError) {
        results.push({
          id: update.id,
          success: false,
          error: updateError.message,
        });
      } else {
        results.push({ id: update.id, success: true });
      }
    }

    const allSucceeded = results.every((r) => r.success);

    return NextResponse.json<ApiResponse>({
      success: allSucceeded,
      data: { results },
      message: allSucceeded
        ? "All inventory records updated successfully"
        : "Some inventory updates failed",
    });
  } catch (error) {
    console.error("Inventory PUT error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
