import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe, getOrCreateCustomer } from "@/lib/stripe/server";
import { BOX_CONFIGS } from "@/types";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// Stripe Price IDs for subscriptions
const SUBSCRIPTION_PRICE_IDS: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER || "price_starter",
  voyager: process.env.STRIPE_PRICE_VOYAGER || "price_voyager",
  bunker: process.env.STRIPE_PRICE_BUNKER || "price_bunker",
};

// One-time price IDs (configured in Stripe Dashboard)
const ONE_TIME_PRICE_IDS: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER_ONETIME || "price_starter_onetime",
  voyager: process.env.STRIPE_PRICE_VOYAGER_ONETIME || "price_voyager_onetime",
  bunker: process.env.STRIPE_PRICE_BUNKER_ONETIME || "price_bunker_onetime",
};

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `AURA-${timestamp}-${random}`;
}

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
    const {
      boxSize,
      productIds,
      purchaseType = "subscription",
      dealerCode,
      shippingAddress,
      // Promo
      promoCode,
      promotionId,
      promoDiscount = 0,
      // Gift card
      giftCardCode,
      giftCardAmount = 0,
      // Credits
      creditsToApply = 0,
      // Gift
      recipientName,
      recipientEmail,
      giftMessage,
      // B2B Invoice
      paymentMethod,
      poNumber,
      organizationId,
    } = body;

    // Validate box size
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

    // Validate purchase type
    const validPurchaseTypes = ["subscription", "one_time", "gift"];
    if (!validPurchaseTypes.includes(purchaseType)) {
      return NextResponse.json(
        { error: "Invalid purchase type" },
        { status: 400 }
      );
    }

    // Gift validation
    if (purchaseType === "gift") {
      if (!recipientName?.trim() || !recipientEmail?.trim()) {
        return NextResponse.json(
          { error: "Recipient name and email are required for gift orders" },
          { status: 400 }
        );
      }
    }

    const serviceClient = getServiceClient();

    // Determine base price
    const basePrice =
      purchaseType === "subscription" ? config.price : config.oneTimePrice;

    // ---- Server-side discount validation ---- //

    let validatedPromoDiscount = 0;
    let validatedPromotionId: string | null = null;

    if (promoCode && promotionId) {
      const { data: promo } = await serviceClient
        .from("promotions")
        .select("*")
        .eq("id", promotionId)
        .eq("coupon_code", promoCode)
        .eq("is_active", true)
        .single();

      if (promo) {
        const now = new Date().toISOString();
        const notStarted = promo.starts_at && promo.starts_at > now;
        const expired = promo.ends_at && promo.ends_at < now;
        const usageFull =
          promo.usage_limit && promo.usage_count >= promo.usage_limit;
        const subOnly =
          promo.subscription_only && purchaseType !== "subscription";
        const belowMin =
          promo.min_order_amount && basePrice < promo.min_order_amount;

        if (!notStarted && !expired && !usageFull && !subOnly && !belowMin) {
          if (promo.discount_type === "percentage") {
            validatedPromoDiscount =
              basePrice * (promo.discount_value / 100);
            if (promo.max_discount_amount) {
              validatedPromoDiscount = Math.min(
                validatedPromoDiscount,
                promo.max_discount_amount
              );
            }
          } else if (promo.discount_type === "fixed_amount") {
            validatedPromoDiscount = promo.discount_value;
          }
          validatedPromoDiscount = Math.min(validatedPromoDiscount, basePrice);
          validatedPromotionId = promo.id;
        }
      }
    }

    // Validate gift card server-side
    let validatedGiftCardAmount = 0;
    let giftCardId: string | null = null;

    if (giftCardCode && giftCardAmount > 0) {
      const { data: giftCard } = await serviceClient
        .from("gift_cards")
        .select("*")
        .eq("code", giftCardCode)
        .eq("is_active", true)
        .single();

      if (giftCard) {
        const isExpired =
          giftCard.expires_at && new Date(giftCard.expires_at) < new Date();
        if (!isExpired && giftCard.current_balance > 0) {
          const remaining = basePrice - validatedPromoDiscount;
          validatedGiftCardAmount = Math.min(
            giftCardAmount,
            giftCard.current_balance,
            Math.max(0, remaining)
          );
          giftCardId = giftCard.id;
        }
      }
    }

    // Validate credits server-side
    let validatedCredits = 0;

    if (creditsToApply > 0) {
      const { data: profile } = await serviceClient
        .from("profiles")
        .select("credits")
        .eq("id", user.id)
        .single();

      if (profile && profile.credits > 0) {
        const remaining =
          basePrice - validatedPromoDiscount - validatedGiftCardAmount;
        validatedCredits = Math.min(
          creditsToApply,
          profile.credits,
          Math.max(0, remaining)
        );
      }
    }

    // Calculate final amount to charge via Stripe
    const totalDiscount =
      validatedPromoDiscount + validatedGiftCardAmount + validatedCredits;
    const shipping = purchaseType === "subscription" ? 0 : 9.99;
    const taxableAmount = Math.max(0, basePrice - totalDiscount);
    const taxRate = 0.0825;
    const tax = taxableAmount * taxRate;
    const chargeAmount = taxableAmount + shipping + tax;

    // Check for dealer attribution
    let dealerId: string | null = null;
    if (dealerCode) {
      const { data: dealer } = await serviceClient
        .from("dealers")
        .select("id")
        .eq("referral_code", dealerCode)
        .eq("is_active", true)
        .single();

      if (dealer) {
        dealerId = (dealer as { id: string }).id;
      }
    }

    // Order metadata used across all paths
    const orderMetadata = {
      userId: user.id,
      boxSize,
      productIds: JSON.stringify(productIds),
      purchaseType,
      dealerId: dealerId || "",
      promoCode: promoCode || "",
      promotionId: validatedPromotionId || "",
      promoDiscount: validatedPromoDiscount.toFixed(2),
      giftCardCode: giftCardCode || "",
      giftCardId: giftCardId || "",
      giftCardAmount: validatedGiftCardAmount.toFixed(2),
      creditsApplied: validatedCredits.toFixed(2),
      ...(purchaseType === "gift"
        ? { recipientName, recipientEmail, giftMessage: giftMessage || "" }
        : {}),
      ...(poNumber ? { poNumber } : {}),
    };

    // ---- B2B Invoice path (no Stripe) ---- //

    if (paymentMethod === "invoice" && organizationId) {
      // Validate dealer + org
      const { data: profile } = await serviceClient
        .from("profiles")
        .select("role, organization_id")
        .eq("id", user.id)
        .single();

      if (!profile || profile.role !== "dealer" || profile.organization_id !== organizationId) {
        return NextResponse.json(
          { error: "Invoice payment is only available for verified dealer accounts" },
          { status: 403 }
        );
      }

      if (!poNumber?.trim()) {
        return NextResponse.json(
          { error: "PO number is required for invoice orders" },
          { status: 400 }
        );
      }

      // Fetch product details for order items
      const { data: orderProducts } = await serviceClient
        .from("aura_products")
        .select("id, sku, name, price, image_url")
        .in("id", productIds);

      const items = (orderProducts || []).map((p) => ({
        productId: p.id,
        sku: p.sku,
        name: p.name,
        quantity: 1,
        price: p.price,
        image: p.image_url,
      }));

      const orderNumber = generateOrderNumber();

      const { data: order, error: orderError } = await serviceClient
        .from("aura_orders")
        .insert({
          order_number: orderNumber,
          user_id: user.id,
          organization_id: organizationId,
          dealer_attribution_id: dealerId,
          status: "pending",
          purchase_type: "bulk_order",
          subtotal: basePrice,
          discount: totalDiscount,
          shipping,
          tax,
          total: chargeAmount,
          items: items as unknown as Record<string, unknown>[],
          shipping_address: shippingAddress as unknown as Record<string, unknown>,
          notes: poNumber ? `PO: ${poNumber}` : null,
          metadata: orderMetadata as unknown as Record<string, unknown>,
        })
        .select("id")
        .single();

      if (orderError) {
        console.error("B2B order creation error:", orderError);
        return NextResponse.json(
          { error: "Failed to create order" },
          { status: 500 }
        );
      }

      // Apply gift card deduction if used
      if (giftCardId && validatedGiftCardAmount > 0) {
        await applyGiftCardDeduction(
          serviceClient,
          giftCardId,
          validatedGiftCardAmount,
          order.id
        );
      }

      // Apply credits deduction if used
      if (validatedCredits > 0) {
        await applyCreditsDeduction(serviceClient, user.id, validatedCredits, order.id);
      }

      // Increment promo usage
      if (validatedPromotionId) {
        await incrementPromoUsage(serviceClient, validatedPromotionId, user.id);
      }

      // Trigger n8n webhook for order processing
      if (process.env.N8N_WEBHOOK_URL) {
        fetch(process.env.N8N_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "order.created",
            orderId: order.id,
            orderNumber,
            type: "b2b_invoice",
          }),
        }).catch(() => {});
      }

      return NextResponse.json({
        invoiceCreated: true,
        orderId: order.id,
        orderNumber,
      });
    }

    // ---- Zero-dollar order path (fully covered by credits/gift card) ---- //

    if (chargeAmount <= 0.5) {
      // Stripe minimum is $0.50, so handle zero/near-zero orders directly
      const { data: orderProducts } = await serviceClient
        .from("aura_products")
        .select("id, sku, name, price, image_url")
        .in("id", productIds);

      const items = (orderProducts || []).map((p) => ({
        productId: p.id,
        sku: p.sku,
        name: p.name,
        quantity: 1,
        price: p.price,
        image: p.image_url,
      }));

      const orderNumber = generateOrderNumber();

      const { data: order, error: orderError } = await serviceClient
        .from("aura_orders")
        .insert({
          order_number: orderNumber,
          user_id: user.id,
          dealer_attribution_id: dealerId,
          status: "processing",
          purchase_type: purchaseType === "gift" ? "gift" : purchaseType === "subscription" ? "subscription" : "one_time",
          subtotal: basePrice,
          discount: totalDiscount,
          shipping,
          tax,
          total: chargeAmount,
          items: items as unknown as Record<string, unknown>[],
          shipping_address: shippingAddress as unknown as Record<string, unknown>,
          metadata: orderMetadata as unknown as Record<string, unknown>,
        })
        .select("id")
        .single();

      if (orderError) {
        console.error("Zero-dollar order creation error:", orderError);
        return NextResponse.json(
          { error: "Failed to create order" },
          { status: 500 }
        );
      }

      // Apply gift card deduction
      if (giftCardId && validatedGiftCardAmount > 0) {
        await applyGiftCardDeduction(
          serviceClient,
          giftCardId,
          validatedGiftCardAmount,
          order.id
        );
      }

      // Apply credits deduction
      if (validatedCredits > 0) {
        await applyCreditsDeduction(serviceClient, user.id, validatedCredits, order.id);
      }

      // Increment promo usage
      if (validatedPromotionId) {
        await incrementPromoUsage(serviceClient, validatedPromotionId, user.id);
      }

      // Create gift order record if applicable
      if (purchaseType === "gift") {
        await serviceClient.from("gift_orders").insert({
          order_id: order.id,
          sender_id: user.id,
          recipient_name: recipientName,
          recipient_email: recipientEmail,
          gift_message: giftMessage || null,
          gift_type: "box",
        });
      }

      // Trigger n8n
      if (process.env.N8N_WEBHOOK_URL) {
        fetch(process.env.N8N_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "order.created",
            orderId: order.id,
            orderNumber,
            type: "zero_dollar",
            purchaseType,
          }),
        }).catch(() => {});
      }

      return NextResponse.json({
        zeroDollar: true,
        orderId: order.id,
        orderNumber,
      });
    }

    // ---- Stripe Checkout path ---- //

    const customer = await getOrCreateCustomer({
      email: user.email!,
      name: user.user_metadata.full_name,
      userId: user.id,
    });

    // Build Stripe session config
    const isSubscription = purchaseType === "subscription";
    const mode = isSubscription ? "subscription" : "payment";
    const priceId = isSubscription
      ? SUBSCRIPTION_PRICE_IDS[boxSize]
      : ONE_TIME_PRICE_IDS[boxSize];

    // For discounts applied outside Stripe, adjust using a coupon
    const nonStripeDiscount =
      validatedGiftCardAmount + validatedCredits;

    let couponId: string | undefined;

    // Create a Stripe coupon for the combined promo + gift card + credits discount
    const totalStripeDiscount = validatedPromoDiscount + nonStripeDiscount;
    if (totalStripeDiscount > 0) {
      const coupon = await stripe.coupons.create({
        amount_off: Math.round(totalStripeDiscount * 100),
        currency: "usd",
        duration: "once",
        name: [
          validatedPromoDiscount > 0 ? `Promo: -$${validatedPromoDiscount.toFixed(2)}` : "",
          validatedGiftCardAmount > 0 ? `Gift Card: -$${validatedGiftCardAmount.toFixed(2)}` : "",
          validatedCredits > 0 ? `Credits: -$${validatedCredits.toFixed(2)}` : "",
        ]
          .filter(Boolean)
          .join(", "),
      });
      couponId = coupon.id;
    }

    const sessionConfig: Record<string, unknown> = {
      customer: customer.id,
      mode,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: orderMetadata,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&type=${purchaseType}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/build-box?cancelled=true`,
    };

    // Apply coupon discount
    if (couponId) {
      sessionConfig.discounts = [{ coupon: couponId }];
    }

    // Subscription-specific metadata
    if (isSubscription) {
      sessionConfig.subscription_data = {
        metadata: {
          userId: user.id,
          boxSize,
          purchaseType: "subscription",
        },
      };
    }

    // Shipping for one-time / gift
    if (!isSubscription && shipping > 0) {
      sessionConfig.shipping_options = [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: Math.round(shipping * 100), currency: "usd" },
            display_name: "Standard Shipping",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 2 },
              maximum: { unit: "business_day", value: 5 },
            },
          },
        },
      ];
    }

    const session = await stripe.checkout.sessions.create(
      sessionConfig as Parameters<typeof stripe.checkout.sessions.create>[0]
    );

    // Pre-apply gift card and credits deductions (will be finalized on webhook)
    // We store pending deductions in session metadata so the webhook can process them
    // The actual deductions happen in the webhook after payment confirmation

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

// ---- Helper functions ---- //

async function applyGiftCardDeduction(
  serviceClient: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  giftCardId: string,
  amount: number,
  orderId: string
) {
  // Get current balance
  const { data: card } = await serviceClient
    .from("gift_cards")
    .select("current_balance")
    .eq("id", giftCardId)
    .single();

  if (!card) return;

  const newBalance = Math.max(0, card.current_balance - amount);

  // Update balance
  await serviceClient
    .from("gift_cards")
    .update({ current_balance: newBalance })
    .eq("id", giftCardId);

  // Record transaction
  await serviceClient.from("gift_card_transactions").insert({
    gift_card_id: giftCardId,
    order_id: orderId,
    amount: -amount,
    balance_after: newBalance,
    type: "redemption",
    notes: `Applied to order ${orderId}`,
  });
}

async function applyCreditsDeduction(
  serviceClient: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  userId: string,
  amount: number,
  orderId: string
) {
  // Get current credits
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single();

  if (!profile) return;

  const newCredits = Math.max(0, profile.credits - amount);

  // Update profile credits
  await serviceClient
    .from("profiles")
    .update({ credits: newCredits })
    .eq("id", userId);

  // Record in credit ledger
  await serviceClient.from("credit_ledger").insert({
    user_id: userId,
    amount: -amount,
    type: "redeemed",
    reference_id: orderId,
    reference_type: "order",
    description: `Redeemed for order ${orderId}`,
  });
}

async function incrementPromoUsage(
  serviceClient: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  promotionId: string,
  userId: string
) {
  // Increment usage count
  const { data: promo } = await serviceClient
    .from("promotions")
    .select("usage_count")
    .eq("id", promotionId)
    .single();

  if (promo) {
    await serviceClient
      .from("promotions")
      .update({ usage_count: promo.usage_count + 1 })
      .eq("id", promotionId);
  }

  // Record redemption
  await serviceClient.from("promotion_redemptions").insert({
    promotion_id: promotionId,
    user_id: userId,
  });
}
