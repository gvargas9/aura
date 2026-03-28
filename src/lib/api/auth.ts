import { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Profile } from "@/types/database";

type TypedSupabaseClient = SupabaseClient<Database>;

interface AuthResult {
  user: { id: string; email?: string };
  profile: Profile;
}

interface AuthError {
  error: string;
  status: number;
}

export async function getAuthenticatedUser(
  supabase: TypedSupabaseClient
): Promise<AuthResult | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return null;
  }

  return { user, profile };
}

export async function requireAuth(
  supabase: TypedSupabaseClient
): Promise<AuthResult | AuthError> {
  const result = await getAuthenticatedUser(supabase);

  if (!result) {
    return { error: "Authentication required", status: 401 };
  }

  return result;
}

export async function requireAdmin(
  supabase: TypedSupabaseClient
): Promise<AuthResult | AuthError> {
  const result = await requireAuth(supabase);

  if ("error" in result) {
    return result;
  }

  if (result.profile.role !== "admin") {
    return { error: "Admin access required", status: 403 };
  }

  return result;
}

export function isAuthError(
  result: AuthResult | AuthError
): result is AuthError {
  return "error" in result;
}
