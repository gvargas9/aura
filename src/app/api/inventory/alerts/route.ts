import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role for webhook/automation access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/inventory/alerts - Get low stock alerts (for n8n/automation)
export async function GET(request: NextRequest) {
  try {
    // Verify API key for webhook access
    const authHeader = request.headers.get("authorization");
    const apiKey = authHeader?.replace("Bearer ", "");

    // Check for valid API key or admin session
    if (apiKey !== process.env.INVENTORY_API_KEY) {
      // Fallback to session auth
      const { createClient } = await import("@/lib/supabase/server");
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
    }

    // Get low stock items using RPC function
    const { data: lowStockItems, error } = await supabaseAdmin.rpc(
      "get_low_stock_items"
    );

    if (error) {
      // Fallback to direct query if RPC not available
      const { data: fallbackData, error: fallbackError } = await supabaseAdmin
        .from("inventory")
        .select(`
          product_id,
          quantity,
          reorder_point,
          warehouse_location,
          aura_products(name, sku)
        `)
        .lt("quantity", 200) // Default threshold
        .order("quantity", { ascending: true });

      if (fallbackError) {
        console.error("Low stock fetch error:", fallbackError);
        return NextResponse.json(
          { error: "Failed to fetch low stock items" },
          { status: 500 }
        );
      }

      const alerts = fallbackData?.map((item) => ({
        product_id: item.product_id,
        product_name: item.aura_products?.name,
        sku: item.aura_products?.sku,
        current_quantity: item.quantity,
        reorder_point: item.reorder_point,
        warehouse_location: item.warehouse_location,
        urgency:
          item.quantity === 0
            ? "critical"
            : item.quantity < 50
            ? "high"
            : "medium",
      }));

      return NextResponse.json({
        alerts: alerts || [],
        total: alerts?.length || 0,
        timestamp: new Date().toISOString(),
      });
    }

    const alerts = lowStockItems?.map((item: Record<string, unknown>) => ({
      ...item,
      urgency:
        (item.current_quantity as number) === 0
          ? "critical"
          : (item.current_quantity as number) < 50
          ? "high"
          : "medium",
    }));

    return NextResponse.json({
      alerts: alerts || [],
      total: alerts?.length || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Inventory alerts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/inventory/alerts - Create reorder request (for automation)
export async function POST(request: NextRequest) {
  try {
    // Verify API key
    const authHeader = request.headers.get("authorization");
    const apiKey = authHeader?.replace("Bearer ", "");

    if (apiKey !== process.env.INVENTORY_API_KEY) {
      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productIds, quantities, notes } = body;

    if (!productIds || !Array.isArray(productIds)) {
      return NextResponse.json(
        { error: "Product IDs array required" },
        { status: 400 }
      );
    }

    // Record reorder requests (could be extended to create actual POs)
    const reorderRequests = productIds.map((productId: string, index: number) => ({
      product_id: productId,
      warehouse_location: "el_paso",
      quantity_change: quantities?.[index] || 500, // Default reorder quantity
      type: "restock",
      notes: notes || "Automated reorder request",
    }));

    // For now, just log the request - in production this would:
    // 1. Create a purchase order record
    // 2. Send notification to supplier
    // 3. Trigger n8n workflow

    console.log("Reorder request received:", reorderRequests);

    // Placeholder response - implement actual PO creation as needed
    return NextResponse.json({
      success: true,
      message: `Reorder request created for ${productIds.length} products`,
      request_id: `RO-${Date.now()}`,
      items: reorderRequests,
    });
  } catch (error) {
    console.error("Reorder request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
