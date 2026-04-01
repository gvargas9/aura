import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, isAuthError } from "@/lib/api/auth";
import { applyRateLimit, rateLimiters } from "@/lib/api/rate-limit";
import { safeError } from "@/lib/api/safe-error";
import { validateUUID, sanitizeString } from "@/lib/api/validation";
import { syncCustomerToBusinessManager } from "@/lib/business-manager";

// ---------------------------------------------------------------------------
// GET /api/sync/dealers — List dealers with sync status (admin only)
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

    const { data: dealers, error } = await supabase
      .from("dealers")
      .select("*, profiles(full_name, email), organizations(name, dealer_tier)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[sync/dealers] Failed to fetch dealers:", error.message);
      return NextResponse.json(safeError(error, "Failed to fetch dealers"), { status: 500 });
    }

    // Map dealers with sync status from metadata
    const dealersWithSync = (dealers ?? []).map((dealer: Record<string, unknown>) => {
      const metadata = (dealer.metadata as Record<string, unknown>) ?? {};
      return {
        ...dealer,
        business_manager_synced: !!metadata.business_manager_user_id,
        business_manager_user_id: metadata.business_manager_user_id ?? null,
        business_manager_synced_at: metadata.business_manager_synced_at ?? null,
      };
    });

    return NextResponse.json({ dealers: dealersWithSync });
  } catch (error) {
    return NextResponse.json(safeError(error, "Failed to fetch dealers"), { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/sync/dealers — Sync/unsync a dealer to BusinessManager (admin only)
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
    const { dealer_id, action } = body;

    if (!dealer_id || !validateUUID(dealer_id)) {
      return NextResponse.json({ error: "Valid dealer_id is required" }, { status: 400 });
    }

    if (action !== "sync" && action !== "unsync") {
      return NextResponse.json(
        { error: "Action must be 'sync' or 'unsync'" },
        { status: 400 }
      );
    }

    // Fetch dealer with profile and org
    const { data: dealer, error: fetchError } = await supabase
      .from("dealers")
      .select("*, profiles(full_name, email), organizations(name, dealer_tier, contact_email)")
      .eq("id", dealer_id)
      .single();

    if (fetchError || !dealer) {
      return NextResponse.json({ error: "Dealer not found" }, { status: 404 });
    }

    const dealerData = dealer as unknown as {
      id: string;
      business_name: string;
      metadata: Record<string, unknown> | null;
      organization_id: string | null;
      profiles: { full_name: string; email: string } | null;
      organizations: { name: string; dealer_tier: string; contact_email: string | null } | null;
    };

    const currentMetadata = dealerData.metadata ?? {};

    if (action === "sync") {
      // Sync dealer to BusinessManager as a customer
      const syncResult = await syncCustomerToBusinessManager({
        firstName: dealerData.profiles?.full_name?.split(" ")[0] ?? "Unknown",
        lastName: dealerData.profiles?.full_name?.split(" ").slice(1).join(" ") ?? "",
        email: dealerData.profiles?.email ?? "",
        company: dealerData.organizations?.name ?? undefined,
        externalId: dealerData.id,
        customFields: {
          aura_dealer_id: dealerData.id,
          dealer_tier: dealerData.organizations?.dealer_tier,
          organization_id: dealerData.organization_id,
          synced_by: auth.user.id,
        },
      });

      // Update dealer metadata with sync info
      const updatedMetadata = {
        ...currentMetadata,
        business_manager_user_id: `mm_${dealerData.id}`,
        business_manager_synced_at: new Date().toISOString(),
        business_manager_synced_by: auth.user.id,
        business_manager_sync_success: syncResult,
      };

      const { error: updateError } = await supabase
        .from("dealers")
        .update({
          metadata: updatedMetadata as never,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", dealer_id);

      if (updateError) {
        console.error("[sync/dealers] Failed to update dealer metadata:", updateError.message);
        return NextResponse.json(safeError(updateError, "Failed to update dealer"), { status: 500 });
      }

      return NextResponse.json({
        success: true,
        action: "synced",
        business_manager_user_id: `mm_${dealerData.id}`,
        sync_api_success: syncResult,
      });
    } else {
      // Unsync: remove BusinessManager metadata
      const { business_manager_user_id: _, business_manager_synced_at: __, business_manager_synced_by: ___, business_manager_sync_success: ____, ...cleanMetadata } = currentMetadata as Record<string, unknown>;

      const { error: updateError } = await supabase
        .from("dealers")
        .update({
          metadata: cleanMetadata as never,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", dealer_id);

      if (updateError) {
        console.error("[sync/dealers] Failed to update dealer metadata:", updateError.message);
        return NextResponse.json(safeError(updateError, "Failed to update dealer"), { status: 500 });
      }

      return NextResponse.json({ success: true, action: "unsynced" });
    }
  } catch (error) {
    return NextResponse.json(safeError(error, "Failed to sync dealer"), { status: 500 });
  }
}
