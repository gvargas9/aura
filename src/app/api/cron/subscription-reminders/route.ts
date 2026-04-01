import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { triggerSubscriptionReminder } from "@/lib/n8n/client";
import { logAutomationEvent } from "@/lib/n8n/events";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

function validateCronSecret(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn("[cron] CRON_SECRET not set -- skipping auth");
    return true;
  }
  const header =
    request.headers.get("authorization")?.replace("Bearer ", "") ??
    request.headers.get("x-cron-secret");
  return header === secret;
}

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[cron:subscription-reminders] Starting reminder check");

  // Find active subscriptions with next_delivery_date within the next 7 days
  const now = new Date();
  const sevenDaysFromNow = new Date(
    now.getTime() + 7 * 24 * 60 * 60 * 1000
  );

  const supabaseAdmin = getServiceClient();

  const { data: subscriptions, error } = await supabaseAdmin
    .from("aura_subscriptions")
    .select("*")
    .eq("status", "active")
    .gte("next_delivery_date", now.toISOString())
    .lte("next_delivery_date", sevenDaysFromNow.toISOString());

  if (error) {
    console.error(
      "[cron:subscription-reminders] Failed to query subscriptions:",
      error.message
    );
    return NextResponse.json(
      { error: "Failed to query subscriptions" },
      { status: 500 }
    );
  }

  if (!subscriptions || subscriptions.length === 0) {
    console.log("[cron:subscription-reminders] No upcoming deliveries found");
    return NextResponse.json({
      checked: true,
      remindersTriggered: 0,
    });
  }

  // Fetch user profiles for these subscriptions
  const userIds = [...new Set(subscriptions.map((s) => s.user_id))];
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, email, full_name")
    .in("id", userIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p])
  );

  let triggeredCount = 0;
  const results: Array<{
    subscriptionId: string;
    userId: string;
    triggered: boolean;
  }> = [];

  for (const sub of subscriptions) {
    const profile = profileMap.get(sub.user_id);

    if (!profile) {
      console.warn(
        `[cron:subscription-reminders] Profile not found for user ${sub.user_id}`
      );
      continue;
    }

    const triggered = await triggerSubscriptionReminder({
      subscriptionId: sub.id,
      userId: sub.user_id,
      userEmail: profile.email,
      userName: profile.full_name,
      boxSize: sub.box_size,
      nextDeliveryDate: sub.next_delivery_date!,
      price: sub.price,
    });

    if (triggered) {
      triggeredCount++;
    }

    // Log each reminder to the interaction log
    await logAutomationEvent({
      userId: sub.user_id,
      channel: "cron",
      event: "subscription.reminder_triggered",
      data: {
        subscriptionId: sub.id,
        boxSize: sub.box_size,
        nextDeliveryDate: sub.next_delivery_date,
        n8nTriggered: triggered,
      },
    });

    results.push({
      subscriptionId: sub.id,
      userId: sub.user_id,
      triggered,
    });
  }

  console.log(
    `[cron:subscription-reminders] Processed ${subscriptions.length} subscriptions, triggered ${triggeredCount} reminders`
  );

  return NextResponse.json({
    checked: true,
    subscriptionsFound: subscriptions.length,
    remindersTriggered: triggeredCount,
    results,
  });
}
