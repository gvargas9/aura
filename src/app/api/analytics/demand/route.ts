import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, isAuthError } from "@/lib/api/auth";
import {
  forecastAllProducts,
  generateReorderReport,
} from "@/lib/ai/forecast";
import { triggerLowStockAlert } from "@/lib/n8n/client";
import type { LowStockProduct } from "@/lib/n8n/client";

// ---------------------------------------------------------------------------
// GET /api/analytics/demand
// Returns demand forecast for all products. Admin only.
// Query params: ?urgentOnly=true
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const auth = await requireAdmin(supabase);

  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const urgentOnly = request.nextUrl.searchParams.get("urgentOnly") === "true";

    const forecasts = await forecastAllProducts();

    const filtered = urgentOnly
      ? forecasts.filter((f) => f.currentStock <= f.safetyStock || f.daysUntilStockout <= 30)
      : forecasts;

    // Summary
    const belowSafety = forecasts.filter((f) => f.currentStock <= f.safetyStock).length;
    const reorderSoon = forecasts.filter(
      (f) => f.currentStock > f.safetyStock && f.daysUntilStockout <= 30
    ).length;
    const stableCount = forecasts.filter(
      (f) => f.currentStock > f.safetyStock && f.daysUntilStockout > 30
    ).length;
    const avgDaysToStockout =
      forecasts.length > 0
        ? Math.round(
            forecasts.reduce((sum, f) => sum + Math.min(f.daysUntilStockout, 9999), 0) /
              forecasts.length
          )
        : 0;

    return NextResponse.json({
      summary: {
        total: forecasts.length,
        belowSafetyStock: belowSafety,
        reorderSoon,
        stable: stableCount,
        avgDaysToStockout,
      },
      forecasts: filtered,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[analytics:demand] Forecast failed:", message);
    return NextResponse.json(
      { error: "Forecast failed", details: message },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/analytics/demand
// Generate reorder report and optionally trigger n8n PO workflow. Admin only.
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const auth = await requireAdmin(supabase);

  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const report = await generateReorderReport();

    // Trigger n8n workflow for urgent reorders
    let n8nTriggered = false;
    if (report.urgentReorders.length > 0) {
      const lowStockProducts: LowStockProduct[] = report.urgentReorders.map((f) => ({
        productId: f.productId,
        sku: "",
        name: f.productName,
        currentQuantity: f.currentStock,
        safetyStock: f.safetyStock,
        reorderPoint: 0,
        reorderQuantity: f.recommendedReorderQuantity,
        warehouseLocation: "",
      }));

      // Fetch SKUs for the products
      const productIds = report.urgentReorders.map((f) => f.productId);
      const { data: products } = await supabase
        .from("aura_products")
        .select("id, sku")
        .in("id", productIds);

      const skuMap = new Map((products ?? []).map((p) => [p.id, p.sku]));
      for (const lsp of lowStockProducts) {
        lsp.sku = skuMap.get(lsp.productId) ?? "UNKNOWN";
      }

      n8nTriggered = await triggerLowStockAlert(lowStockProducts);
    }

    return NextResponse.json({
      success: true,
      report,
      n8nTriggered,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[analytics:demand] Report generation failed:", message);
    return NextResponse.json(
      { error: "Report generation failed", details: message },
      { status: 500 }
    );
  }
}
