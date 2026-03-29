import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { applyRateLimit, rateLimiters } from "@/lib/api/rate-limit";
import { safeError } from "@/lib/api/safe-error";

function generateGiftCardCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const segment = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `AURA-${segment()}-${segment()}-${segment()}`;
}

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 requests/minute
    const rateLimitResponse = await applyRateLimit(request, rateLimiters.giftCardPurchase);
    if (rateLimitResponse) return rateLimitResponse;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { amount, recipientName, recipientEmail, message, scheduledDate } = body;

    // Validate amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 10 || parsedAmount > 500) {
      return NextResponse.json(
        { error: "Gift card amount must be between $10 and $500" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!recipientName?.trim()) {
      return NextResponse.json(
        { error: "Recipient name is required" },
        { status: 400 }
      );
    }

    if (!recipientEmail?.trim()) {
      return NextResponse.json(
        { error: "Recipient email is required" },
        { status: 400 }
      );
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    // Validate scheduled date if provided
    if (scheduledDate) {
      const schedDate = new Date(scheduledDate);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      if (isNaN(schedDate.getTime()) || schedDate < now) {
        return NextResponse.json(
          { error: "Scheduled date must be today or a future date" },
          { status: 400 }
        );
      }
    }

    // Generate unique code ensuring no collision
    const serviceClient = getServiceClient();
    let code = generateGiftCardCode();
    let attempts = 0;

    while (attempts < 5) {
      const { data: existing } = await serviceClient
        .from("gift_cards")
        .select("id")
        .eq("code", code)
        .single();

      if (!existing) break;
      code = generateGiftCardCode();
      attempts++;
    }

    if (attempts >= 5) {
      return NextResponse.json(
        { error: "Failed to generate unique gift card code. Please try again." },
        { status: 500 }
      );
    }

    // Set expiry to 1 year from now
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // Insert gift card
    const { data: giftCard, error: insertError } = await serviceClient
      .from("gift_cards")
      .insert({
        code,
        initial_balance: parsedAmount,
        current_balance: parsedAmount,
        purchased_by: user.id,
        recipient_email: recipientEmail.trim().toLowerCase(),
        recipient_name: recipientName.trim(),
        message: message?.trim() || null,
        scheduled_date: scheduledDate || null,
        is_active: true,
        expires_at: expiresAt.toISOString(),
      })
      .select("id, code")
      .single();

    if (insertError) {
      console.error("Gift card creation error:", insertError);
      return NextResponse.json(
        { error: "Failed to create gift card" },
        { status: 500 }
      );
    }

    // Record the purchase transaction
    await serviceClient.from("gift_card_transactions").insert({
      gift_card_id: giftCard.id,
      amount: parsedAmount,
      balance_after: parsedAmount,
      type: "purchase",
      notes: `Purchased by ${user.email} for ${recipientName.trim()}`,
    });

    // Trigger n8n webhook for gift card email delivery
    if (process.env.N8N_WEBHOOK_URL) {
      fetch(process.env.N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "gift_card.purchased",
          giftCardId: giftCard.id,
          code,
          amount: parsedAmount,
          recipientEmail: recipientEmail.trim().toLowerCase(),
          recipientName: recipientName.trim(),
          message: message?.trim() || "",
          scheduledDate: scheduledDate || null,
          purchasedBy: user.email,
        }),
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      giftCard: {
        code,
        amount: parsedAmount,
        recipientName: recipientName.trim(),
      },
    });
  } catch (error) {
    console.error("Gift card purchase error:", error);
    return NextResponse.json(
      safeError(error, "An unexpected error occurred"),
      { status: 500 }
    );
  }
}
