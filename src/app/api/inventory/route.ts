import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/inventory - Get inventory status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get("filter"); // 'low-stock', 'all'
    const warehouse = searchParams.get("warehouse") || "el_paso";

    let query = supabase
      .from("inventory")
      .select(`
        *,
        aura_products(id, name, sku, image_url, category)
      `)
      .eq("warehouse_location", warehouse)
      .order("quantity", { ascending: true });

    if (filter === "low-stock") {
      // Get items where quantity <= reorder_point
      query = query.lte("quantity", supabase.rpc ? 200 : 200); // fallback to 200
    }

    const { data, error } = await query;

    if (error) {
      console.error("Inventory fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch inventory" },
        { status: 500 }
      );
    }

    // Calculate summary stats
    const summary = {
      totalItems: data?.length || 0,
      lowStock: data?.filter((i) => i.quantity <= i.reorder_point).length || 0,
      outOfStock: data?.filter((i) => i.quantity === 0).length || 0,
      totalQuantity: data?.reduce((sum, i) => sum + i.quantity, 0) || 0,
    };

    return NextResponse.json({ inventory: data, summary });
  } catch (error) {
    console.error("Inventory error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/inventory - Restock a product
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { productId, quantity, warehouse = "el_paso", notes } = body;

    if (!productId || !quantity || quantity <= 0) {
      return NextResponse.json(
        { error: "Product ID and positive quantity are required" },
        { status: 400 }
      );
    }

    // Call the restock function
    const { error: restockError } = await supabase.rpc("restock_inventory", {
      p_product_id: productId,
      p_quantity: quantity,
      p_warehouse: warehouse,
      p_notes: notes || null,
    });

    if (restockError) {
      console.error("Restock error:", restockError);
      return NextResponse.json(
        { error: "Failed to restock inventory" },
        { status: 500 }
      );
    }

    // Get updated inventory
    const { data: updated } = await supabase
      .from("inventory")
      .select("*")
      .eq("product_id", productId)
      .eq("warehouse_location", warehouse)
      .single();

    return NextResponse.json({
      success: true,
      message: `Restocked ${quantity} units`,
      inventory: updated,
    });
  } catch (error) {
    console.error("Restock error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
