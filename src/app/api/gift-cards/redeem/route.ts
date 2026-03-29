import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, isAuthError } from "@/lib/api/auth";
import { applyRateLimit, rateLimiters } from "@/lib/api/rate-limit";
import { safeError } from "@/lib/api/safe-error";
import type { ApiResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 requests/minute
    const rateLimitResponse = await applyRateLimit(request, rateLimiters.giftCardRedeem);
    if (rateLimitResponse) return rateLimitResponse;

    const supabase = await createClient();
    const auth = await requireAuth(supabase);

    if (isAuthError(auth)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const { profile } = auth;
    const body = await request.json();
    const { code, amount } = body;

    if (!code) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Missing required field: code" },
        { status: 400 }
      );
    }

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Amount must be a positive number" },
        { status: 400 }
      );
    }

    // Fetch the gift card
    const { data: giftCard, error } = await supabase
      .from("gift_cards")
      .select("*")
      .eq("code", code.toUpperCase())
      .single();

    if (error || !giftCard) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Invalid gift card code" },
        { status: 404 }
      );
    }

    // Check is_active
    if (!giftCard.is_active) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "This gift card is no longer active" },
        { status: 400 }
      );
    }

    // Check expiration
    if (giftCard.expires_at && new Date(giftCard.expires_at) < new Date()) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "This gift card has expired" },
        { status: 400 }
      );
    }

    // Check balance
    if (giftCard.current_balance <= 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "This gift card has no remaining balance" },
        { status: 400 }
      );
    }

    // Calculate deduction amount (cannot exceed current balance)
    const deductionAmount = Math.min(amount, giftCard.current_balance);
    const newBalance =
      Math.round((giftCard.current_balance - deductionAmount) * 100) / 100;

    // Update the gift card balance
    const { data: updatedCard, error: updateError } = await supabase
      .from("gift_cards")
      .update({
        current_balance: newBalance,
        is_active: newBalance > 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", giftCard.id)
      .select()
      .single();

    if (updateError) {
      console.error("Gift card redemption error:", updateError);
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Failed to redeem gift card" },
        { status: 500 }
      );
    }

    // Add the redeemed amount to user credits
    const { error: creditsError } = await supabase
      .from("profiles")
      .update({
        credits: profile.credits + deductionAmount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (creditsError) {
      console.error("Credits update error:", creditsError);
      // Rollback gift card balance since credits update failed
      await supabase
        .from("gift_cards")
        .update({
          current_balance: giftCard.current_balance,
          is_active: giftCard.is_active,
        })
        .eq("id", giftCard.id);

      return NextResponse.json<ApiResponse>(
        { success: false, error: "Failed to apply credits to account" },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        redeemed_amount: deductionAmount,
        remaining_balance: newBalance,
        credits_added: deductionAmount,
        gift_card: updatedCard,
      },
      message: `Successfully redeemed $${deductionAmount.toFixed(2)} from gift card`,
    });
  } catch (error) {
    console.error("Gift card redeem error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, ...safeError(error, "Internal server error") },
      { status: 500 }
    );
  }
}
