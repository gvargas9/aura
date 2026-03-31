import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, isApiKeyError, hasScope } from "@/lib/api/api-keys";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { sanitizeString, validatePagination } from "@/lib/api/validation";
import { safeError } from "@/lib/api/safe-error";
import { createClient } from "@supabase/supabase-js";
import type { ApiResponse, PaginatedResponse } from "@/types";

export async function GET(request: NextRequest) {
  try {
    // Authenticate via API key
    const auth = await validateApiKey(request);
    if (isApiKeyError(auth)) return auth;

    // Check scope
    if (!hasScope(auth, "products:read")) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Insufficient scope: products:read required" },
        { status: 403 }
      );
    }

    // Rate limit per API key
    const rl = await applyRateLimit(request, {
      windowMs: 60_000,
      maxRequests: auth.rate_limit,
      keyGenerator: () => `apikey:${auth.key_id}`,
    });
    if (rl) return rl;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const searchParams = request.nextUrl.searchParams;
    const { page, pageSize } = validatePagination(
      searchParams.get("page"),
      searchParams.get("page_size")
    );
    const category = searchParams.get("category") || "";
    const search = searchParams.get("search") || "";

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("aura_products")
      .select("id, sku, name, description, short_description, price, compare_at_price, image_url, images, category, tags, dietary_labels, allergens_enum, weight_oz, shelf_life_months, is_bunker_safe", { count: "exact" })
      .eq("is_active", true);

    if (search) {
      const sanitized = sanitizeString(search);
      if (sanitized) {
        query = query.or(
          `name.ilike.%${sanitized}%,description.ilike.%${sanitized}%`
        );
      }
    }

    if (category) {
      const sanitized = sanitizeString(category);
      if (sanitized) {
        query = query.eq("category", sanitized);
      }
    }

    query = query.order("name", { ascending: true }).range(from, to);

    const { data: items, error, count } = await query;

    if (error) {
      console.error("[v1/products] Fetch error:", error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Failed to fetch products" },
        { status: 500 }
      );
    }

    const total = count || 0;
    const response: PaginatedResponse<(typeof items)[number]> = {
      items: items || [],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };

    return NextResponse.json<ApiResponse<typeof response>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("[v1/products] GET error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, ...safeError(error, "Internal server error") },
      { status: 500 }
    );
  }
}
