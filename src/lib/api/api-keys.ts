/**
 * API key validation for B2B partner endpoints.
 * Validates X-API-Key header against the api_keys table using SHA-256 hashing.
 */

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export interface ApiKeyAuth {
  organization_id: string;
  organization_name: string;
  scopes: string[];
  rate_limit: number;
  key_id: string;
}

/**
 * Hash an API key using SHA-256 for secure storage/comparison.
 */
export async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generate a new API key with a recognizable prefix.
 * Format: aura_sk_<random_hex>
 * Returns { key, prefix, hash } — the plaintext key is only available at generation time.
 */
export async function generateApiKey(): Promise<{
  key: string;
  prefix: string;
  hash: string;
}> {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  const hex = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const key = `aura_sk_${hex}`;
  const prefix = key.substring(0, 8);
  const hash = await hashApiKey(key);
  return { key, prefix, hash };
}

/**
 * Validate an API key from the X-API-Key request header.
 * Returns the authenticated org context or a 401/403 NextResponse.
 */
export async function validateApiKey(
  request: Request
): Promise<ApiKeyAuth | NextResponse> {
  const apiKey = request.headers.get("X-API-Key");

  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "Missing X-API-Key header" },
      { status: 401 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[API Keys] Missing Supabase environment variables");
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const keyHash = await hashApiKey(apiKey);

  const { data: apiKeyRecord, error } = await supabase
    .from("api_keys")
    .select(
      `
      id,
      organization_id,
      scopes,
      rate_limit,
      is_active,
      organizations!inner (
        id,
        name,
        is_active
      )
    `
    )
    .eq("key_hash", keyHash)
    .eq("is_active", true)
    .single();

  if (error || !apiKeyRecord) {
    return NextResponse.json(
      { success: false, error: "Invalid or inactive API key" },
      { status: 401 }
    );
  }

  // Check organization is active
  const org = apiKeyRecord.organizations as unknown as {
    id: string;
    name: string;
    is_active: boolean;
  };

  if (!org?.is_active) {
    return NextResponse.json(
      { success: false, error: "Organization is inactive" },
      { status: 403 }
    );
  }

  // Update last_used_at (fire-and-forget)
  supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", apiKeyRecord.id)
    .then(() => {});

  return {
    organization_id: apiKeyRecord.organization_id,
    organization_name: org.name,
    scopes: apiKeyRecord.scopes || ["products:read"],
    rate_limit: apiKeyRecord.rate_limit || 100,
    key_id: apiKeyRecord.id,
  };
}

/**
 * Check if the validateApiKey result is an error response.
 */
export function isApiKeyError(
  result: ApiKeyAuth | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}

/**
 * Check if the API key has a required scope.
 */
export function hasScope(auth: ApiKeyAuth, scope: string): boolean {
  return auth.scopes.includes(scope) || auth.scopes.includes("*");
}
