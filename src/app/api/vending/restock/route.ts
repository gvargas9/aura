import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { safeError } from "@/lib/api/safe-error";
import { requireVendingAuth, isVendingAuthError } from "@/lib/api/vending-auth";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  // Rate limit: 10/min
  const rl = await applyRateLimit(request, { windowMs: 60_000, maxRequests: 10 });
  if (rl) return rl;

  // Auth
  const auth = await requireVendingAuth(request);
  if (isVendingAuthError(auth)) return auth.response;

  let body: {
    slots: Array<{ slot_number: number; quantity: number }>;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Validate slots array
  if (!body.slots || !Array.isArray(body.slots) || body.slots.length === 0) {
    return NextResponse.json(
      { success: false, error: "slots array is required and must not be empty" },
      { status: 400 }
    );
  }

  for (const slot of body.slots) {
    if (typeof slot.slot_number !== "number" || slot.slot_number < 1) {
      return NextResponse.json(
        { success: false, error: `Invalid slot_number: ${slot.slot_number}` },
        { status: 400 }
      );
    }
    if (typeof slot.quantity !== "number" || slot.quantity < 0) {
      return NextResponse.json(
        { success: false, error: `Invalid quantity for slot ${slot.slot_number}` },
        { status: 400 }
      );
    }
  }

  try {
    const results: Array<{ slot_number: number; updated: boolean }> = [];
    const now = new Date().toISOString();

    for (const slot of body.slots) {
      const { error } = await supabaseAdmin
        .from("vending_inventory")
        .update({
          quantity: slot.quantity,
          last_restocked: now,
          updated_at: now,
        })
        .eq("machine_id", auth.machine_id)
        .eq("slot_number", slot.slot_number);

      results.push({
        slot_number: slot.slot_number,
        updated: !error,
      });

      if (error) {
        console.error(
          `[vending/restock] Failed to update slot ${slot.slot_number}:`,
          error.message
        );
      }
    }

    const successCount = results.filter((r) => r.updated).length;

    return NextResponse.json({
      success: true,
      data: {
        machine_id: auth.machine_id,
        slots_updated: successCount,
        slots_failed: results.length - successCount,
        results,
      },
    });
  } catch (err) {
    console.error("[vending/restock] Unexpected error:", err);
    return NextResponse.json(
      { success: false, ...safeError(err, "Restock processing failed") },
      { status: 500 }
    );
  }
}
