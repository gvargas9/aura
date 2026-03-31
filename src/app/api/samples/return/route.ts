import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, isAuthError } from "@/lib/api/auth";
import { applyRateLimit, rateLimiters } from "@/lib/api/rate-limit";
import { safeError } from "@/lib/api/safe-error";
import { validateUUID, sanitizeString } from "@/lib/api/validation";
import { logSampleActivity } from "@/lib/menumaster";

// ---------------------------------------------------------------------------
// POST /api/samples/return — Return samples from a dealer
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
    const { allocation_id, quantity, notes } = body;

    // Validation
    if (!allocation_id || !validateUUID(allocation_id)) {
      return NextResponse.json({ error: "Valid allocation_id is required" }, { status: 400 });
    }
    if (!quantity || typeof quantity !== "number" || quantity < 1) {
      return NextResponse.json({ error: "Quantity must be a positive number" }, { status: 400 });
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

    // Check returnable quantity (can return up to what hasn't been distributed or already returned)
    const maxReturnable = alloc.quantity_allocated - alloc.quantity_distributed - alloc.quantity_returned;
    if (quantity > maxReturnable) {
      return NextResponse.json(
        { error: `Only ${maxReturnable} samples can be returned` },
        { status: 400 }
      );
    }

    // Update allocation
    const newReturned = alloc.quantity_returned + quantity;
    const newStatus =
      alloc.quantity_distributed + newReturned >= alloc.quantity_allocated
        ? "returned"
        : alloc.status;

    const { error: updateError } = await supabase
      .from("sample_allocations" as never)
      .update({
        quantity_returned: newReturned,
        status: newStatus,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", allocation_id);

    if (updateError) {
      console.error("[samples/return] Update failed:", updateError.message);
      return NextResponse.json(safeError(updateError, "Failed to return samples"), { status: 500 });
    }

    // Record event
    await supabase
      .from("sample_events" as never)
      .insert({
        allocation_id,
        event_type: "returned",
        quantity,
        from_holder: alloc.dealers?.business_name ?? alloc.dealer_id,
        to_holder: "warehouse",
        notes: notes ? sanitizeString(notes) : null,
        performed_by: auth.user.id,
      } as never);

    // Fire-and-forget: sync activity to MenuMaster
    logSampleActivity({
      type: "sample_returned",
      subject: `${quantity} sample(s) returned`,
      description: notes ? sanitizeString(notes) : undefined,
      dealerId: alloc.dealer_id,
      dealerName: alloc.dealers?.business_name,
      productId: alloc.product_id,
      quantity,
    });

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    return NextResponse.json(safeError(error, "Failed to return samples"), { status: 500 });
  }
}
