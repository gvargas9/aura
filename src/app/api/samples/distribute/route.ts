import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, isAuthError } from "@/lib/api/auth";
import { applyRateLimit, rateLimiters } from "@/lib/api/rate-limit";
import { safeError } from "@/lib/api/safe-error";
import { validateUUID, sanitizeString, validateEmail } from "@/lib/api/validation";
import { logSampleActivity } from "@/lib/business-manager";

// ---------------------------------------------------------------------------
// POST /api/samples/distribute — Distribute samples to a lead
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const rl = await applyRateLimit(request, rateLimiters.write);
  if (rl) return rl;

  try {
    const supabase = await createClient();
    const auth = await requireAuth(supabase);
    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { allocation_id, quantity, lead_name, lead_email, notes } = body;

    // Validation
    if (!allocation_id || !validateUUID(allocation_id)) {
      return NextResponse.json({ error: "Valid allocation_id is required" }, { status: 400 });
    }
    if (!quantity || typeof quantity !== "number" || quantity < 1) {
      return NextResponse.json({ error: "Quantity must be a positive number" }, { status: 400 });
    }
    if (!lead_name || typeof lead_name !== "string") {
      return NextResponse.json({ error: "lead_name is required" }, { status: 400 });
    }
    if (lead_email && !validateEmail(lead_email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Fetch allocation and verify ownership
    const { data: allocation, error: fetchError } = await supabase
      .from("sample_allocations" as never)
      .select("*, dealers(profile_id, business_name)")
      .eq("id", allocation_id)
      .single();

    if (fetchError || !allocation) {
      return NextResponse.json({ error: "Allocation not found" }, { status: 404 });
    }

    const alloc = allocation as {
      id: string;
      product_id: string;
      dealer_id: string;
      quantity_allocated: number;
      quantity_distributed: number;
      quantity_returned: number;
      status: string;
      dealers: { profile_id: string; business_name: string } | null;
    };

    // Check ownership (dealer or admin)
    const isOwner = alloc.dealers?.profile_id === auth.user.id;
    const isAdmin = auth.profile.role === "admin";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check available quantity
    const available = alloc.quantity_allocated - alloc.quantity_distributed - alloc.quantity_returned;
    if (quantity > available) {
      return NextResponse.json(
        { error: `Only ${available} samples available for distribution` },
        { status: 400 }
      );
    }

    if (alloc.status !== "active") {
      return NextResponse.json(
        { error: "Allocation is not active" },
        { status: 400 }
      );
    }

    // Update allocation
    const newDistributed = alloc.quantity_distributed + quantity;
    const newStatus =
      newDistributed + alloc.quantity_returned >= alloc.quantity_allocated
        ? "fully_distributed"
        : "active";

    const { error: updateError } = await supabase
      .from("sample_allocations" as never)
      .update({
        quantity_distributed: newDistributed,
        status: newStatus,
        lead_name: sanitizeString(lead_name),
        lead_email: lead_email ? sanitizeString(lead_email) : null,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", allocation_id);

    if (updateError) {
      console.error("[samples/distribute] Update failed:", updateError.message);
      return NextResponse.json(safeError(updateError, "Failed to distribute samples"), { status: 500 });
    }

    // Record event
    await supabase
      .from("sample_events" as never)
      .insert({
        allocation_id,
        event_type: "distributed",
        quantity,
        from_holder: alloc.dealers?.business_name ?? alloc.dealer_id,
        to_holder: sanitizeString(lead_name),
        notes: notes ? sanitizeString(notes) : null,
        performed_by: auth.user.id,
      } as never);

    // Fire-and-forget: sync activity to BusinessManager (if lead has a BusinessManager ID)
    const leadExtId = (alloc as Record<string, unknown>).lead_external_id as string | undefined;
    if (leadExtId) {
      const mmLeadId = parseInt(leadExtId, 10);
      if (!isNaN(mmLeadId)) {
        logSampleActivity({
          leadId: mmLeadId,
          subject: `${quantity} sample(s) distributed to ${lead_name}`,
          description: notes ? sanitizeString(notes) : `Sample delivery by dealer`,
          activityType: "note",
        });
      }
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    return NextResponse.json(safeError(error, "Failed to distribute samples"), { status: 500 });
  }
}
