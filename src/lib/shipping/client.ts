import type {
  ShippingProvider,
  ShippingAddress,
  ShipmentRate,
  ShipmentLabel,
  TrackingInfo,
} from "./types";
import { EasyPostShippingProvider } from "./easypost-provider";
import { MockShippingProvider } from "./mock-provider";

// ---------------------------------------------------------------------------
// Shipping client — thin facade that picks the correct provider at runtime.
//
// When EASYPOST_API_KEY is set the real EasyPost provider is used. Otherwise
// a mock provider returns realistic fake data so the entire flow can be
// exercised during local development without a carrier account.
//
// To swap to Shippo or ShipStation, create a new provider that implements
// the ShippingProvider interface and update the `getProvider()` function.
// ---------------------------------------------------------------------------

let _provider: ShippingProvider | null = null;

function getProvider(): ShippingProvider {
  if (_provider) return _provider;

  if (process.env.EASYPOST_API_KEY) {
    console.log("[shipping] Using EasyPost provider");
    _provider = new EasyPostShippingProvider();
  } else {
    console.log("[shipping] EASYPOST_API_KEY not set — using mock provider");
    _provider = new MockShippingProvider();
  }

  return _provider;
}

/**
 * Returns whether the shipping client is operating in mock/demo mode.
 */
export function isUsingMockProvider(): boolean {
  return !process.env.EASYPOST_API_KEY;
}

/**
 * Fetch available shipping rates for a package.
 */
export async function getRates(
  from: ShippingAddress,
  to: ShippingAddress,
  weight: number,
  dimensions?: { l: number; w: number; h: number }
): Promise<ShipmentRate[]> {
  return getProvider().getRates(from, to, weight, dimensions);
}

/**
 * Purchase a shipping label for a previously quoted rate.
 */
export async function createLabel(
  rateId: string,
  orderId: string
): Promise<ShipmentLabel> {
  return getProvider().createLabel(rateId, orderId);
}

/**
 * Retrieve tracking information for a shipment.
 */
export async function getTracking(
  trackingNumber: string,
  carrier: string
): Promise<TrackingInfo> {
  return getProvider().getTracking(trackingNumber, carrier);
}

/**
 * Cancel/void a previously purchased shipping label.
 */
export async function cancelLabel(
  trackingNumber: string
): Promise<boolean> {
  return getProvider().cancelLabel(trackingNumber);
}

// Re-export types for convenience
export type {
  ShippingAddress,
  ShipmentRate,
  ShipmentLabel,
  TrackingEvent,
  TrackingInfo,
} from "./types";
