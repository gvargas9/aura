import type {
  ShippingProvider,
  ShippingAddress,
  ShipmentRate,
  ShipmentLabel,
  TrackingInfo,
} from "./types";

// ---------------------------------------------------------------------------
// EasyPost carrier integration
//
// This provider wraps the EasyPost REST API. When EASYPOST_API_KEY is
// configured the shipping client automatically selects this provider.
//
// EasyPost API docs: https://www.easypost.com/docs/api
// ---------------------------------------------------------------------------

const EASYPOST_BASE_URL = "https://api.easypost.com/v2";

interface EasyPostRequestInit {
  method: string;
  path: string;
  body?: Record<string, unknown>;
}

async function easypostFetch<T>(opts: EasyPostRequestInit): Promise<T> {
  const apiKey = process.env.EASYPOST_API_KEY;
  if (!apiKey) {
    throw new Error("EASYPOST_API_KEY is not configured");
  }

  const url = `${EASYPOST_BASE_URL}${opts.path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
  };

  const response = await fetch(url, {
    method: opts.method,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(
      `[easypost] ${opts.method} ${opts.path} returned ${response.status}:`,
      errorBody
    );
    throw new Error(
      `EasyPost API error: ${response.status} ${response.statusText}`
    );
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// EasyPost response shapes (minimal — only fields we actually use)
// ---------------------------------------------------------------------------

interface EpAddress {
  id: string;
}

interface EpRate {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  est_delivery_days: number | null;
  delivery_date: string | null;
}

interface EpShipment {
  id: string;
  rates: EpRate[];
  tracking_code: string | null;
  postage_label?: { label_url: string };
  selected_rate?: EpRate;
  tracker?: { public_url: string };
}

interface EpTracker {
  tracking_code: string;
  carrier: string;
  status: string;
  est_delivery_date: string | null;
  tracking_details: Array<{
    status: string;
    message: string;
    tracking_location?: {
      city: string;
      state: string;
    };
    datetime: string;
  }>;
}

// ---------------------------------------------------------------------------
// Provider implementation
// ---------------------------------------------------------------------------

export class EasyPostShippingProvider implements ShippingProvider {
  /**
   * In-memory map from rate ID to the EasyPost shipment ID that owns it.
   * This is necessary because purchasing a label requires the shipment ID
   * plus the rate ID.
   */
  private shipmentByRate = new Map<string, string>();

  private formatAddress(addr: ShippingAddress): Record<string, unknown> {
    return {
      address: {
        name: addr.name,
        street1: addr.street1,
        street2: addr.street2 ?? "",
        city: addr.city,
        state: addr.state,
        zip: addr.zip,
        country: addr.country,
        phone: addr.phone ?? "",
        email: addr.email ?? "",
      },
    };
  }

  async getRates(
    from: ShippingAddress,
    to: ShippingAddress,
    weight: number,
    dimensions?: { l: number; w: number; h: number }
  ): Promise<ShipmentRate[]> {
    // 1. Create the shipment (EasyPost returns rates inline)
    const parcel: Record<string, unknown> = {
      weight: weight * 16, // EasyPost expects ounces
    };
    if (dimensions) {
      parcel.length = dimensions.l;
      parcel.width = dimensions.w;
      parcel.height = dimensions.h;
    }

    const shipment = await easypostFetch<EpShipment>({
      method: "POST",
      path: "/shipments",
      body: {
        shipment: {
          from_address: this.formatAddress(from).address,
          to_address: this.formatAddress(to).address,
          parcel,
        },
      },
    });

    // 2. Map rates and remember the shipment → rate association
    const rates: ShipmentRate[] = shipment.rates.map((r) => {
      this.shipmentByRate.set(r.id, shipment.id);
      return {
        id: r.id,
        carrier: r.carrier,
        service: r.service,
        rate: parseFloat(r.rate),
        estimatedDays: r.est_delivery_days ?? 5,
        deliveryDate: r.delivery_date ?? undefined,
      };
    });

    return rates.sort((a, b) => a.rate - b.rate);
  }

  async createLabel(rateId: string, _orderId: string): Promise<ShipmentLabel> {
    const shipmentId = this.shipmentByRate.get(rateId);
    if (!shipmentId) {
      throw new Error(
        `No shipment found for rate ${rateId}. Call getRates first.`
      );
    }

    // Purchase the label by selecting the rate on the shipment
    const shipment = await easypostFetch<EpShipment>({
      method: "POST",
      path: `/shipments/${shipmentId}/buy`,
      body: { rate: { id: rateId } },
    });

    const selectedRate = shipment.selected_rate;

    return {
      trackingNumber: shipment.tracking_code ?? "",
      trackingUrl: shipment.tracker?.public_url ?? "",
      labelUrl: shipment.postage_label?.label_url ?? "",
      carrier: selectedRate?.carrier ?? "",
      service: selectedRate?.service ?? "",
      rate: selectedRate ? parseFloat(selectedRate.rate) : 0,
    };
  }

  async getTracking(
    trackingNumber: string,
    carrier: string
  ): Promise<TrackingInfo> {
    const tracker = await easypostFetch<EpTracker>({
      method: "POST",
      path: "/trackers",
      body: {
        tracker: {
          tracking_code: trackingNumber,
          carrier,
        },
      },
    });

    return {
      trackingNumber: tracker.tracking_code,
      carrier: tracker.carrier,
      status: tracker.status,
      estimatedDelivery: tracker.est_delivery_date ?? undefined,
      events: tracker.tracking_details.map((d) => ({
        status: d.status,
        message: d.message,
        location: d.tracking_location
          ? `${d.tracking_location.city}, ${d.tracking_location.state}`
          : undefined,
        timestamp: d.datetime,
      })),
    };
  }

  async cancelLabel(trackingNumber: string): Promise<boolean> {
    // EasyPost refunds are processed on the shipment, but we only have the
    // tracking number here.  Create a refund request.
    try {
      await easypostFetch<unknown>({
        method: "POST",
        path: "/refunds",
        body: {
          refund: {
            tracking_codes: [trackingNumber],
          },
        },
      });
      return true;
    } catch (error) {
      console.error("[easypost] Failed to cancel label:", error);
      return false;
    }
  }
}
