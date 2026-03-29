import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, isAuthError } from "@/lib/api/auth";
import { validatePrice, sanitizeString } from "@/lib/api/validation";
import { safeError } from "@/lib/api/safe-error";
import type { ApiResponse, PaginatedResponse } from "@/types";
import type { Product } from "@/types/database";

interface EnhancedProduct extends Product {
  variants?: {
    id: string;
    sku: string;
    name: string;
    size: string | null;
    flavor: string | null;
    pack_count: number | null;
    price: number;
    compare_at_price: number | null;
    stock_level: number;
    is_active: boolean;
  }[];
  reviewSummary?: {
    averageRating: number;
    totalCount: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10))
    );
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const isActive = searchParams.get("isActive");
    const isBunkerSafe = searchParams.get("isBunkerSafe");
    const sortBy = searchParams.get("sortBy") || "newest";
    const dietary = searchParams.get("dietary") || "";
    const excludeAllergens = searchParams.get("excludeAllergens") || "";

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from("aura_products").select("*", { count: "exact" });

    // By default, only show active products for public access
    if (isActive === "false") {
      query = query.eq("is_active", false);
    } else if (isActive === "all") {
      // Show all products (admin use case) - no filter
    } else {
      query = query.eq("is_active", true);
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%`
      );
    }

    if (category) {
      query = query.eq("category", category);
    }

    if (isBunkerSafe === "true") {
      query = query.eq("is_bunker_safe", true);
    } else if (isBunkerSafe === "false") {
      query = query.eq("is_bunker_safe", false);
    }

    // Filter by dietary labels (e.g., ?dietary=vegan,keto)
    if (dietary) {
      const labels = dietary.split(",").map((l) => l.trim()).filter(Boolean);
      for (const label of labels) {
        query = query.contains("dietary_labels", [label]);
      }
    }

    // Filter by allergen exclusion (e.g., ?excludeAllergens=peanuts,tree_nuts)
    // This uses a post-fetch filter since Supabase doesn't support "not contains any"
    // natively in a single filter. We fetch candidates and filter in-app.
    // For efficiency, we still do the main query with other filters.

    switch (sortBy) {
      case "price_asc":
        query = query.order("price", { ascending: true });
        break;
      case "price_desc":
        query = query.order("price", { ascending: false });
        break;
      case "name":
        query = query.order("name", { ascending: true });
        break;
      case "newest":
      default:
        query = query.order("created_at", { ascending: false });
        break;
    }

    query = query.range(from, to);

    const { data: rawItems, error, count } = await query;

    if (error) {
      console.error("Products fetch error:", error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Failed to fetch products" },
        { status: 500 }
      );
    }

    let items = rawItems || [];

    // Post-fetch allergen exclusion filter
    if (excludeAllergens) {
      const excluded = excludeAllergens
        .split(",")
        .map((a) => a.trim().toLowerCase())
        .filter(Boolean);

      items = items.filter((product) => {
        const productAllergens = (product.allergens_enum || []).map((a: string) =>
          a.toLowerCase()
        );
        return !excluded.some((ex) => productAllergens.includes(ex));
      });
    }

    // Fetch variants and review summaries for the returned products
    const productIds = items.map((p) => p.id);
    let variantMap = new Map<string, EnhancedProduct["variants"]>();
    let reviewMap = new Map<string, { averageRating: number; totalCount: number }>();

    if (productIds.length > 0) {
      // Fetch variants
      const { data: variants } = await supabase
        .from("product_variants")
        .select(
          "id, product_id, sku, name, size, flavor, pack_count, price, compare_at_price, stock_level, is_active"
        )
        .in("product_id", productIds)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (variants) {
        for (const v of variants) {
          const existing = variantMap.get(v.product_id) || [];
          existing.push({
            id: v.id,
            sku: v.sku,
            name: v.name,
            size: v.size,
            flavor: v.flavor,
            pack_count: v.pack_count,
            price: v.price,
            compare_at_price: v.compare_at_price,
            stock_level: v.stock_level,
            is_active: v.is_active,
          });
          variantMap.set(v.product_id, existing);
        }
      }

      // Fetch aggregate review data
      const { data: reviews } = await supabase
        .from("product_reviews")
        .select("product_id, rating")
        .in("product_id", productIds)
        .eq("status", "approved");

      if (reviews) {
        const grouped = new Map<string, number[]>();
        for (const r of reviews) {
          const ratings = grouped.get(r.product_id) || [];
          ratings.push(r.rating);
          grouped.set(r.product_id, ratings);
        }

        for (const [pid, ratings] of grouped) {
          const avg =
            Math.round(
              (ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10
            ) / 10;
          reviewMap.set(pid, {
            averageRating: avg,
            totalCount: ratings.length,
          });
        }
      }
    }

    // Enhance products with variants and review summaries
    const enhancedItems: EnhancedProduct[] = items.map((product) => ({
      ...product,
      variants: variantMap.get(product.id) || [],
      reviewSummary: reviewMap.get(product.id) || {
        averageRating: 0,
        totalCount: 0,
      },
    }));

    const total = count || 0;
    const response: PaginatedResponse<EnhancedProduct> = {
      items: enhancedItems,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };

    return NextResponse.json<ApiResponse<PaginatedResponse<EnhancedProduct>>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Products GET error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
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

    const body = await request.json();
    const { sku, name, price, category } = body;

    if (!sku || !name || price === undefined || price === null || !category) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Missing required fields: sku, name, price, category",
        },
        { status: 400 }
      );
    }

    if (typeof price !== "number" || price < 0 || !validatePrice(price)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Price must be a non-negative number with at most 2 decimal places (max $99,999)" },
        { status: 400 }
      );
    }

    // Sanitize text inputs
    const sanitizedName = sanitizeString(name);
    const sanitizedDescription = body.description ? sanitizeString(body.description) : null;
    const sanitizedShortDesc = body.short_description ? sanitizeString(body.short_description) : null;

    if (!sanitizedName) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Product name cannot be empty after sanitization" },
        { status: 400 }
      );
    }

    // Check SKU uniqueness
    const { data: existing } = await supabase
      .from("aura_products")
      .select("id")
      .eq("sku", sku)
      .single();

    if (existing) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: `Product with SKU '${sku}' already exists` },
        { status: 409 }
      );
    }

    const { data: product, error: insertError } = await supabase
      .from("aura_products")
      .insert({
        sku,
        name: sanitizedName,
        description: sanitizedDescription,
        short_description: sanitizedShortDesc,
        price,
        compare_at_price: body.compare_at_price || null,
        image_url: body.image_url || null,
        images: body.images || [],
        stock_level: body.stock_level || 0,
        is_bunker_safe: body.is_bunker_safe || false,
        shelf_life_months: body.shelf_life_months || null,
        weight_oz: body.weight_oz || null,
        nutritional_info: body.nutritional_info || null,
        ingredients: body.ingredients || null,
        category,
        tags: body.tags || [],
        is_active: body.is_active !== undefined ? body.is_active : true,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Product insert error:", insertError);
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Failed to create product" },
        { status: 500 }
      );
    }

    // Create inventory record for the new product
    const { error: inventoryError } = await supabase
      .from("inventory")
      .insert({
        product_id: product.id,
        warehouse_location: body.warehouse_location || "default",
        quantity: body.stock_level || 0,
        reserved_quantity: 0,
        safety_stock: body.safety_stock || 10,
        reorder_point: body.reorder_point || 20,
      });

    if (inventoryError) {
      console.error("Inventory insert error:", inventoryError);
      // Product was created but inventory record failed - log but don't fail the request
    }

    return NextResponse.json<ApiResponse<Product>>(
      { success: true, data: product, message: "Product created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Products POST error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, ...safeError(error, "Internal server error") },
      { status: 500 }
    );
  }
}
