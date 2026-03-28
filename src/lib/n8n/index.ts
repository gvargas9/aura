export {
  triggerN8nWebhook,
  triggerOrderFulfillment,
  triggerLowStockAlert,
  triggerSubscriptionReminder,
  triggerCustomerEvent,
  triggerPaymentFailed,
  triggerShippingNotification,
} from "./client";

export { logAutomationEvent } from "./events";

export type {
  N8nWebhookPayload,
  OrderData,
  LowStockProduct,
  SubscriptionData,
  CustomerEvent,
} from "./client";
