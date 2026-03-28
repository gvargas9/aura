import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";

// ---------------------------------------------------------------------------
// Service-role Supabase client for server-side event logging.
// Initialised lazily so the module can be imported without the env vars being
// available (e.g. during build-time type checking).
// ---------------------------------------------------------------------------

let _supabaseAdmin: ReturnType<typeof createClient<Database>> | null = null;

function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      return null;
    }

    _supabaseAdmin = createClient<Database>(url, key);
  }
  return _supabaseAdmin;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Log an automation event to the `omni_interaction_log` table.
 *
 * This function never throws. If the database insert fails the error is
 * logged to the console so that callers (webhook handlers, cron jobs) are
 * never blocked by logging failures.
 */
export async function logAutomationEvent(params: {
  userId?: string;
  channel: "n8n" | "webhook" | "cron";
  event: string;
  data: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();

    if (!supabase) {
      console.warn(
        "[automation-event] Supabase not configured -- skipping event log"
      );
      return;
    }

    const { error } = await supabase.from("omni_interaction_log").insert({
      user_id: params.userId ?? null,
      channel: params.channel,
      direction: "outbound",
      content: params.event,
      content_type: "automation_event",
      intent: params.event,
      metadata: params.data as unknown as Json,
    });

    if (error) {
      console.error("[automation-event] Failed to log event:", error.message);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[automation-event] Unexpected error:", message);
  }
}
