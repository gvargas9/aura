import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { triggerLowStockAlert } from "@/lib/n8n/client";
import { logAutomationEvent } from "@/lib/n8n/events";
import type { LowStockProduct } from "@/lib/n8n/client";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

function validateCronSecret(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn("[cron] CRON_SECRET not set -- skipping auth");
    return true;
  }
  const header =
    request.headers.get("authorization")?.replace("Bearer ", "") ??
    request.headers.get("x-cron-secret");
  return header === secret;
}

// ---------------------------------------------------------------------------
// GET handler (called by external cron scheduler)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[cron:low-stock] Starting low-stock check");

  // The Supabase JS client does not support cross-column comparison filters
  // (e.g. quantity < safety_stock) so we fetch all inventory rows and filter
  // in application code. For large catalogs this should be replaced with a
  // Postgres function or view.
  const { data: allInventory, error: invError } = await supabaseAdmin
    .from("inventory")
    .select("*");

  if (invError) {
    console.error("[cron:low-stock] Failed to query inventory:", invError.message);
    return NextResponse.json(
      { error: "Failed to query inventory" },
      { status: 500 }
    );
  }

  // Filter items where quantity is at or below safety_stock
  const belowSafety = (allInventory ?? []).filter(
    (item) => item.quantity <= item.safety_stock
  );

  if (belowSafety.length === 0) {
    console.log("[cron:low-stock] No low-stock products found");
    return NextResponse.json({
      checked: true,
      lowStockCount: 0,
      products: [],
    });
  }

  // Fetch product details for the low-stock items
  const productIds = belowSafety.map((item) => item.product_id);
  const { data: products } = await supabaseAdmin
    .from("aura_products")
    .select("id, sku, name")
    .in("id", productIds);

  const productMap = new Map(
    (products ?? []).map((p) => [p.id, p])
  );

  const lowStockProducts: LowStockProduct[] = belowSafety.map((item) => {
    const product = productMap.get(item.product_id);
    return {
      productId: item.product_id,
      sku: product?.sku ?? "UNKNOWN",
      name: product?.name ?? "Unknown Product",
      currentQuantity: item.quantity,
      safetyStock: item.safety_stock,
      reorderPoint: item.reorder_point,
      reorderQuantity: item.reorder_quantity,
      warehouseLocation: item.warehouse_location,
    };
  });

  // Trigger n8n low-stock alert workflow
  const triggered = await triggerLowStockAlert(lowStockProducts);

  await logAutomationEvent({
    channel: "cron",
    event: "low_stock_check.completed",
    data: {
      lowStockCount: lowStockProducts.length,
      n8nTriggered: triggered,
      products: lowStockProducts.map((p) => ({
        sku: p.sku,
        name: p.name,
        qty: p.currentQuantity,
        safety: p.safetyStock,
      })),
    },
  });

  console.log(
    `[cron:low-stock] Found ${lowStockProducts.length} low-stock products, n8n triggered: ${triggered}`
  );

  return NextResponse.json({
    checked: true,
    lowStockCount: lowStockProducts.length,
    n8nTriggered: triggered,
    products: lowStockProducts,
  });
}
