// ---------------------------------------------------------------------------
// Shipping integration types
// ---------------------------------------------------------------------------

export interface ShippingAddress {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
}

export interface ShipmentRate {
  id: string;
  carrier: string;
  service: string;
  rate: number;
  estimatedDays: number;
  deliveryDate?: string;
}

export interface ShipmentLabel {
  trackingNumber: string;
  trackingUrl: string;
  labelUrl: string;
  carrier: string;
  service: string;
  rate: number;
}

export interface TrackingEvent {
  status: string;
  message: string;
  location?: string;
  timestamp: string;
}

export interface TrackingInfo {
  trackingNumber: string;
  carrier: string;
  status: string;
  estimatedDelivery?: string;
  events: TrackingEvent[];
}

/**
 * Carrier provider interface. Any shipping provider (EasyPost, Shippo,
 * ShipStation) must implement these four methods.
 */
export interface ShippingProvider {
  getRates(
    from: ShippingAddress,
    to: ShippingAddress,
    weight: number,
    dimensions?: { l: number; w: number; h: number }
  ): Promise<ShipmentRate[]>;

  createLabel(rateId: string, orderId: string): Promise<ShipmentLabel>;

  getTracking(
    trackingNumber: string,
    carrier: string
  ): Promise<TrackingInfo>;

  cancelLabel(trackingNumber: string): Promise<boolean>;
}
