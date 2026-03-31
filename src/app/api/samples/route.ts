import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, isAuthError } from "@/lib/api/auth";
import { applyRateLimit, rateLimiters } from "@/lib/api/rate-limit";
import { safeError } from "@/lib/api/safe-error";
import { validateUUID, sanitizeString } from "@/lib/api/validation";

// ---------------------------------------------------------------------------
// GET /api/samples — List all sample allocations (admin only)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const rl = await applyRateLimit(request, rateLimiters.publicRead);
  if (rl) return rl;

  try {
    const supabase = await createClient();
    const auth = await requireAdmin(supabase);
    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const dealerId = searchParams.get("dealer_id");

    let query = supabase
      .from("sample_allocations" as never)
      .select("*, aura_products(name, sku, image_url), dealers(business_name, profile_id, profiles(full_name, email))")
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }
    if (dealerId && validateUUID(dealerId)) {
      query = query.eq("dealer_id", dealerId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[samples] Failed to fetch allocations:", error.message);
      return NextResponse.json(safeError(error, "Failed to fetch samples"), { status: 500 });
    }

    return NextResponse.json({ allocations: data ?? [] });
  } catch (error) {
    return NextResponse.json(safeError(error, "Failed to fetch samples"), { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/samples — Create a new sample allocation (admin only)
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const rl = await applyRateLimit(request, rateLimiters.write);
  if (rl) return rl;

  try {
    const supabase = await createClient();
    const auth = await requireAdmin(supabase);
    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const {
      product_id,
      dealer_id,
      quantity,
      expires_at,
      notes,
    } = body;

    // Validation
    if (!product_id || !validateUUID(product_id)) {
      return NextResponse.json({ error: "Valid product_id is required" }, { status: 400 });
    }
    if (!dealer_id || !validateUUID(dealer_id)) {
      return NextResponse.json({ error: "Valid dealer_id is required" }, { status: 400 });
    }
    if (!quantity || typeof quantity !== "number" || quantity < 1) {
      return NextResponse.json({ error: "Quantity must be a positive number" }, { status: 400 });
    }

    const allocation = {
      product_id,
      dealer_id,
      quantity_allocated: quantity,
      quantity_distributed: 0,
      quantity_returned: 0,
      status: "active",
      notes: notes ? sanitizeString(notes) : null,
      expires_at: expires_at || null,
      allocated_by: auth.user.id,
    };

    const { data, error } = await supabase
      .from("sample_allocations" as never)
      .insert(allocation as never)
      .select()
      .single();

    if (error) {
      console.error("[samples] Failed to create allocation:", error.message);
      return NextResponse.json(safeError(error, "Failed to create allocation"), { status: 500 });
    }

    // Record the allocation event
    await supabase
      .from("sample_events" as never)
      .insert({
        allocation_id: (data as { id: string }).id,
        event_type: "allocated",
        quantity,
        from_holder: "warehouse",
        to_holder: dealer_id,
        notes: notes ? sanitizeString(notes) : "Initial allocation",
        performed_by: auth.user.id,
      } as never);

    return NextResponse.json({ allocation: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(safeError(error, "Failed to create allocation"), { status: 500 });
  }
}
