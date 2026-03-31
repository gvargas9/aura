import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { applyRateLimit, rateLimiters } from "@/lib/api/rate-limit";
import { sanitizeString } from "@/lib/api/validation";
import { safeError } from "@/lib/api/safe-error";
import { logAutomationEvent } from "@/lib/n8n/events";

// Service-role client for direct DB writes
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

function validateMenuMasterSecret(request: NextRequest): boolean {
  const secret = process.env.MENUMASTER_WEBHOOK_SECRET;
  if (!secret) {
    console.warn(
      "[menumaster-webhook] MENUMASTER_WEBHOOK_SECRET not set — skipping auth"
    );
    return true;
  }
  const headerSecret = request.headers.get("x-menumaster-secret");
  return headerSecret === secret;
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

async function handleLeadConverted(data: Record<string, unknown>) {
  const leadName = sanitizeString((data.lead_name as string) ?? "");
  const leadEmail = sanitizeString((data.lead_email as string) ?? "");
  const companyName = sanitizeString((data.company_name as string) ?? leadName);
  const externalId = (data.external_id as string) ?? null;

  if (!companyName) {
    return { success: false, error: "Missing company_name or lead_name" };
  }

  // Upsert organization in Aura
  const orgPayload = {
    name: companyName,
    contact_email: leadEmail || null,
    dealer_tier: "bronze" as const,
    credit_limit: 0,
    current_balance: 0,
    payment_terms: "net_30" as const,
    is_active: true,
    metadata: { menumaster_lead_id: externalId, converted_at: new Date().toISOString() },
  };

  // Check if org already exists by name
  const { data: existingOrg } = await supabaseAdmin
    .from("organizations")
    .select("id")
    .eq("name", companyName)
    .maybeSingle();

  if (existingOrg) {
    await supabaseAdmin
      .from("organizations")
      .update({
        contact_email: orgPayload.contact_email,
        metadata: orgPayload.metadata,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", existingOrg.id);
  } else {
    await supabaseAdmin
      .from("organizations")
      .insert(orgPayload as never);
  }

  return { success: true };
}

async function handleLeadUpdated(data: Record<string, unknown>) {
  // Log the update — no specific Aura action needed
  return { success: true, note: "Lead update logged" };
}

async function handleOpportunityClosedWon(data: Record<string, unknown>) {
  // Could trigger dealer onboarding, for now just log
  return { success: true, note: "Opportunity closed-won logged" };
}

async function handleAccountUpdated(data: Record<string, unknown>) {
  const externalId = data.external_id as string | undefined;
  const accountName = sanitizeString((data.name as string) ?? "");

  if (!accountName && !externalId) {
    return { success: false, error: "Missing account name or external_id" };
  }

  // Try to find matching org and update
  if (accountName) {
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (data.email) updates.contact_email = sanitizeString(data.email as string);
    if (data.phone) updates.contact_phone = sanitizeString(data.phone as string);

    await supabaseAdmin
      .from("organizations")
      .update(updates as never)
      .eq("name", accountName);
  }

  return { success: true };
}

async function handleActivityCreated(data: Record<string, unknown>) {
  // Activities are informational — just log
  return { success: true, note: "Activity logged" };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // Rate limit
  const rl = await applyRateLimit(request, rateLimiters.write);
  if (rl) return rl;

  // Validate webhook authentication
  if (!validateMenuMasterSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const eventType = body.event as string | undefined;
  const data = (body.data as Record<string, unknown>) ?? {};

  if (!eventType) {
    return NextResponse.json({ error: "Missing event type" }, { status: 400 });
  }

  console.log(`[menumaster-webhook] Received event: ${eventType}`);

  let result: { success: boolean; error?: string; note?: string };

  try {
    switch (eventType) {
      case "lead.converted":
        result = await handleLeadConverted(data);
        break;
      case "lead.updated":
        result = await handleLeadUpdated(data);
        break;
      case "opportunity.closed_won":
        result = await handleOpportunityClosedWon(data);
        break;
      case "account.updated":
        result = await handleAccountUpdated(data);
        break;
      case "activity.created":
        result = await handleActivityCreated(data);
        break;
      default:
        console.log(`[menumaster-webhook] Unhandled event type: ${eventType}`);
        result = { success: true, note: "Unhandled event type" };
    }
  } catch (error) {
    console.error(`[menumaster-webhook] Error handling ${eventType}:`, error);
    return NextResponse.json(
      safeError(error, "Failed to process webhook event"),
      { status: 500 }
    );
  }

  // Log all events to omni_interaction_log
  await logAutomationEvent({
    channel: "webhook",
    event: `menumaster.${eventType}`,
    data: { eventType, ...data, result },
  });

  if (!result.success) {
    return NextResponse.json(
      { received: true, processed: false, error: result.error },
      { status: 422 }
    );
  }

  return NextResponse.json({ received: true, processed: true });
}
