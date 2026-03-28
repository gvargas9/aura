import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
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
    const { code } = body;

    if (!code?.trim()) {
      return NextResponse.json(
        { valid: false, error: "Gift card code is required" },
        { status: 400 }
      );
    }

    const serviceClient = getServiceClient();

    const { data: giftCard, error: lookupError } = await serviceClient
      .from("gift_cards")
      .select("id, code, current_balance, is_active, expires_at")
      .eq("code", code.trim().toUpperCase())
      .single();

    if (lookupError || !giftCard) {
      return NextResponse.json({
        valid: false,
        error: "Gift card not found. Please check the code and try again.",
      });
    }

    if (!giftCard.is_active) {
      return NextResponse.json({
        valid: false,
        error: "This gift card has been deactivated.",
      });
    }

    if (giftCard.expires_at && new Date(giftCard.expires_at) < new Date()) {
      return NextResponse.json({
        valid: false,
        error: "This gift card has expired.",
      });
    }

    if (giftCard.current_balance <= 0) {
      return NextResponse.json({
        valid: false,
        error: "This gift card has a zero balance.",
      });
    }

    return NextResponse.json({
      valid: true,
      balance: giftCard.current_balance,
      expiresAt: giftCard.expires_at,
    });
  } catch (error) {
    console.error("Gift card balance check error:", error);
    return NextResponse.json(
      { valid: false, error: "Failed to check gift card balance" },
      { status: 500 }
    );
  }
}
