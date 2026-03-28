import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, corsResponse, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { createAdminClient, getUser } from "../_shared/auth.ts";

interface RedeemRequest {
  code: string;
  amount: number;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return corsResponse();
  }

  try {
    const supabase = createAdminClient();

    // ---- Authenticate user ----
    const user = await getUser(req, supabase);
    if (!user) {
      return errorResponse("Authentication required", 401);
    }

    const body: RedeemRequest = await req.json();

    if (!body.code || typeof body.code !== "string") {
      return errorResponse("Gift card code is required");
    }
    if (!body.amount || typeof body.amount !== "number" || body.amount <= 0) {
      return errorResponse("A positive amount is required");
    }

    const code = body.code.trim().toUpperCase();
    const amount = Math.round(body.amount * 100) / 100;

    // ---- Fetch gift card with row-level lock simulation ----
    // Use a select + conditional update pattern for atomicity
    const { data: giftCard, error: gcError } = await supabase
      .from("gift_cards")
      .select("id, current_balance, is_active, expires_at, redeemed_by")
      .eq("code", code)
      .single();

    if (gcError || !giftCard) {
      return errorResponse("Gift card not found", 404);
    }

    if (!giftCard.is_active) {
      return errorResponse("This gift card is no longer active");
    }

    if (giftCard.expires_at && new Date(giftCard.expires_at) < new Date()) {
      return errorResponse("This gift card has expired");
    }

    const currentBalance = Number(giftCard.current_balance);
    if (currentBalance <= 0) {
      return errorResponse("This gift card has no remaining balance");
    }

    if (amount > currentBalance) {
      return errorResponse(
        `Insufficient balance. Available: $${currentBalance.toFixed(2)}`,
      );
    }

    // ---- Atomic deduction: update only if balance is still sufficient ----
    const newBalance = Math.round((currentBalance - amount) * 100) / 100;

    const { data: updated, error: updateError } = await supabase
      .from("gift_cards")
      .update({
        current_balance: newBalance,
        redeemed_by: giftCard.redeemed_by ?? user.id,
        redeemed_at: giftCard.redeemed_by ? undefined : new Date().toISOString(),
      })
      .eq("id", giftCard.id)
      .gte("current_balance", amount) // Optimistic concurrency guard
      .select("id, current_balance")
      .single();

    if (updateError || !updated) {
      return errorResponse(
        "Failed to redeem gift card. The balance may have changed. Please try again.",
        409,
      );
    }

    // ---- Record transaction ----
    const { error: txError } = await supabase.from("gift_card_transactions").insert({
      gift_card_id: giftCard.id,
      amount: -amount,
      balance_after: newBalance,
      type: "debit",
      notes: `Redeemed by user ${user.id}`,
    });

    if (txError) {
      console.error("Gift card transaction insert error:", txError);
      // The balance was already deducted; log but do not fail the user
    }

    // ---- Add credits to user profile ----
    const creditAmount = Math.round(amount * 100); // Store as integer cents

    // Fetch current credits
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    const newCredits = (profile?.credits ?? 0) + creditAmount;

    await supabase
      .from("profiles")
      .update({ credits: newCredits })
      .eq("id", user.id);

    // Record in credit ledger
    await supabase.from("credit_ledger").insert({
      user_id: user.id,
      amount: creditAmount,
      type: "adjustment",
      reference_id: giftCard.id,
      reference_type: "gift_card",
      description: `Gift card ${code} redeemed for $${amount.toFixed(2)}`,
    });

    return jsonResponse({
      success: true,
      giftCardId: giftCard.id,
      amountRedeemed: amount,
      remainingBalance: newBalance,
      creditsAdded: creditAmount,
      newCreditBalance: newCredits,
    });
  } catch (err) {
    console.error("redeem-gift-card error:", err);
    return errorResponse("Internal server error", 500);
  }
});
