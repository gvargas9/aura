import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ServiceClient = ReturnType<typeof createClient<Database>>;

export interface ProductDemand {
  productId: string;
  productName: string;
  currentStock: number;
  safetyStock: number;
  averageDailyDemand: number;
  demandTrend: "increasing" | "stable" | "decreasing";
  daysUntilStockout: number;
  recommendedReorderDate: string;
  recommendedReorderQuantity: number;
  forecastedDemand30Days: number;
  forecastedDemand90Days: number;
  seasonalityFactor: number;
}

export interface ReorderReport {
  urgentReorders: ProductDemand[];
  upcomingReorders: ProductDemand[];
  stable: ProductDemand[];
  totalEstimatedCost: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getServiceClient(): ServiceClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }
  return createClient<Database>(url, key);
}

interface OrderItem {
  productId?: string;
  product_id?: string;
  quantity?: number;
}

/**
 * Parse order items JSON into a list of product quantity pairs.
 */
function parseOrderItems(items: Json): Array<{ productId: string; quantity: number }> {
  if (!Array.isArray(items)) return [];
  const result: Array<{ productId: string; quantity: number }> = [];
  for (const item of items as OrderItem[]) {
    const pid = item.productId || item.product_id;
    if (pid) {
      result.push({ productId: pid, quantity: item.quantity ?? 1 });
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Core demand calculation
// ---------------------------------------------------------------------------

interface DemandDataRow {
  productId: string;
  date: string;
  quantity: number;
}

async function getDemandData(
  supabase: ServiceClient,
  daysBack: number
): Promise<DemandDataRow[]> {
  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

  const { data: orders } = await supabase
    .from("aura_orders")
    .select("items, created_at")
    .in("status", ["processing", "shipped", "delivered"])
    .gte("created_at", since.toISOString());

  if (!orders) return [];

  const rows: DemandDataRow[] = [];
  for (const order of orders) {
    const items = parseOrderItems(order.items);
    for (const item of items) {
      rows.push({
        productId: item.productId,
        date: order.created_at.slice(0, 10),
        quantity: item.quantity,
      });
    }
  }
  return rows;
}

function computeSeasonalityFactor(
  demandRows: DemandDataRow[],
  productId: string
): number {
  if (demandRows.length === 0) return 1.0;

  const now = new Date();
  const currentMonth = now.getMonth();

  let totalQty = 0;
  let currentMonthQty = 0;
  let monthsWithData = new Set<number>();

  for (const row of demandRows) {
    if (row.productId !== productId) continue;
    const month = new Date(row.date).getMonth();
    totalQty += row.quantity;
    monthsWithData.add(month);
    if (month === currentMonth) {
      currentMonthQty += row.quantity;
    }
  }

  if (totalQty === 0 || monthsWithData.size === 0) return 1.0;

  const avgPerMonth = totalQty / monthsWithData.size;
  if (avgPerMonth === 0) return 1.0;

  return Math.round((currentMonthQty / avgPerMonth) * 100) / 100 || 1.0;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function forecastProductDemand(productId: string): Promise<ProductDemand> {
  const supabase = getServiceClient();
  const allForecasts = await computeAllForecasts(supabase, [productId]);
  const forecast = allForecasts.get(productId);
  if (!forecast) {
    throw new Error(`Product ${productId} not found or has no inventory record`);
  }
  return forecast;
}

export async function forecastAllProducts(): Promise<ProductDemand[]> {
  const supabase = getServiceClient();
  const forecasts = await computeAllForecasts(supabase);
  return Array.from(forecasts.values()).sort(
    (a, b) => a.daysUntilStockout - b.daysUntilStockout
  );
}

export async function generateReorderReport(): Promise<ReorderReport> {
  const forecasts = await forecastAllProducts();

  const urgentReorders: ProductDemand[] = [];
  const upcomingReorders: ProductDemand[] = [];
  const stable: ProductDemand[] = [];

  for (const f of forecasts) {
    if (f.currentStock <= f.safetyStock) {
      urgentReorders.push(f);
    } else if (f.daysUntilStockout <= 30) {
      upcomingReorders.push(f);
    } else {
      stable.push(f);
    }
  }

  // Estimate cost based on reorder quantities
  // Use a rough unit cost estimate: fetch cost_price from products
  const supabase = getServiceClient();
  const reorderProductIds = [...urgentReorders, ...upcomingReorders].map((f) => f.productId);
  let totalEstimatedCost = 0;

  if (reorderProductIds.length > 0) {
    const { data: products } = await supabase
      .from("aura_products")
      .select("id, cost_price, price")
      .in("id", reorderProductIds);

    const costMap = new Map<string, number>();
    for (const p of products ?? []) {
      costMap.set(p.id, p.cost_price ?? p.price * 0.4);
    }

    for (const f of [...urgentReorders, ...upcomingReorders]) {
      const unitCost = costMap.get(f.productId) ?? 5;
      totalEstimatedCost += unitCost * f.recommendedReorderQuantity;
    }
  }

  return {
    urgentReorders,
    upcomingReorders,
    stable,
    totalEstimatedCost: Math.round(totalEstimatedCost * 100) / 100,
  };
}

// ---------------------------------------------------------------------------
// Internal batch computation
// ---------------------------------------------------------------------------

async function computeAllForecasts(
  supabase: ServiceClient,
  filterProductIds?: string[]
): Promise<Map<string, ProductDemand>> {
  // Fetch inventory with product info
  const inventoryQuery = supabase
    .from("inventory")
    .select("product_id, quantity, safety_stock, reorder_point, reorder_quantity");

  if (filterProductIds && filterProductIds.length > 0) {
    inventoryQuery.in("product_id", filterProductIds);
  }

  const { data: inventory } = await inventoryQuery;
  if (!inventory || inventory.length === 0) return new Map();

  const productIds = inventory.map((i) => i.product_id);

  // Fetch product names
  const { data: products } = await supabase
    .from("aura_products")
    .select("id, name")
    .in("id", productIds);

  const nameMap = new Map<string, string>();
  for (const p of products ?? []) {
    nameMap.set(p.id, p.name);
  }

  // Get demand data for last 90 days
  const demandRows = await getDemandData(supabase, 90);

  // Also get demand from last 365 days for seasonality
  const yearDemandRows = await getDemandData(supabase, 365);

  // Aggregate daily demand per product
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // Total demand in last 90 days per product
  const demand90 = new Map<string, number>();
  // Demand in last 30 days
  const demand30Recent = new Map<string, number>();
  // Demand in 30-60 days ago
  const demand30Previous = new Map<string, number>();

  for (const row of demandRows) {
    demand90.set(row.productId, (demand90.get(row.productId) ?? 0) + row.quantity);

    const rowDate = new Date(row.date);
    if (rowDate >= thirtyDaysAgo) {
      demand30Recent.set(row.productId, (demand30Recent.get(row.productId) ?? 0) + row.quantity);
    } else if (rowDate >= sixtyDaysAgo) {
      demand30Previous.set(row.productId, (demand30Previous.get(row.productId) ?? 0) + row.quantity);
    }
  }

  const results = new Map<string, ProductDemand>();

  for (const inv of inventory) {
    const pid = inv.product_id;
    const totalDemand90 = demand90.get(pid) ?? 0;
    const averageDailyDemand = totalDemand90 / 90;

    // Trend detection
    const recent = demand30Recent.get(pid) ?? 0;
    const previous = demand30Previous.get(pid) ?? 0;
    let demandTrend: "increasing" | "stable" | "decreasing" = "stable";
    if (previous > 0) {
      const change = ((recent - previous) / previous) * 100;
      if (change > 15) demandTrend = "increasing";
      else if (change < -15) demandTrend = "decreasing";
    } else if (recent > 0) {
      demandTrend = "increasing";
    }

    // Days until stockout
    const daysUntilStockout =
      averageDailyDemand > 0
        ? Math.floor(inv.quantity / averageDailyDemand)
        : inv.quantity > 0
          ? 9999
          : 0;

    // Recommended reorder date: when stock hits safety stock
    const daysToSafetyStock =
      averageDailyDemand > 0
        ? Math.floor((inv.quantity - inv.safety_stock) / averageDailyDemand)
        : 9999;
    const reorderDate = new Date(
      now.getTime() + Math.max(0, daysToSafetyStock) * 24 * 60 * 60 * 1000
    );

    // Reorder quantity: enough for 60 days at current demand rate
    const recommendedReorderQuantity = Math.max(
      inv.reorder_quantity,
      Math.ceil(averageDailyDemand * 60)
    );

    // Seasonality
    const seasonalityFactor = computeSeasonalityFactor(yearDemandRows, pid);

    // Forecasted demand
    const forecastedDemand30Days = Math.round(averageDailyDemand * 30 * seasonalityFactor);
    const forecastedDemand90Days = Math.round(averageDailyDemand * 90 * seasonalityFactor);

    results.set(pid, {
      productId: pid,
      productName: nameMap.get(pid) ?? "Unknown Product",
      currentStock: inv.quantity,
      safetyStock: inv.safety_stock,
      averageDailyDemand: Math.round(averageDailyDemand * 100) / 100,
      demandTrend,
      daysUntilStockout,
      recommendedReorderDate: reorderDate.toISOString().slice(0, 10),
      recommendedReorderQuantity,
      forecastedDemand30Days,
      forecastedDemand90Days,
      seasonalityFactor,
    });
  }

  return results;
}
