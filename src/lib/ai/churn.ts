import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import { triggerCustomerEvent } from "@/lib/n8n/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ServiceClient = ReturnType<typeof createClient<Database>>;

export interface ChurnFactors {
  daysSinceLastOrder: number;
  orderFrequencyDecline: number;
  subscriptionPauseCount: number;
  supportTicketCount: number;
  missedSelectionDeadlines: number;
  averageOrderValue: number;
  orderValueTrend: number;
  engagementScore: number;
  subscriptionAge: number;
}

export interface ChurnResult {
  score: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  factors: ChurnFactors;
  recommendations: string[];
}

export interface BatchChurnResult {
  processed: number;
  highRisk: number;
  criticalRisk: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getServiceClient(): ServiceClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }
  return createClient<Database>(url, key);
}

function classifyRisk(score: number): "low" | "medium" | "high" | "critical" {
  if (score <= 0.25) return "low";
  if (score <= 0.5) return "medium";
  if (score <= 0.75) return "high";
  return "critical";
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor(Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

// ---------------------------------------------------------------------------
// Core scoring logic
// ---------------------------------------------------------------------------

function computeScore(factors: ChurnFactors): number {
  let score = 0;

  // Days since last order
  if (factors.daysSinceLastOrder > 90) {
    score += 0.5;
  } else if (factors.daysSinceLastOrder > 60) {
    score += 0.3;
  } else if (factors.daysSinceLastOrder > 30) {
    score += 0.15;
  }

  // Order frequency decline > 50%
  if (factors.orderFrequencyDecline > 50) {
    score += 0.2;
  }

  // Subscription paused
  if (factors.subscriptionPauseCount > 0) {
    score += 0.15;
  }

  // Support tickets in last 30 days > 2
  if (factors.supportTicketCount > 2) {
    score += 0.1;
  }

  // Order value declining
  if (factors.orderValueTrend < 0) {
    score += 0.1;
  }

  // Missed box customization for last delivery
  if (factors.missedSelectionDeadlines > 0) {
    score += 0.1;
  }

  return Math.min(score, 1.0);
}

// ---------------------------------------------------------------------------
// Factor gathering (batch-friendly)
// ---------------------------------------------------------------------------

interface UserOrderData {
  userId: string;
  orders: Array<{
    created_at: string;
    total: number;
    items: Json;
  }>;
}

interface UserSubscriptionData {
  userId: string;
  subscriptions: Array<{
    status: string;
    created_at: string;
    pause_until: string | null;
    cancelled_at: string | null;
    next_delivery_date: string | null;
    auto_fill_enabled: boolean;
    box_config: string[];
  }>;
}

async function gatherFactorsForUsers(
  supabase: ServiceClient,
  userIds: string[]
): Promise<Map<string, ChurnFactors>> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  // Batch fetch all orders for these users (last 180 days)
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  const { data: allOrders } = await supabase
    .from("aura_orders")
    .select("user_id, created_at, total, items")
    .in("user_id", userIds)
    .gte("created_at", sixMonthsAgo.toISOString())
    .in("status", ["processing", "shipped", "delivered"])
    .order("created_at", { ascending: true });

  // Batch fetch all subscriptions
  const { data: allSubscriptions } = await supabase
    .from("aura_subscriptions")
    .select("user_id, status, created_at, pause_until, cancelled_at, next_delivery_date, auto_fill_enabled, box_config")
    .in("user_id", userIds);

  // Batch fetch support tickets in last 30 days
  const { data: allTickets } = await supabase
    .from("tickets")
    .select("user_id")
    .in("user_id", userIds)
    .gte("created_at", thirtyDaysAgo.toISOString());

  // Batch fetch interactions for engagement (last 30 days)
  const { data: allInteractions } = await supabase
    .from("omni_interaction_log")
    .select("user_id, channel")
    .in("user_id", userIds)
    .gte("created_at", thirtyDaysAgo.toISOString())
    .eq("direction", "inbound");

  // Group data by user
  const ordersByUser = new Map<string, UserOrderData["orders"]>();
  const subsByUser = new Map<string, UserSubscriptionData["subscriptions"]>();
  const ticketCountByUser = new Map<string, number>();
  const interactionCountByUser = new Map<string, number>();

  for (const order of allOrders ?? []) {
    const list = ordersByUser.get(order.user_id) ?? [];
    list.push(order);
    ordersByUser.set(order.user_id, list);
  }

  for (const sub of allSubscriptions ?? []) {
    const list = subsByUser.get(sub.user_id) ?? [];
    list.push(sub);
    subsByUser.set(sub.user_id, list);
  }

  for (const ticket of allTickets ?? []) {
    if (ticket.user_id) {
      ticketCountByUser.set(ticket.user_id, (ticketCountByUser.get(ticket.user_id) ?? 0) + 1);
    }
  }

  for (const interaction of allInteractions ?? []) {
    if (interaction.user_id) {
      interactionCountByUser.set(
        interaction.user_id,
        (interactionCountByUser.get(interaction.user_id) ?? 0) + 1
      );
    }
  }

  // Compute factors per user
  const result = new Map<string, ChurnFactors>();

  for (const userId of userIds) {
    const orders = ordersByUser.get(userId) ?? [];
    const subs = subsByUser.get(userId) ?? [];
    const ticketCount = ticketCountByUser.get(userId) ?? 0;
    const interactionCount = interactionCountByUser.get(userId) ?? 0;

    // Days since last order
    let daysSinceLastOrder = 0;
    if (orders.length > 0) {
      const lastOrder = orders[orders.length - 1];
      daysSinceLastOrder = daysBetween(new Date(lastOrder.created_at), now);
    }

    // Order frequency decline: compare last 30 days count vs previous 30 days count
    const recentOrders = orders.filter(
      (o) => new Date(o.created_at) >= thirtyDaysAgo
    );
    const previousOrders = orders.filter(
      (o) => new Date(o.created_at) >= sixtyDaysAgo && new Date(o.created_at) < thirtyDaysAgo
    );
    let orderFrequencyDecline = 0;
    if (previousOrders.length > 0) {
      const decline = ((previousOrders.length - recentOrders.length) / previousOrders.length) * 100;
      orderFrequencyDecline = Math.max(0, decline);
    }

    // Subscription pause count
    const subscriptionPauseCount = subs.filter(
      (s) => s.status === "paused" || s.pause_until !== null
    ).length;

    // Missed selection deadlines: subscriptions with auto_fill and empty/unchanged box_config
    // near delivery date
    let missedSelectionDeadlines = 0;
    for (const sub of subs) {
      if (
        sub.status === "active" &&
        sub.auto_fill_enabled &&
        sub.box_config.length === 0 &&
        sub.next_delivery_date
      ) {
        const deliveryDate = new Date(sub.next_delivery_date);
        const daysToDelivery = daysBetween(now, deliveryDate);
        if (daysToDelivery < 3) {
          missedSelectionDeadlines++;
        }
      }
    }

    // Average order value and trend
    let averageOrderValue = 0;
    let orderValueTrend = 0;
    if (orders.length > 0) {
      averageOrderValue = orders.reduce((sum, o) => sum + o.total, 0) / orders.length;

      // Trend: compare recent 30 days avg vs previous 30 days avg
      if (recentOrders.length > 0 && previousOrders.length > 0) {
        const recentAvg = recentOrders.reduce((s, o) => s + o.total, 0) / recentOrders.length;
        const prevAvg = previousOrders.reduce((s, o) => s + o.total, 0) / previousOrders.length;
        orderValueTrend = prevAvg > 0 ? ((recentAvg - prevAvg) / prevAvg) * 100 : 0;
      }
    }

    // Engagement score: interactions per day in last 30 days, normalized 0-1
    const engagementScore = Math.min(interactionCount / 30, 1);

    // Subscription age (days since first subscription)
    let subscriptionAge = 0;
    if (subs.length > 0) {
      const earliest = subs.reduce((min, s) => {
        const d = new Date(s.created_at);
        return d < min ? d : min;
      }, new Date());
      subscriptionAge = daysBetween(earliest, now);
    }

    result.set(userId, {
      daysSinceLastOrder,
      orderFrequencyDecline,
      subscriptionPauseCount,
      supportTicketCount: ticketCount,
      missedSelectionDeadlines,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      orderValueTrend: Math.round(orderValueTrend * 100) / 100,
      engagementScore: Math.round(engagementScore * 100) / 100,
      subscriptionAge,
    });
  }

  return result;
}

// ---------------------------------------------------------------------------
// AI-generated retention recommendations
// ---------------------------------------------------------------------------

async function generateRecommendations(
  factors: ChurnFactors,
  riskLevel: string
): Promise<string[]> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    return getDefaultRecommendations(factors, riskLevel);
  }

  const prompt = `You are a customer retention strategist for a premium shelf-stable food subscription service called Aura.

Given these churn risk factors for a subscriber:
- Risk Level: ${riskLevel}
- Days since last order: ${factors.daysSinceLastOrder}
- Order frequency decline: ${factors.orderFrequencyDecline}%
- Subscription has been paused: ${factors.subscriptionPauseCount > 0 ? "Yes" : "No"}
- Support tickets in last 30 days: ${factors.supportTicketCount}
- Missed box customization deadlines: ${factors.missedSelectionDeadlines}
- Average order value: $${factors.averageOrderValue}
- Order value trend: ${factors.orderValueTrend > 0 ? "increasing" : factors.orderValueTrend < 0 ? "decreasing" : "stable"}
- Engagement score (0-1): ${factors.engagementScore}
- Subscription age (days): ${factors.subscriptionAge}

Provide exactly 3 specific, actionable retention recommendations. Each should be 1 sentence. Return them as a JSON array of strings. Example: ["Send a personalized 15% discount code via email", "Reach out with a phone call to understand their needs", "Offer a free box upgrade for next delivery"]

Return ONLY the JSON array, no other text.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 300,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error("[churn] Gemini API error:", response.status);
      return getDefaultRecommendations(factors, riskLevel);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Extract JSON array from response
    const match = text.match(/\[[\s\S]*?\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, 3).map(String);
      }
    }

    return getDefaultRecommendations(factors, riskLevel);
  } catch (error) {
    console.error("[churn] Failed to generate AI recommendations:", error);
    return getDefaultRecommendations(factors, riskLevel);
  }
}

function getDefaultRecommendations(factors: ChurnFactors, riskLevel: string): string[] {
  const recs: string[] = [];

  if (riskLevel === "critical") {
    recs.push("Immediately reach out with a personal phone call and offer a significant loyalty discount.");
  }

  if (factors.daysSinceLastOrder > 60) {
    recs.push("Send a win-back email with a complimentary box upgrade for their next delivery.");
  }

  if (factors.orderFrequencyDecline > 50) {
    recs.push("Offer a flexible delivery schedule to match their actual consumption rate.");
  }

  if (factors.subscriptionPauseCount > 0) {
    recs.push("Send a re-engagement survey to understand why they paused and address concerns.");
  }

  if (factors.supportTicketCount > 2) {
    recs.push("Escalate to a senior support agent for a comprehensive resolution of their issues.");
  }

  if (factors.orderValueTrend < 0) {
    recs.push("Suggest new products matching their taste profile to reignite interest.");
  }

  if (factors.engagementScore < 0.2) {
    recs.push("Send a personalized product recommendation email based on their order history.");
  }

  // Always return at least 3
  const defaults = [
    "Send a personalized thank-you note with a 10% loyalty discount code.",
    "Offer early access to new seasonal products before general availability.",
    "Invite them to provide feedback through a brief satisfaction survey.",
  ];

  while (recs.length < 3) {
    const def = defaults[recs.length];
    if (def && !recs.includes(def)) {
      recs.push(def);
    } else {
      break;
    }
  }

  return recs.slice(0, 3);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function calculateChurnScore(userId: string): Promise<ChurnResult> {
  const supabase = getServiceClient();
  const factorsMap = await gatherFactorsForUsers(supabase, [userId]);
  const factors = factorsMap.get(userId);

  if (!factors) {
    // New user with no data -- zero risk
    const emptyFactors: ChurnFactors = {
      daysSinceLastOrder: 0,
      orderFrequencyDecline: 0,
      subscriptionPauseCount: 0,
      supportTicketCount: 0,
      missedSelectionDeadlines: 0,
      averageOrderValue: 0,
      orderValueTrend: 0,
      engagementScore: 0,
      subscriptionAge: 0,
    };
    return {
      score: 0,
      riskLevel: "low",
      factors: emptyFactors,
      recommendations: [],
    };
  }

  const score = computeScore(factors);
  const riskLevel = classifyRisk(score);
  const recommendations = await generateRecommendations(factors, riskLevel);

  return { score, riskLevel, factors, recommendations };
}

export async function batchCalculateChurnScores(): Promise<BatchChurnResult> {
  const supabase = getServiceClient();

  // Fetch all users with active or paused subscriptions
  const { data: subscriptions } = await supabase
    .from("aura_subscriptions")
    .select("user_id")
    .in("status", ["active", "paused"]);

  if (!subscriptions || subscriptions.length === 0) {
    return { processed: 0, highRisk: 0, criticalRisk: 0 };
  }

  // Deduplicate user IDs
  const userIds = [...new Set(subscriptions.map((s) => s.user_id))];

  // Process in batches of 50 to avoid memory issues
  const BATCH_SIZE = 50;
  let highRisk = 0;
  let criticalRisk = 0;
  let processed = 0;

  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    const batch = userIds.slice(i, i + BATCH_SIZE);
    const factorsMap = await gatherFactorsForUsers(supabase, batch);

    // Prepare updates
    const updates: Array<{ userId: string; score: number; riskLevel: string }> = [];

    for (const userId of batch) {
      const factors = factorsMap.get(userId);
      if (!factors) {
        updates.push({ userId, score: 0, riskLevel: "low" });
        continue;
      }

      const score = computeScore(factors);
      const riskLevel = classifyRisk(score);
      updates.push({ userId, score, riskLevel });

      if (riskLevel === "high") highRisk++;
      if (riskLevel === "critical") criticalRisk++;
    }

    // Batch update profiles
    for (const update of updates) {
      await supabase
        .from("profiles")
        .update({
          churn_risk_score: Math.round(update.score * 100) / 100,
        })
        .eq("id", update.userId);
    }

    processed += batch.length;
  }

  return { processed, highRisk, criticalRisk };
}

/**
 * Trigger n8n alert for users at critical churn risk.
 */
export async function alertCriticalChurnUsers(supabase: ServiceClient): Promise<number> {
  const { data: criticalUsers } = await supabase
    .from("profiles")
    .select("id, email, full_name, churn_risk_score")
    .gte("churn_risk_score", 0.76)
    .order("churn_risk_score", { ascending: false });

  if (!criticalUsers || criticalUsers.length === 0) return 0;

  let alerted = 0;
  for (const user of criticalUsers) {
    const triggered = await triggerCustomerEvent({
      type: "churn.risk_detected",
      userId: user.id,
      userEmail: user.email,
      data: {
        fullName: user.full_name,
        churnRiskScore: user.churn_risk_score,
        riskLevel: "critical",
      },
    });
    if (triggered) alerted++;
  }

  return alerted;
}
