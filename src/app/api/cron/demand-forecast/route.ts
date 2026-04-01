import { NextRequest, NextResponse } from "next/server";
import { generateReorderReport } from "@/lib/ai/forecast";
import { triggerLowStockAlert } from "@/lib/n8n/client";
import { logAutomationEvent } from "@/lib/n8n/events";
import type { LowStockProduct } from "@/lib/n8n/client";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

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
// GET /api/cron/demand-forecast
// Daily cron: generate reorder report, alert urgent items via n8n.
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[cron:demand-forecast] Starting daily demand forecast");

  try {
    const report = await generateReorderReport();

    console.log(
      `[cron:demand-forecast] Urgent: ${report.urgentReorders.length}, Upcoming: ${report.upcomingReorders.length}, Stable: ${report.stable.length}`
    );

    // Trigger n8n alert for urgent reorders
    let n8nTriggered = false;
    if (report.urgentReorders.length > 0) {
      // Fetch SKUs
      const productIds = report.urgentReorders.map((f) => f.productId);
      const supabaseAdmin = getServiceClient();
      const { data: products } = await supabaseAdmin
        .from("aura_products")
        .select("id, sku")
        .in("id", productIds);

      const skuMap = new Map((products ?? []).map((p) => [p.id, p.sku]));

      const lowStockProducts: LowStockProduct[] = report.urgentReorders.map((f) => ({
        productId: f.productId,
        sku: skuMap.get(f.productId) ?? "UNKNOWN",
        name: f.productName,
        currentQuantity: f.currentStock,
        safetyStock: f.safetyStock,
        reorderPoint: 0,
        reorderQuantity: f.recommendedReorderQuantity,
        warehouseLocation: "",
      }));

      n8nTriggered = await triggerLowStockAlert(lowStockProducts);
      console.log(`[cron:demand-forecast] n8n low-stock alert triggered: ${n8nTriggered}`);
    }

    await logAutomationEvent({
      channel: "cron",
      event: "demand_forecast.completed",
      data: {
        urgentCount: report.urgentReorders.length,
        upcomingCount: report.upcomingReorders.length,
        stableCount: report.stable.length,
        totalEstimatedCost: report.totalEstimatedCost,
        n8nTriggered,
      },
    });

    return NextResponse.json({
      success: true,
      urgentCount: report.urgentReorders.length,
      upcomingCount: report.upcomingReorders.length,
      stableCount: report.stable.length,
      totalEstimatedCost: report.totalEstimatedCost,
      n8nTriggered,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[cron:demand-forecast] Failed:", message);

    await logAutomationEvent({
      channel: "cron",
      event: "demand_forecast.failed",
      data: { error: message },
    });

    return NextResponse.json(
      { error: "Demand forecast failed", details: message },
      { status: 500 }
    );
  }
}
