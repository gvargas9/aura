import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { sanitizeString } from "@/lib/api/validation";
import { safeError } from "@/lib/api/safe-error";
import { requireVendingAuth, isVendingAuthError } from "@/lib/api/vending-auth";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  // Rate limit: 60/min
  const rl = await applyRateLimit(request, { windowMs: 60_000, maxRequests: 60 });
  if (rl) return rl;

  // Auth
  const auth = await requireVendingAuth(request);
  if (isVendingAuthError(auth)) return auth.response;

  const supabaseAdmin = getServiceClient();

  let body: {
    slot_number: number;
    payment_method: "card" | "cash" | "mobile";
    transaction_ref?: string;
    amount: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Validate required fields
  if (typeof body.slot_number !== "number" || body.slot_number < 1) {
    return NextResponse.json(
      { success: false, error: "Invalid slot_number" },
      { status: 400 }
    );
  }

  const validPaymentMethods = ["card", "cash", "mobile"];
  if (!body.payment_method || !validPaymentMethods.includes(body.payment_method)) {
    return NextResponse.json(
      { success: false, error: "Invalid payment_method. Must be card, cash, or mobile." },
      { status: 400 }
    );
  }

  if (typeof body.amount !== "number" || body.amount <= 0 || body.amount > 99999) {
    return NextResponse.json(
      { success: false, error: "Invalid amount" },
      { status: 400 }
    );
  }

  try {
    // Create transaction record
    const { data: transaction, error: txError } = await supabaseAdmin
      .from("vending_transactions")
      .insert({
        machine_id: auth.machine_id,
        slot_number: body.slot_number,
        payment_method: body.payment_method,
        transaction_ref: body.transaction_ref
          ? sanitizeString(body.transaction_ref)
          : null,
        amount: body.amount,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (txError) {
      console.error("[vending/transaction] Insert failed:", txError.message);
      return NextResponse.json(
        { success: false, ...safeError(txError, "Failed to record transaction") },
        { status: 500 }
      );
    }

    // Decrement inventory for the slot
    const { data: currentSlot } = await supabaseAdmin
      .from("vending_inventory")
      .select("quantity")
      .eq("machine_id", auth.machine_id)
      .eq("slot_number", body.slot_number)
      .single();

    if (currentSlot && currentSlot.quantity > 0) {
      await supabaseAdmin
        .from("vending_inventory")
        .update({
          quantity: currentSlot.quantity - 1,
          updated_at: new Date().toISOString(),
        })
        .eq("machine_id", auth.machine_id)
        .eq("slot_number", body.slot_number);
    }

    // Update machine sales totals
    const { data: machine } = await supabaseAdmin
      .from("vending_machines")
      .select("total_sales, total_transactions")
      .eq("id", auth.machine_id)
      .single();

    if (machine) {
      await supabaseAdmin
        .from("vending_machines")
        .update({
          total_sales: (machine.total_sales ?? 0) + body.amount,
          total_transactions: (machine.total_transactions ?? 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", auth.machine_id);
    }

    return NextResponse.json({
      success: true,
      data: {
        transaction_id: transaction.id,
        machine_id: auth.machine_id,
        slot_number: body.slot_number,
        amount: body.amount,
      },
    });
  } catch (err) {
    console.error("[vending/transaction] Unexpected error:", err);
    return NextResponse.json(
      { success: false, ...safeError(err, "Transaction processing failed") },
      { status: 500 }
    );
  }
}
