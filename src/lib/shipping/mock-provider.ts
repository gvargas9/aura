import type {
  ShippingProvider,
  ShippingAddress,
  ShipmentRate,
  ShipmentLabel,
  TrackingEvent,
  TrackingInfo,
} from "./types";

// ---------------------------------------------------------------------------
// Mock / demo provider — returns realistic fake data when EASYPOST_API_KEY
// is not configured. This allows local development and staging environments
// to exercise the full shipping flow without incurring carrier charges.
// ---------------------------------------------------------------------------

function generateTrackingNumber(carrier: string): string {
  const rand = () =>
    Math.random().toString(36).substring(2, 6).toUpperCase();
  const digits = () =>
    Math.floor(100000000000 + Math.random() * 900000000000).toString();

  switch (carrier) {
    case "USPS":
      return `9400${digits()}`;
    case "UPS":
      return `1Z${rand()}${rand()}${digits().slice(0, 8)}`;
    case "FedEx":
      return digits().slice(0, 12);
    default:
      return `MOCK-${rand()}-${rand()}`;
  }
}

function randomId(): string {
  return `rate_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function addBusinessDays(from: Date, days: number): Date {
  const result = new Date(from);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      added++;
    }
  }
  return result;
}

/**
 * Build a deterministic-but-varied set of rates based on the origin/destination
 * distance (approximated by zip code difference) and package weight.
 */
function buildMockRates(
  weight: number,
  _from: ShippingAddress,
  _to: ShippingAddress
): ShipmentRate[] {
  const now = new Date();
  const baseMultiplier = Math.max(0.8, weight / 10);

  return [
    {
      id: randomId(),
      carrier: "USPS",
      service: "Priority Mail",
      rate: Math.round(8.95 * baseMultiplier * 100) / 100,
      estimatedDays: 3,
      deliveryDate: addBusinessDays(now, 3).toISOString(),
    },
    {
      id: randomId(),
      carrier: "USPS",
      service: "Priority Mail Express",
      rate: Math.round(24.5 * baseMultiplier * 100) / 100,
      estimatedDays: 1,
      deliveryDate: addBusinessDays(now, 1).toISOString(),
    },
    {
      id: randomId(),
      carrier: "USPS",
      service: "Ground Advantage",
      rate: Math.round(6.45 * baseMultiplier * 100) / 100,
      estimatedDays: 5,
      deliveryDate: addBusinessDays(now, 5).toISOString(),
    },
    {
      id: randomId(),
      carrier: "UPS",
      service: "Ground",
      rate: Math.round(11.35 * baseMultiplier * 100) / 100,
      estimatedDays: 4,
      deliveryDate: addBusinessDays(now, 4).toISOString(),
    },
    {
      id: randomId(),
      carrier: "UPS",
      service: "2nd Day Air",
      rate: Math.round(28.9 * baseMultiplier * 100) / 100,
      estimatedDays: 2,
      deliveryDate: addBusinessDays(now, 2).toISOString(),
    },
    {
      id: randomId(),
      carrier: "UPS",
      service: "Next Day Air",
      rate: Math.round(48.75 * baseMultiplier * 100) / 100,
      estimatedDays: 1,
      deliveryDate: addBusinessDays(now, 1).toISOString(),
    },
    {
      id: randomId(),
      carrier: "FedEx",
      service: "Ground",
      rate: Math.round(10.85 * baseMultiplier * 100) / 100,
      estimatedDays: 4,
      deliveryDate: addBusinessDays(now, 4).toISOString(),
    },
    {
      id: randomId(),
      carrier: "FedEx",
      service: "Express Saver",
      rate: Math.round(22.5 * baseMultiplier * 100) / 100,
      estimatedDays: 3,
      deliveryDate: addBusinessDays(now, 3).toISOString(),
    },
    {
      id: randomId(),
      carrier: "FedEx",
      service: "2Day",
      rate: Math.round(32.15 * baseMultiplier * 100) / 100,
      estimatedDays: 2,
      deliveryDate: addBusinessDays(now, 2).toISOString(),
    },
  ];
}

/** In-memory store so createLabel can look up the chosen rate. */
const rateStore = new Map<
  string,
  { carrier: string; service: string; rate: number }
>();

/**
 * Generate a realistic sequence of tracking events from shipment creation
 * through delivery, backdated relative to "now".
 */
function buildMockTrackingEvents(
  carrier: string,
  originCity: string,
  destinationCity: string
): { status: string; events: TrackingEvent[] } {
  const now = new Date();
  const events: TrackingEvent[] = [];

  // Pick a random state from the lifecycle
  const stages = [
    "pre_transit",
    "in_transit",
    "in_transit",
    "out_for_delivery",
    "delivered",
  ] as const;
  const currentStageIdx = Math.min(
    stages.length - 1,
    Math.floor(Math.random() * (stages.length + 1))
  );
  const currentStatus = stages[currentStageIdx];

  const hoursBack = (currentStageIdx + 1) * 18;

  events.push({
    status: "pre_transit",
    message: "Shipping label created",
    location: `${originCity}, TX`,
    timestamp: new Date(now.getTime() - hoursBack * 3600_000).toISOString(),
  });

  if (currentStageIdx >= 1) {
    events.push({
      status: "in_transit",
      message: `Picked up by ${carrier}`,
      location: `${originCity}, TX`,
      timestamp: new Date(
        now.getTime() - (hoursBack - 12) * 3600_000
      ).toISOString(),
    });
  }

  if (currentStageIdx >= 2) {
    events.push({
      status: "in_transit",
      message: "In transit to destination",
      location: `${carrier} Regional Facility`,
      timestamp: new Date(
        now.getTime() - (hoursBack - 30) * 3600_000
      ).toISOString(),
    });
  }

  if (currentStageIdx >= 3) {
    events.push({
      status: "out_for_delivery",
      message: "Out for delivery",
      location: destinationCity,
      timestamp: new Date(
        now.getTime() - 4 * 3600_000
      ).toISOString(),
    });
  }

  if (currentStageIdx >= 4) {
    events.push({
      status: "delivered",
      message: "Delivered — left at front door",
      location: destinationCity,
      timestamp: new Date(
        now.getTime() - 1 * 3600_000
      ).toISOString(),
    });
  }

  return { status: currentStatus, events: events.reverse() };
}

// ---------------------------------------------------------------------------
// Provider implementation
// ---------------------------------------------------------------------------

export class MockShippingProvider implements ShippingProvider {
  async getRates(
    from: ShippingAddress,
    to: ShippingAddress,
    weight: number
  ): Promise<ShipmentRate[]> {
    // Simulate network latency
    await new Promise((r) => setTimeout(r, 300));

    const rates = buildMockRates(weight, from, to);

    // Store rates so createLabel can reference them
    for (const rate of rates) {
      rateStore.set(rate.id, {
        carrier: rate.carrier,
        service: rate.service,
        rate: rate.rate,
      });
    }

    return rates.sort((a, b) => a.rate - b.rate);
  }

  async createLabel(rateId: string, _orderId: string): Promise<ShipmentLabel> {
    await new Promise((r) => setTimeout(r, 250));

    const chosen = rateStore.get(rateId);
    const carrier = chosen?.carrier ?? "USPS";
    const service = chosen?.service ?? "Priority Mail";
    const rate = chosen?.rate ?? 8.95;

    const trackingNumber = generateTrackingNumber(carrier);

    const trackingUrlMap: Record<string, string> = {
      USPS: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
      UPS: `https://www.ups.com/track?tracknum=${trackingNumber}`,
      FedEx: `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
    };

    return {
      trackingNumber,
      trackingUrl:
        trackingUrlMap[carrier] ??
        `https://track.example.com/${trackingNumber}`,
      labelUrl: `https://labels.mock.aura.com/${trackingNumber}.pdf`,
      carrier,
      service,
      rate,
    };
  }

  async getTracking(
    trackingNumber: string,
    carrier: string
  ): Promise<TrackingInfo> {
    await new Promise((r) => setTimeout(r, 200));

    const { status, events } = buildMockTrackingEvents(
      carrier,
      "El Paso",
      "Phoenix"
    );

    const estimatedDelivery =
      status !== "delivered"
        ? new Date(Date.now() + 2 * 86400_000).toISOString()
        : undefined;

    return {
      trackingNumber,
      carrier,
      status,
      estimatedDelivery,
      events,
    };
  }

  async cancelLabel(_trackingNumber: string): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 150));
    return true;
  }
}
