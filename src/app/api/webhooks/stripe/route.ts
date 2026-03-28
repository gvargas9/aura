import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe/server";
import { createClient } from "@supabase/supabase-js";
import {
  triggerOrderFulfillment,
  triggerPaymentFailed,
  triggerCustomerEvent,
} from "@/lib/n8n/client";

// Use service role for webhooks (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancelled(subscription);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { userId, boxSize, productIds, dealerId } = session.metadata || {};

  if (!userId || !boxSize || !productIds) {
    console.error("Missing required metadata in checkout session");
    return;
  }

  const parsedProductIds = JSON.parse(productIds);

  // Create subscription record
  const { data: subscription, error: subError } = await supabaseAdmin
    .from("aura_subscriptions")
    .insert({
      user_id: userId,
      stripe_subscription_id: session.subscription as string,
      box_size: boxSize,
      box_config: parsedProductIds,
      status: "active",
      price: session.amount_total ? session.amount_total / 100 : 0,
      next_delivery_date: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString(), // 7 days from now
      delivery_frequency_days: 30,
      shipping_address: {},
    })
    .select()
    .single();

  if (subError) {
    console.error("Failed to create subscription:", subError);
    return;
  }

  // Generate order number
  const orderNumber = `AUR-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  // Create first order
  const { error: orderError } = await supabaseAdmin
    .from("aura_orders")
    .insert({
      order_number: orderNumber,
      user_id: userId,
      subscription_id: subscription.id,
      dealer_attribution_id: dealerId || null,
      stripe_payment_intent_id: session.payment_intent as string,
      status: "processing",
      subtotal: session.amount_total ? session.amount_total / 100 : 0,
      total: session.amount_total ? session.amount_total / 100 : 0,
      items: parsedProductIds.map((id: string) => ({
        productId: id,
        quantity: 1,
      })),
      shipping_address: {},
    });

  if (orderError) {
    console.error("Failed to create order:", orderError);
  }

  // Record dealer commission if applicable
  if (dealerId) {
    const commissionRate = 0.1; // 10% default
    const commissionAmount =
      (session.amount_total ? session.amount_total / 100 : 0) * commissionRate;

    await supabaseAdmin.from("commission_transactions").insert({
      dealer_id: dealerId,
      order_id: subscription.id,
      amount: commissionAmount,
      type: "earned",
      status: "pending",
    });

    // Update dealer earnings
    await supabaseAdmin.rpc("increment_dealer_commission", {
      dealer_id: dealerId,
      amount: commissionAmount,
    });
  }

  // Trigger n8n order fulfillment workflow (fire-and-forget, never throws)
  await triggerOrderFulfillment({
    orderId: subscription.id,
    orderNumber,
    userId,
    subscriptionId: subscription.id,
    items: parsedProductIds.map((id: string) => ({ productId: id, quantity: 1 })),
    shippingAddress: {},
    total: session.amount_total ? session.amount_total / 100 : 0,
    dealerAttributionId: dealerId || null,
  });

  console.log(`Subscription created for user ${userId}`);
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const { userId, boxSize } = subscription.metadata || {};

  if (!userId) {
    console.error("Missing userId in subscription metadata");
    return;
  }

  await supabaseAdmin
    .from("aura_subscriptions")
    .update({
      status: subscription.status === "active" ? "active" : "paused",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  const { userId } = subscription.metadata || {};

  await supabaseAdmin
    .from("aura_subscriptions")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  // Trigger n8n churn event notification
  if (userId) {
    await triggerCustomerEvent({
      type: "subscription.cancelled",
      userId,
      data: {
        stripeSubscriptionId: subscription.id,
        cancelledAt: new Date().toISOString(),
        cancellationReason:
          subscription.cancellation_details?.reason ?? "unknown",
      },
    });
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // For recurring payments, create new order
  if (invoice.billing_reason === "subscription_cycle") {
    const subscriptionId = typeof invoice.parent?.subscription_details?.subscription === "string"
      ? invoice.parent.subscription_details.subscription
      : (invoice as unknown as { subscription: string | null }).subscription;

    if (!subscriptionId) return;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    const { userId, boxSize } = subscription.metadata || {};
    if (!userId) return;

    // Get subscription from DB
    const { data: sub } = await supabaseAdmin
      .from("aura_subscriptions")
      .select("*")
      .eq("stripe_subscription_id", subscription.id)
      .single();

    if (!sub) return;

    const orderNumber = `AUR-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Create recurring order
    const paymentIntentId = (invoice as unknown as { payment_intent: string | null }).payment_intent;
    await supabaseAdmin.from("aura_orders").insert({
      order_number: orderNumber,
      user_id: userId,
      subscription_id: sub.id,
      stripe_payment_intent_id: paymentIntentId,
      status: "processing",
      subtotal: (invoice.amount_paid ?? 0) / 100,
      total: (invoice.amount_paid ?? 0) / 100,
      items: sub.box_config.map((id: string) => ({
        productId: id,
        quantity: 1,
      })),
      shipping_address: sub.shipping_address,
    });

    // Update next delivery date
    await supabaseAdmin
      .from("aura_subscriptions")
      .update({
        next_delivery_date: new Date(
          Date.now() + sub.delivery_frequency_days * 24 * 60 * 60 * 1000
        ).toISOString(),
      })
      .eq("id", sub.id);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.error(`Payment failed for invoice ${invoice.id}`);

  // Resolve the subscription ID from the invoice
  const subscriptionId =
    typeof invoice.parent?.subscription_details?.subscription === "string"
      ? invoice.parent.subscription_details.subscription
      : (invoice as unknown as { subscription: string | null }).subscription;

  // Look up user from subscription metadata if possible
  let userId: string | undefined;
  if (subscriptionId) {
    try {
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      userId = sub.metadata?.userId;
    } catch {
      // Subscription may have been deleted -- proceed without userId
    }
  }

  // Trigger n8n payment-failed notification (fire-and-forget)
  await triggerPaymentFailed({
    userId: userId ?? "unknown",
    invoiceId: invoice.id,
    subscriptionId: subscriptionId ?? null,
    amountDue: (invoice.amount_due ?? 0) / 100,
  });
}
