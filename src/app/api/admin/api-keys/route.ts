import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { requireAdmin, isAuthError } from "@/lib/api/auth";
import { applyRateLimit, rateLimiters } from "@/lib/api/rate-limit";
import { sanitizeString, validateUUID } from "@/lib/api/validation";
import { safeError } from "@/lib/api/safe-error";
import { generateApiKey } from "@/lib/api/api-keys";
import type { ApiResponse } from "@/types";

/**
 * Create an untyped service role client for api_keys table access.
 * The api_keys table is not yet in the generated Database types.
 */
function createApiKeysClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const auth = await requireAdmin(supabase);

    if (isAuthError(auth)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const rl = await applyRateLimit(request, rateLimiters.publicRead);
    if (rl) return rl;

    const serviceClient = createApiKeysClient();
    const { data: keys, error } = await serviceClient
      .from("api_keys")
      .select(
        `
        id,
        key_prefix,
        name,
        organization_id,
        scopes,
        rate_limit,
        is_active,
        last_used_at,
        created_at,
        organizations (
          id,
          name
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[admin/api-keys] Fetch error:", error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Failed to fetch API keys" },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: keys || [],
    });
  } catch (error) {
    console.error("[admin/api-keys] GET error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, ...safeError(error, "Internal server error") },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const auth = await requireAdmin(supabase);

    if (isAuthError(auth)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const rl = await applyRateLimit(request, rateLimiters.write);
    if (rl) return rl;

    const body = await request.json();
    const { organization_id, name, scopes, rate_limit } = body;

    if (!organization_id || !validateUUID(organization_id)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Valid organization_id is required" },
        { status: 400 }
      );
    }

    if (!name || typeof name !== "string") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Key name is required" },
        { status: 400 }
      );
    }

    const sanitizedName = sanitizeString(name);
    if (!sanitizedName) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Key name cannot be empty after sanitization" },
        { status: 400 }
      );
    }

    // Verify organization exists and is active
    const { data: org } = await supabase
      .from("organizations")
      .select("id, name, is_active")
      .eq("id", organization_id)
      .single();

    if (!org) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Organization not found" },
        { status: 404 }
      );
    }

    if (!org.is_active) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Organization is inactive" },
        { status: 400 }
      );
    }

    // Validate scopes if provided
    const validScopes = [
      "products:read",
      "orders:write",
      "orders:read",
      "storefronts:read",
      "*",
    ];
    const keyScopes: string[] = Array.isArray(scopes) ? scopes : ["products:read"];
    for (const scope of keyScopes) {
      if (!validScopes.includes(scope)) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: `Invalid scope: ${scope}. Valid scopes: ${validScopes.join(", ")}`,
          },
          { status: 400 }
        );
      }
    }

    // Validate rate_limit if provided
    const keyRateLimit =
      typeof rate_limit === "number" && rate_limit > 0 && rate_limit <= 1000
        ? rate_limit
        : 100;

    // Generate the API key
    const { key, prefix, hash } = await generateApiKey();

    const serviceClient = createApiKeysClient();
    const { data: apiKey, error: insertError } = await serviceClient
      .from("api_keys")
      .insert({
        key_hash: hash,
        key_prefix: prefix,
        organization_id,
        name: sanitizedName,
        scopes: keyScopes,
        rate_limit: keyRateLimit,
      })
      .select("id, key_prefix, name, scopes, rate_limit, created_at")
      .single();

    if (insertError) {
      console.error("[admin/api-keys] Insert error:", insertError);
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Failed to create API key" },
        { status: 500 }
      );
    }

    // Return the plaintext key ONCE — it cannot be retrieved again
    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          ...apiKey,
          key, // plaintext key — only shown at creation time
          organization_name: org.name,
        },
        message:
          "API key created. Save the key now — it will not be shown again.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[admin/api-keys] POST error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, ...safeError(error, "Internal server error") },
      { status: 500 }
    );
  }
}
