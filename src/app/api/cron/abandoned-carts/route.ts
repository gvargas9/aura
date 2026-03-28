import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { triggerN8nWebhook } from "@/lib/n8n/client";
import { logAutomationEvent } from "@/lib/n8n/events";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
//
// Cart data lives in localStorage, so the app cannot know which specific
// products a user has in their cart. Instead this endpoint identifies users
// who signed up or logged in recently but have never completed a checkout,
// making them candidates for an abandoned-cart nudge from n8n.
//
// n8n can also call this endpoint on its own schedule to pull the list of
// candidate users and orchestrate outreach (email, SMS) on its side.
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[cron:abandoned-carts] Starting abandoned cart check");

  // Find users who signed up in the last 30 days and have zero orders.
  // These are likely users who browsed, possibly added items to their
  // localStorage cart, but never completed checkout.
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: profiles, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, email, full_name, created_at")
    .gte("created_at", thirtyDaysAgo)
    .eq("role", "customer");

  if (profileError) {
    console.error(
      "[cron:abandoned-carts] Failed to query profiles:",
      profileError.message
    );
    return NextResponse.json(
      { error: "Failed to query profiles" },
      { status: 500 }
    );
  }

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({
      checked: true,
      candidateCount: 0,
      candidates: [],
    });
  }

  // Check which of these users have at least one order
  const userIds = profiles.map((p) => p.id);
  const { data: orders } = await supabaseAdmin
    .from("aura_orders")
    .select("user_id")
    .in("user_id", userIds);

  const usersWithOrders = new Set(
    (orders ?? []).map((o) => o.user_id)
  );

  // Also check subscriptions -- a user may have subscribed without a
  // standalone order record showing up in the same query window
  const { data: subs } = await supabaseAdmin
    .from("aura_subscriptions")
    .select("user_id")
    .in("user_id", userIds);

  const usersWithSubs = new Set(
    (subs ?? []).map((s) => s.user_id)
  );

  // Candidates: signed up recently, no orders, no subscriptions
  const candidates = profiles.filter(
    (p) => !usersWithOrders.has(p.id) && !usersWithSubs.has(p.id)
  );

  if (candidates.length === 0) {
    return NextResponse.json({
      checked: true,
      candidateCount: 0,
      candidates: [],
    });
  }

  // Trigger n8n abandoned-cart workflow with the candidate list
  const triggered = await triggerN8nWebhook("/abandoned-cart", {
    event: "cart.abandoned_candidates",
    data: {
      candidates: candidates.map((c) => ({
        userId: c.id,
        email: c.email,
        name: c.full_name,
        signedUpAt: c.created_at,
      })),
      count: candidates.length,
    },
    timestamp: new Date().toISOString(),
    source: "aura-cron",
  });

  await logAutomationEvent({
    channel: "cron",
    event: "abandoned_carts.checked",
    data: {
      candidateCount: candidates.length,
      n8nTriggered: triggered,
    },
  });

  console.log(
    `[cron:abandoned-carts] Found ${candidates.length} candidates, n8n triggered: ${triggered}`
  );

  return NextResponse.json({
    checked: true,
    candidateCount: candidates.length,
    n8nTriggered: triggered,
    candidates: candidates.map((c) => ({
      userId: c.id,
      email: c.email,
      name: c.full_name,
      signedUpAt: c.created_at,
    })),
  });
}
