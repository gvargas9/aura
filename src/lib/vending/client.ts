import { createClient } from "@supabase/supabase-js";
import { triggerN8nWebhook } from "@/lib/n8n/client";
import { logAutomationEvent } from "@/lib/n8n/events";
import type { Database } from "@/types/database";
import type {
  SlotConfig,
  LowStockSlot,
  VendingWebhookPayload,
} from "./types";

// ---------------------------------------------------------------------------
// Service-role Supabase client (lazy init, same pattern as n8n/events.ts)
// ---------------------------------------------------------------------------

let _supabaseAdmin: ReturnType<typeof createClient<Database>> | null = null;

function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      return null;
    }

    _supabaseAdmin = createClient<Database>(url, key);
  }
  return _supabaseAdmin;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const VENDING_REQUEST_TIMEOUT_MS = 10_000;

/**
 * Send a webhook payload to a single vending machine endpoint.
 * Fire-and-forget: never throws.
 */
async function sendToMachine(
  webhookUrl: string,
  payload: VendingWebhookPayload
): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    VENDING_REQUEST_TIMEOUT_MS
  );

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error(
        `[vending] Webhook to ${webhookUrl} returned ${response.status}: ${response.statusText}`
      );
      return false;
    }

    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(
      `[vending] Failed to send webhook to ${webhookUrl}: ${message}`
    );
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Broadcast a webhook payload to all active vending machines that have a
 * webhook_url configured. Optionally filter to a specific machine.
 */
async function broadcastToMachines(
  payload: VendingWebhookPayload,
  machineId?: string
): Promise<void> {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    console.warn(
      "[vending] Supabase not configured -- skipping vending webhook broadcast"
    );
    return;
  }

  try {
    let query = supabase
      .from("vending_machines" as never)
      .select("id, machine_serial, webhook_url, status")
      .eq("status", "online")
      .not("webhook_url", "is", null);

    if (machineId) {
      query = query.eq("id", machineId);
    }

    const { data: machines, error } = await query;

    if (error) {
      console.error(
        "[vending] Failed to query vending machines:",
        error.message
      );
      return;
    }

    if (!machines || machines.length === 0) {
      console.log(
        "[vending] No active machines with webhook_url found -- skipping"
      );
      return;
    }

    // Fire all webhooks in parallel, don't await individually
    const results = await Promise.allSettled(
      machines.map((machine: Record<string, unknown>) =>
        sendToMachine(machine.webhook_url as string, {
          ...payload,
          machine_id: machine.id as string,
        })
      )
    );

    const succeeded = results.filter(
      (r) => r.status === "fulfilled" && r.value === true
    ).length;

    console.log(
      `[vending] Broadcast "${payload.event}" to ${machines.length} machines (${succeeded} succeeded)`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[vending] Broadcast failed:", message);
  }
}

// ---------------------------------------------------------------------------
// Public API — fire-and-forget, never throws
// ---------------------------------------------------------------------------

/**
 * Notify all active vending machines about a price change for a product.
 */
export async function notifyPriceUpdate(
  productId: string,
  newPrice: number
): Promise<void> {
  try {
    const payload: VendingWebhookPayload = {
      event: "price_update",
      data: { product_id: productId, new_price: newPrice },
      timestamp: new Date().toISOString(),
    };

    await broadcastToMachines(payload);

    await logAutomationEvent({
      channel: "webhook",
      event: "vending.price_update",
      data: { productId, newPrice },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[vending] notifyPriceUpdate failed:", message);
  }
}

/**
 * Notify all active vending machines that a product has been deactivated
 * so they can remove it from their slots.
 */
export async function notifyProductDeactivation(
  productId: string
): Promise<void> {
  try {
    const payload: VendingWebhookPayload = {
      event: "product_deactivation",
      data: { product_id: productId },
      timestamp: new Date().toISOString(),
    };

    await broadcastToMachines(payload);

    await logAutomationEvent({
      channel: "webhook",
      event: "vending.product_deactivation",
      data: { productId },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[vending] notifyProductDeactivation failed:", message);
  }
}

/**
 * Push a new slot configuration to a specific vending machine.
 */
export async function pushSlotConfig(
  machineId: string,
  slots: SlotConfig[]
): Promise<void> {
  try {
    const payload: VendingWebhookPayload = {
      event: "slot_config",
      machine_id: machineId,
      data: { slots },
      timestamp: new Date().toISOString(),
    };

    await broadcastToMachines(payload, machineId);

    await logAutomationEvent({
      channel: "webhook",
      event: "vending.slot_config_pushed",
      data: { machineId, slotCount: slots.length },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[vending] pushSlotConfig failed:", message);
  }
}

/**
 * Notify about low stock in a vending machine. Triggers n8n workflow
 * for auto-PO generation in addition to the machine webhook.
 */
export async function triggerVendingLowStock(
  machineId: string,
  machineSerial: string,
  slots: LowStockSlot[]
): Promise<void> {
  try {
    const payload: VendingWebhookPayload = {
      event: "low_stock",
      machine_id: machineId,
      data: { machine_serial: machineSerial, slots },
      timestamp: new Date().toISOString(),
    };

    // Notify the machine itself
    await broadcastToMachines(payload, machineId);

    // Trigger n8n workflow for alerting / auto-PO
    await triggerN8nWebhook("/vending-low-stock", {
      event: "vending.low_stock",
      data: {
        machineId,
        machineSerial,
        slots,
        slotCount: slots.length,
      },
      timestamp: new Date().toISOString(),
      source: "aura-vending",
    });

    await logAutomationEvent({
      channel: "webhook",
      event: "vending.low_stock",
      data: { machineId, machineSerial, lowStockSlots: slots.length },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[vending] triggerVendingLowStock failed:", message);
  }
}

/**
 * Notify about a vending machine going offline. Triggers n8n workflow
 * for alerting and escalation.
 */
export async function triggerMachineOffline(
  machineId: string,
  machineSerial: string
): Promise<void> {
  try {
    // Trigger n8n workflow for alerting (machine is offline, can't receive webhook)
    await triggerN8nWebhook("/vending-machine-offline", {
      event: "vending.machine_offline",
      data: { machineId, machineSerial },
      timestamp: new Date().toISOString(),
      source: "aura-vending",
    });

    await logAutomationEvent({
      channel: "webhook",
      event: "vending.machine_offline",
      data: { machineId, machineSerial },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[vending] triggerMachineOffline failed:", message);
  }
}
