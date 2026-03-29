import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, isAuthError } from "@/lib/api/auth";
import {
  calculateChurnScore,
  batchCalculateChurnScores,
} from "@/lib/ai/churn";

// ---------------------------------------------------------------------------
// GET /api/analytics/churn
// Returns churn scores for subscribers. Admin only.
// Query params: ?riskLevel=high,critical&limit=20
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const auth = await requireAdmin(supabase);

  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = request.nextUrl;
  const riskLevelParam = searchParams.get("riskLevel");
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 50;

  // Build query for profiles with subscriptions
  let query = supabase
    .from("profiles")
    .select(`
      id,
      email,
      full_name,
      churn_risk_score,
      created_at
    `)
    .not("churn_risk_score", "is", null)
    .order("churn_risk_score", { ascending: false })
    .limit(limit);

  // Filter by risk level ranges
  if (riskLevelParam) {
    const levels = riskLevelParam.split(",").map((l) => l.trim().toLowerCase());
    let minScore = 0;
    let maxScore = 1;

    if (levels.includes("critical") && !levels.includes("high") && !levels.includes("medium") && !levels.includes("low")) {
      minScore = 0.76;
    } else if (levels.includes("high") && !levels.includes("medium") && !levels.includes("low")) {
      minScore = 0.51;
    } else if (levels.includes("medium") && !levels.includes("low")) {
      minScore = 0.26;
    }

    if (!levels.includes("critical") && levels.includes("high")) {
      maxScore = 0.75;
    }

    query = query.gte("churn_risk_score", minScore).lte("churn_risk_score", maxScore);
  }

  const { data: profiles, error } = await query;

  if (error) {
    console.error("[analytics:churn] Query failed:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch churn data" },
      { status: 500 }
    );
  }

  // Fetch subscription details for these users
  const userIds = (profiles ?? []).map((p) => p.id);
  let subscriptionMap = new Map<string, { status: string; box_size: string; next_delivery_date: string | null }>();

  if (userIds.length > 0) {
    const { data: subs } = await supabase
      .from("aura_subscriptions")
      .select("user_id, status, box_size, next_delivery_date")
      .in("user_id", userIds)
      .in("status", ["active", "paused"]);

    for (const sub of subs ?? []) {
      if (!subscriptionMap.has(sub.user_id)) {
        subscriptionMap.set(sub.user_id, {
          status: sub.status,
          box_size: sub.box_size,
          next_delivery_date: sub.next_delivery_date,
        });
      }
    }
  }

  // Classify risk levels and build response
  const users = (profiles ?? []).map((p) => {
    const score = p.churn_risk_score ?? 0;
    let riskLevel: string = "low";
    if (score > 0.75) riskLevel = "critical";
    else if (score > 0.5) riskLevel = "high";
    else if (score > 0.25) riskLevel = "medium";

    const sub = subscriptionMap.get(p.id);

    return {
      id: p.id,
      email: p.email,
      fullName: p.full_name,
      churnScore: score,
      riskLevel,
      subscription: sub ?? null,
    };
  });

  // Summary counts
  const summary = {
    total: users.length,
    low: users.filter((u) => u.riskLevel === "low").length,
    medium: users.filter((u) => u.riskLevel === "medium").length,
    high: users.filter((u) => u.riskLevel === "high").length,
    critical: users.filter((u) => u.riskLevel === "critical").length,
  };

  return NextResponse.json({ summary, users });
}

// ---------------------------------------------------------------------------
// POST /api/analytics/churn
// Trigger batch churn score recalculation. Admin only.
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const auth = await requireAdmin(supabase);

  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const result = await batchCalculateChurnScores();

    return NextResponse.json({
      success: true,
      message: `Processed ${result.processed} subscribers`,
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[analytics:churn] Batch calculation failed:", message);
    return NextResponse.json(
      { error: "Batch calculation failed", details: message },
      { status: 500 }
    );
  }
}
