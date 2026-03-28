import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  organizationId: string | null;
}

/**
 * Create a Supabase admin client using service role key.
 * This bypasses RLS and should only be used in trusted Edge Functions.
 */
export function createAdminClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

/**
 * Extract and verify a user JWT from the Authorization header.
 * Returns the authenticated user's profile or null.
 */
export async function getUser(
  req: Request,
  supabase: SupabaseClient,
): Promise<AuthUser | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "");

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  // Fetch profile for role and organization info
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? "",
    role: profile?.role ?? "customer",
    organizationId: profile?.organization_id ?? null,
  };
}

/**
 * Require that the authenticated user has the admin role.
 * Returns the user if admin, null otherwise.
 */
export async function requireAdmin(
  req: Request,
  supabase: SupabaseClient,
): Promise<AuthUser | null> {
  const user = await getUser(req, supabase);
  if (!user || user.role !== "admin") {
    return null;
  }
  return user;
}

/**
 * Validate that a request is coming from the service role (internal call).
 * Checks that the apikey header matches the service role key.
 */
export function requireServiceRole(req: Request): boolean {
  const apiKey = req.headers.get("apikey") ?? req.headers.get("Authorization")?.replace("Bearer ", "");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  return apiKey === serviceKey;
}
