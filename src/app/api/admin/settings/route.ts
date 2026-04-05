import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, isAuthError } from "@/lib/api/auth";
import { applyRateLimit, rateLimiters } from "@/lib/api/rate-limit";
import { safeError } from "@/lib/api/safe-error";

export async function GET() {
  try {
    const supabase = await createClient();
    const auth = await requireAdmin(supabase);
    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { data, error } = await supabase
      .from("app_settings")
      .select("*")
      .order("category");

    if (error) {
      return NextResponse.json({ error: safeError(error) }, { status: 500 });
    }

    // Transform to a keyed object grouped by category
    const settings: Record<string, Record<string, unknown>> = {};
    for (const row of data || []) {
      if (!settings[row.category]) {
        settings[row.category] = {};
      }
      settings[row.category][row.key] = row.value;
    }

    return NextResponse.json({ settings, raw: data });
  } catch (error) {
    return NextResponse.json({ error: safeError(error) }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    const rl = await applyRateLimit(request, rateLimiters.write);
    if (rl) return rl;

    const auth = await requireAdmin(supabase);
    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: "key and value are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("app_settings")
      .update({ value: JSON.parse(JSON.stringify(value)), updated_by: auth.user.id })
      .eq("key", key)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: safeError(error) }, { status: 500 });
    }

    return NextResponse.json({ setting: data });
  } catch (error) {
    return NextResponse.json({ error: safeError(error) }, { status: 500 });
  }
}
