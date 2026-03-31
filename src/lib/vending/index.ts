export {
  notifyPriceUpdate,
  notifyProductDeactivation,
  pushSlotConfig,
  triggerVendingLowStock,
  triggerMachineOffline,
} from "./client";

export type {
  SlotConfig,
  LowStockSlot,
  VendingWebhookPayload,
  VendingWebhookEvent,
} from "./types";
