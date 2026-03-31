import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { safeError } from "@/lib/api/safe-error";
import { requireVendingAuth, isVendingAuthError } from "@/lib/api/vending-auth";
import { triggerLowStockAlert } from "@/lib/n8n";
import type { LowStockProduct } from "@/lib/n8n";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  // Rate limit: 20/min
  const rl = await applyRateLimit(request, { windowMs: 60_000, maxRequests: 20 });
  if (rl) return rl;

  // Auth
  const auth = await requireVendingAuth(request);
  if (isVendingAuthError(auth)) return auth.response;

  let body: {
    status: "online" | "offline" | "maintenance";
    inventory?: Array<{ slot_number: number; quantity: number }>;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Validate status
  const validStatuses = ["online", "offline", "maintenance"];
  if (!body.status || !validStatuses.includes(body.status)) {
    return NextResponse.json(
      { success: false, error: "Invalid status. Must be online, offline, or maintenance." },
      { status: 400 }
    );
  }

  try {
    // Update machine checkin and status
    const { error: machineError } = await supabaseAdmin
      .from("vending_machines")
      .update({
        last_checkin: new Date().toISOString(),
        status: body.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", auth.machine_id);

    if (machineError) {
      console.error("[vending/heartbeat] Machine update failed:", machineError.message);
      return NextResponse.json(
        { success: false, ...safeError(machineError, "Failed to update machine status") },
        { status: 500 }
      );
    }

    // Optionally update inventory for reported slots
    const lowStockSlots: Array<{ slot_number: number; quantity: number }> = [];

    if (body.inventory && Array.isArray(body.inventory)) {
      for (const slot of body.inventory) {
        if (typeof slot.slot_number !== "number" || typeof slot.quantity !== "number") {
          continue;
        }

        const { error: invError } = await supabaseAdmin
          .from("vending_inventory")
          .update({
            quantity: slot.quantity,
            updated_at: new Date().toISOString(),
          })
          .eq("machine_id", auth.machine_id)
          .eq("slot_number", slot.slot_number);

        if (invError) {
          console.error(
            `[vending/heartbeat] Inventory update failed for slot ${slot.slot_number}:`,
            invError.message
          );
        }

        if (slot.quantity < 3) {
          lowStockSlots.push(slot);
        }
      }
    }

    // Trigger low stock alert if any slot is below threshold
    if (lowStockSlots.length > 0) {
      // Fire-and-forget: fetch product info for alert
      const { data: slotProducts } = await supabaseAdmin
        .from("vending_inventory")
        .select("slot_number, product_id, quantity")
        .eq("machine_id", auth.machine_id)
        .in(
          "slot_number",
          lowStockSlots.map((s) => s.slot_number)
        );

      if (slotProducts && slotProducts.length > 0) {
        const alertProducts: LowStockProduct[] = slotProducts.map((sp) => ({
          productId: sp.product_id,
          sku: `VEND-${auth.machine_serial}-S${sp.slot_number}`,
          name: `Vending slot ${sp.slot_number}`,
          currentQuantity: sp.quantity,
          safetyStock: 3,
          reorderPoint: 3,
          reorderQuantity: 10,
          warehouseLocation: `vending-${auth.machine_serial}`,
        }));

        // Fire-and-forget
        triggerLowStockAlert(alertProducts).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        machine_id: auth.machine_id,
        status: body.status,
        slots_updated: body.inventory?.length ?? 0,
        low_stock_alerts: lowStockSlots.length,
      },
    });
  } catch (err) {
    console.error("[vending/heartbeat] Unexpected error:", err);
    return NextResponse.json(
      { success: false, ...safeError(err, "Heartbeat processing failed") },
      { status: 500 }
    );
  }
}
