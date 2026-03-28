import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, isAuthError } from "@/lib/api/auth";
import type { ApiResponse } from "@/types";

interface BundleWithItems {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  images: string[];
  bundle_price: number;
  compare_at_price: number | null;
  bundle_type: string;
  custom_pick_count: number | null;
  category: string | null;
  tags: string[];
  is_active: boolean;
  is_seasonal: boolean;
  available_from: string | null;
  available_until: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  items: BundleItem[];
  savingsPercent: number;
}

interface BundleItem {
  id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  sort_order: number;
  product?: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    sku: string;
  };
}

/**
 * GET /api/bundles
 * Public endpoint - list active bundles with their items and pricing.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const includeInactive = searchParams.get("includeInactive") === "true";

    let query = supabase
      .from("product_bundles")
      .select("*")
      .order("sort_order", { ascending: true });

    if (!includeInactive) {
      query = query.eq("is_active", true);

      // Filter out bundles outside their availability window
      const now = new Date().toISOString();
      query = query.or(
        `available_from.is.null,available_from.lte.${now}`
      );
      query = query.or(
        `available_until.is.null,available_until.gte.${now}`
      );
    }

    if (category) {
      query = query.eq("category", category);
    }

    const { data: bundles, error } = await query;

    if (error) {
      console.error("Bundles fetch error:", error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Failed to fetch bundles" },
        { status: 500 }
      );
    }

    if (!bundles || bundles.length === 0) {
      return NextResponse.json<ApiResponse<BundleWithItems[]>>({
        success: true,
        data: [],
      });
    }

    // Fetch all bundle items for these bundles
    const bundleIds = bundles.map((b) => b.id);
    const { data: allItems } = await supabase
      .from("product_bundle_items")
      .select("*")
      .in("bundle_id", bundleIds)
      .order("sort_order", { ascending: true });

    // Fetch products for the bundle items
    const productIds = [
      ...new Set((allItems || []).map((item) => item.product_id)),
    ];

    let productMap = new Map<
      string,
      { id: string; name: string; price: number; image_url: string | null; sku: string }
    >();

    if (productIds.length > 0) {
      const { data: products } = await supabase
        .from("aura_products")
        .select("id, name, price, image_url, sku")
        .in("id", productIds);

      if (products) {
        productMap = new Map(products.map((p) => [p.id, p]));
      }
    }

    // Assemble response
    const result: BundleWithItems[] = bundles.map((bundle) => {
      const bundleItems: BundleItem[] = (allItems || [])
        .filter((item) => item.bundle_id === bundle.id)
        .map((item) => ({
          id: item.id,
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          sort_order: item.sort_order,
          product: productMap.get(item.product_id) || undefined,
        }));

      // Calculate what items would cost individually
      const itemsTotalRetail = bundleItems.reduce((sum, item) => {
        const product = productMap.get(item.product_id);
        return sum + (product ? product.price * item.quantity : 0);
      }, 0);

      const savingsPercent =
        itemsTotalRetail > 0 && bundle.bundle_price < itemsTotalRetail
          ? Math.round(
              ((itemsTotalRetail - bundle.bundle_price) / itemsTotalRetail) * 100
            )
          : 0;

      return {
        id: bundle.id,
        name: bundle.name,
        slug: bundle.slug,
        description: bundle.description,
        image_url: bundle.image_url,
        images: bundle.images,
        bundle_price: bundle.bundle_price,
        compare_at_price: bundle.compare_at_price ?? itemsTotalRetail,
        bundle_type: bundle.bundle_type,
        custom_pick_count: bundle.custom_pick_count,
        category: bundle.category,
        tags: bundle.tags,
        is_active: bundle.is_active,
        is_seasonal: bundle.is_seasonal,
        available_from: bundle.available_from,
        available_until: bundle.available_until,
        sort_order: bundle.sort_order,
        created_at: bundle.created_at,
        updated_at: bundle.updated_at,
        items: bundleItems,
        savingsPercent,
      };
    });

    return NextResponse.json<ApiResponse<BundleWithItems[]>>({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Bundles GET error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bundles
 * Admin only - create a new bundle.
 */
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
    const {
      name,
      slug,
      description,
      image_url,
      images,
      bundle_price,
      compare_at_price,
      bundle_type,
      custom_pick_count,
      custom_eligible_product_ids,
      category,
      tags,
      is_seasonal,
      available_from,
      available_until,
      items,
    } = body;

    // Validate required fields
    if (!name || !slug || bundle_price === undefined || bundle_price === null) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Missing required fields: name, slug, bundle_price",
        },
        { status: 400 }
      );
    }

    if (typeof bundle_price !== "number" || bundle_price < 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "bundle_price must be a non-negative number" },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const { data: existingSlug } = await supabase
      .from("product_bundles")
      .select("id")
      .eq("slug", slug)
      .single();

    if (existingSlug) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: `Bundle with slug '${slug}' already exists` },
        { status: 409 }
      );
    }

    // Create the bundle
    const { data: bundle, error: insertError } = await supabase
      .from("product_bundles")
      .insert({
        name,
        slug,
        description: description || null,
        image_url: image_url || null,
        images: images || [],
        bundle_price,
        compare_at_price: compare_at_price || null,
        bundle_type: bundle_type || "fixed",
        custom_pick_count: custom_pick_count || null,
        custom_eligible_product_ids: custom_eligible_product_ids || [],
        category: category || null,
        tags: tags || [],
        is_active: true,
        is_seasonal: is_seasonal || false,
        available_from: available_from || null,
        available_until: available_until || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Bundle insert error:", insertError);
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Failed to create bundle" },
        { status: 500 }
      );
    }

    // Insert bundle items if provided
    if (items && Array.isArray(items) && items.length > 0) {
      const bundleItems = items.map(
        (
          item: {
            product_id: string;
            variant_id?: string;
            quantity?: number;
          },
          index: number
        ) => ({
          bundle_id: bundle.id,
          product_id: item.product_id,
          variant_id: item.variant_id || null,
          quantity: item.quantity || 1,
          sort_order: index,
        })
      );

      const { error: itemsError } = await supabase
        .from("product_bundle_items")
        .insert(bundleItems);

      if (itemsError) {
        console.error("Bundle items insert error:", itemsError);
        // Bundle was created but items failed - log but still return the bundle
      }
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: bundle,
        message: "Bundle created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Bundles POST error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
