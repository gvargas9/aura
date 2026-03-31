import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { validateUUID } from "@/lib/api/validation";
import { safeError } from "@/lib/api/safe-error";
import { requireVendingAuth, isVendingAuthError } from "@/lib/api/vending-auth";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ machineId: string }> }
) {
  // Rate limit: 10/min
  const rl = await applyRateLimit(request, { windowMs: 60_000, maxRequests: 10 });
  if (rl) return rl;

  // Auth
  const auth = await requireVendingAuth(request);
  if (isVendingAuthError(auth)) return auth.response;

  const { machineId } = await params;

  // Validate machineId format
  if (!validateUUID(machineId)) {
    return NextResponse.json(
      { success: false, error: "Invalid machine ID format" },
      { status: 400 }
    );
  }

  // Ensure the API key matches the requested machine
  if (auth.machine_id !== machineId) {
    return NextResponse.json(
      { success: false, error: "API key does not match requested machine" },
      { status: 403 }
    );
  }

  try {
    // Fetch inventory with product details
    const { data: slots, error } = await supabaseAdmin
      .from("vending_inventory")
      .select(
        `
        slot_number,
        product_id,
        quantity,
        max_quantity,
        price,
        aura_products (
          name
        )
      `
      )
      .eq("machine_id", machineId)
      .order("slot_number", { ascending: true });

    if (error) {
      console.error("[vending/inventory] Query failed:", error.message);
      return NextResponse.json(
        { success: false, ...safeError(error, "Failed to fetch inventory") },
        { status: 500 }
      );
    }

    const formattedSlots = (slots ?? []).map((slot) => ({
      slot_number: slot.slot_number,
      product_id: slot.product_id,
      product_name:
        (slot.aura_products as unknown as { name: string } | null)?.name ?? null,
      quantity: slot.quantity,
      max_quantity: slot.max_quantity,
      price: slot.price,
    }));

    return NextResponse.json({
      success: true,
      data: {
        machine_id: machineId,
        slots: formattedSlots,
      },
    });
  } catch (err) {
    console.error("[vending/inventory] Unexpected error:", err);
    return NextResponse.json(
      { success: false, ...safeError(err, "Inventory fetch failed") },
      { status: 500 }
    );
  }
}
