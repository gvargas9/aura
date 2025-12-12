import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { Database } from "@/types/database";

type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirectTo = requestUrl.searchParams.get("redirectTo") || "/dashboard";
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if user has a profile, create if not
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Check if profile exists
        const { count } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("id", user.id);

        if (!count || count === 0) {
          // Create profile for new user
          const newProfile: ProfileInsert = {
            id: user.id,
            email: user.email!,
            full_name: user.user_metadata.full_name || user.user_metadata.name || null,
            avatar_url: user.user_metadata.avatar_url || null,
            role: "customer",
          };
          // Use type assertion to work around Supabase type inference issue with chained queries
          const insertClient = await createClient();
          await (insertClient.from("profiles") as unknown as { insert: (data: ProfileInsert) => Promise<unknown> }).insert(newProfile);
        }
      }

      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/error`);
}
