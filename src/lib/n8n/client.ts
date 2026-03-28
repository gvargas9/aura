import { logAutomationEvent } from "./events";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface N8nWebhookPayload {
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
  source: string;
}

export interface OrderData {
  orderId: string;
  orderNumber: string;
  userId: string;
  subscriptionId: string | null;
  items: unknown[];
  shippingAddress: unknown;
  total: number;
  dealerAttributionId: string | null;
}

export interface LowStockProduct {
  productId: string;
  sku: string;
  name: string;
  currentQuantity: number;
  safetyStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  warehouseLocation: string;
}

export interface SubscriptionData {
  subscriptionId: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  boxSize: string;
  nextDeliveryDate: string;
  price: number;
}

export interface CustomerEvent {
  type:
    | "subscription.created"
    | "subscription.cancelled"
    | "payment.failed"
    | "payment.succeeded"
    | "churn.risk_detected";
  userId: string;
  userEmail?: string;
  data: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL ?? "";
const N8N_REQUEST_TIMEOUT_MS = 10_000;

/**
 * Build the full webhook URL from a relative path.
 * If N8N_WEBHOOK_URL is not set the call will be skipped gracefully.
 */
function resolveUrl(webhookPath: string): string | null {
  if (!N8N_WEBHOOK_URL) {
    return null;
  }
  const base = N8N_WEBHOOK_URL.replace(/\/+$/, "");
  const path = webhookPath.startsWith("/") ? webhookPath : `/${webhookPath}`;
  return `${base}${path}`;
}

// ---------------------------------------------------------------------------
// Core trigger function
// ---------------------------------------------------------------------------

/**
 * Fire-and-forget webhook call to an n8n workflow.
 *
 * Designed to never throw -- if n8n is unreachable or returns an error the
 * function logs the failure and returns `false` so that the calling code
 * (Stripe webhooks, cron jobs, etc.) is never blocked.
 */
export async function triggerN8nWebhook(
  webhookPath: string,
  payload: N8nWebhookPayload
): Promise<boolean> {
  const url = resolveUrl(webhookPath);

  if (!url) {
    console.warn(
      `[n8n] N8N_WEBHOOK_URL not configured -- skipping webhook "${webhookPath}"`
    );
    return false;
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    N8N_REQUEST_TIMEOUT_MS
  );

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error(
        `[n8n] Webhook "${webhookPath}" returned ${response.status}: ${response.statusText}`
      );
      await logAutomationEvent({
        channel: "n8n",
        event: `webhook.failed`,
        data: {
          webhookPath,
          status: response.status,
          statusText: response.statusText,
          payload,
        },
      });
      return false;
    }

    console.log(`[n8n] Webhook "${webhookPath}" triggered successfully`);
    await logAutomationEvent({
      channel: "n8n",
      event: `webhook.triggered`,
      data: { webhookPath, payloadEvent: payload.event },
    });
    return true;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      `[n8n] Failed to trigger webhook "${webhookPath}": ${message}`
    );
    await logAutomationEvent({
      channel: "n8n",
      event: `webhook.error`,
      data: { webhookPath, error: message, payload },
    });
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

// ---------------------------------------------------------------------------
// Domain-specific triggers
// ---------------------------------------------------------------------------

export async function triggerOrderFulfillment(
  order: OrderData
): Promise<boolean> {
  return triggerN8nWebhook("/order-fulfillment", {
    event: "order.created",
    data: {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      userId: order.userId,
      subscriptionId: order.subscriptionId,
      items: order.items,
      shippingAddress: order.shippingAddress,
      total: order.total,
      dealerAttributionId: order.dealerAttributionId,
    },
    timestamp: new Date().toISOString(),
    source: "aura-app",
  });
}

export async function triggerLowStockAlert(
  products: LowStockProduct[]
): Promise<boolean> {
  return triggerN8nWebhook("/low-stock-alert", {
    event: "inventory.low_stock",
    data: {
      products,
      count: products.length,
    },
    timestamp: new Date().toISOString(),
    source: "aura-cron",
  });
}

export async function triggerSubscriptionReminder(
  subscription: SubscriptionData
): Promise<boolean> {
  return triggerN8nWebhook("/subscription-reminder", {
    event: "subscription.reminder",
    data: {
      subscriptionId: subscription.subscriptionId,
      userId: subscription.userId,
      userEmail: subscription.userEmail,
      userName: subscription.userName,
      boxSize: subscription.boxSize,
      nextDeliveryDate: subscription.nextDeliveryDate,
      price: subscription.price,
    },
    timestamp: new Date().toISOString(),
    source: "aura-cron",
  });
}

export async function triggerCustomerEvent(
  event: CustomerEvent
): Promise<boolean> {
  return triggerN8nWebhook("/customer-event", {
    event: event.type,
    data: {
      userId: event.userId,
      userEmail: event.userEmail,
      ...event.data,
    },
    timestamp: new Date().toISOString(),
    source: "aura-app",
  });
}

export async function triggerPaymentFailed(params: {
  userId: string;
  userEmail?: string;
  invoiceId: string;
  subscriptionId: string | null;
  amountDue: number;
}): Promise<boolean> {
  return triggerN8nWebhook("/payment-failed", {
    event: "payment.failed",
    data: params,
    timestamp: new Date().toISOString(),
    source: "aura-app",
  });
}

export async function triggerShippingNotification(params: {
  orderId: string;
  orderNumber: string;
  userId: string;
  trackingNumber: string;
  trackingUrl: string;
  carrier: string;
  status: string;
}): Promise<boolean> {
  return triggerN8nWebhook("/shipping-notification", {
    event: "shipment.status_updated",
    data: params,
    timestamp: new Date().toISOString(),
    source: "aura-webhook",
  });
}
