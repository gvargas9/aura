import type { ShippingAddress } from "./types";

// ---------------------------------------------------------------------------
// Warehouse configuration — all shipments originate from El Paso, TX
// ---------------------------------------------------------------------------

export const WAREHOUSE_ADDRESS: ShippingAddress = {
  name: "Aura Fulfillment Center",
  street1: "123 Commerce Way",
  city: "El Paso",
  state: "TX",
  zip: "79901",
  country: "US",
  phone: "1-800-287-2669",
  email: "fulfillment@aura.com",
};

export const DEFAULT_PACKAGE = {
  weight: 5,
  dimensions: { l: 12, w: 10, h: 6 },
};

// ---------------------------------------------------------------------------
// Weight calculation
// ---------------------------------------------------------------------------

const BASE_WEIGHTS: Record<string, number> = {
  starter: 4,
  voyager: 6,
  bunker: 12,
};

const WEIGHT_PER_ITEM_LB = 0.4;

/**
 * Estimate total package weight based on box size and item count.
 * Includes the box itself plus per-item weight.
 */
export function getPackageWeight(boxSize: string, itemCount: number): number {
  const base = BASE_WEIGHTS[boxSize] ?? DEFAULT_PACKAGE.weight;
  return Math.round((base + itemCount * WEIGHT_PER_ITEM_LB) * 10) / 10;
}

/**
 * Return package dimensions for a given box size.
 */
export function getPackageDimensions(
  boxSize: string
): { l: number; w: number; h: number } {
  switch (boxSize) {
    case "starter":
      return { l: 12, w: 10, h: 6 };
    case "voyager":
      return { l: 14, w: 12, h: 8 };
    case "bunker":
      return { l: 18, w: 14, h: 10 };
    default:
      return DEFAULT_PACKAGE.dimensions;
  }
}
