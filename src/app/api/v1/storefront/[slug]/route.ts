import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, isApiKeyError } from "@/lib/api/api-keys";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { sanitizeString } from "@/lib/api/validation";
import { safeError } from "@/lib/api/safe-error";
import { createClient } from "@supabase/supabase-js";
import type { ApiResponse } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Authenticate via API key
    const auth = await validateApiKey(request);
    if (isApiKeyError(auth)) return auth;

    // Rate limit per API key
    const rl = await applyRateLimit(request, {
      windowMs: 60_000,
      maxRequests: auth.rate_limit,
      keyGenerator: () => `apikey:${auth.key_id}`,
    });
    if (rl) return rl;

    const { slug } = await params;
    const sanitizedSlug = sanitizeString(slug);

    if (!sanitizedSlug) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Invalid storefront slug" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch storefront — must belong to the API key's organization
    const { data: storefront, error } = await supabase
      .from("storefronts")
      .select("id, slug, name, theme, settings, organization_id, is_active")
      .eq("slug", sanitizedSlug)
      .eq("organization_id", auth.organization_id)
      .single();

    if (error || !storefront) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Storefront not found" },
        { status: 404 }
      );
    }

    if (!storefront.is_active) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Storefront is inactive" },
        { status: 403 }
      );
    }

    // Fetch the product catalog (active products only)
    const { data: products } = await supabase
      .from("aura_products")
      .select("id, sku, name, description, short_description, price, compare_at_price, image_url, images, category, tags, dietary_labels, allergens_enum, weight_oz, shelf_life_months, is_bunker_safe")
      .eq("is_active", true)
      .order("name", { ascending: true });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        storefront: {
          slug: storefront.slug,
          name: storefront.name,
          theme: storefront.theme,
          settings: storefront.settings,
        },
        products: products || [],
      },
    });
  } catch (error) {
    console.error("[v1/storefront] GET error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, ...safeError(error, "Internal server error") },
      { status: 500 }
    );
  }
}
