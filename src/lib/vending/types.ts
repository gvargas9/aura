// ---------------------------------------------------------------------------
// Vending machine webhook types
// ---------------------------------------------------------------------------

export interface SlotConfig {
  slot_number: number;
  product_id: string;
  quantity: number;
  max_quantity: number;
  price: number;
}

export interface LowStockSlot {
  slot_number: number;
  product_name: string;
  current_quantity: number;
  max_quantity: number;
}

export type VendingWebhookEvent =
  | "price_update"
  | "product_deactivation"
  | "slot_config"
  | "low_stock"
  | "machine_offline";

export interface VendingWebhookPayload {
  event: VendingWebhookEvent;
  machine_id?: string;
  data: Record<string, unknown>;
  timestamp: string;
}
