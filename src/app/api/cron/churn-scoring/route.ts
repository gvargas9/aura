import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { batchCalculateChurnScores, alertCriticalChurnUsers } from "@/lib/ai/churn";
import { logAutomationEvent } from "@/lib/n8n/events";
import type { Database } from "@/types/database";

const supabaseAdmin = createClient<Database>(
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
// GET /api/cron/churn-scoring
// Daily cron: recalculate all churn scores, alert critical risk users.
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[cron:churn-scoring] Starting daily churn score calculation");

  try {
    // Recalculate all scores
    const result = await batchCalculateChurnScores();

    console.log(
      `[cron:churn-scoring] Processed ${result.processed} users. High risk: ${result.highRisk}, Critical: ${result.criticalRisk}`
    );

    // Alert critical users via n8n
    let alertedCount = 0;
    if (result.criticalRisk > 0) {
      alertedCount = await alertCriticalChurnUsers(supabaseAdmin);
      console.log(`[cron:churn-scoring] Alerted ${alertedCount} critical-risk users via n8n`);
    }

    await logAutomationEvent({
      channel: "cron",
      event: "churn_scoring.completed",
      data: {
        processed: result.processed,
        highRisk: result.highRisk,
        criticalRisk: result.criticalRisk,
        alertedCount,
      },
    });

    return NextResponse.json({
      success: true,
      ...result,
      alertedCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[cron:churn-scoring] Failed:", message);

    await logAutomationEvent({
      channel: "cron",
      event: "churn_scoring.failed",
      data: { error: message },
    });

    return NextResponse.json(
      { error: "Churn scoring failed", details: message },
      { status: 500 }
    );
  }
}
