import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe, getOrCreateCustomer } from "@/lib/stripe/server";
import { BOX_CONFIGS } from "@/types";

// Stripe Price IDs for each box size (would be set up in Stripe Dashboard)
const PRICE_IDS: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER || "price_starter",
  voyager: process.env.STRIPE_PRICE_VOYAGER || "price_voyager",
  bunker: process.env.STRIPE_PRICE_BUNKER || "price_bunker",
};

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
    const { boxSize, productIds, dealerCode } = body;

    if (!boxSize || !BOX_CONFIGS[boxSize]) {
      return NextResponse.json(
        { error: "Invalid box size" },
        { status: 400 }
      );
    }

    const config = BOX_CONFIGS[boxSize];

    if (!productIds || productIds.length !== config.slots) {
      return NextResponse.json(
        { error: `Box must contain exactly ${config.slots} items` },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const customer = await getOrCreateCustomer({
      email: user.email!,
      name: user.user_metadata.full_name,
      userId: user.id,
    });

    // Check for dealer attribution
    let dealerId: string | null = null;
    if (dealerCode) {
      const { data: dealer } = await supabase
        .from("dealers")
        .select("id")
        .eq("referral_code", dealerCode)
        .eq("is_active", true)
        .single();

      if (dealer) {
        dealerId = (dealer as { id: string }).id;
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: PRICE_IDS[boxSize],
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id,
        boxSize,
        productIds: JSON.stringify(productIds),
        dealerId: dealerId || "",
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          boxSize,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/build-box?cancelled=true`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
