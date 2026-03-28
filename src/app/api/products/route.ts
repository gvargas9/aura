import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, isAuthError } from "@/lib/api/auth";
import type { ApiResponse, PaginatedResponse } from "@/types";
import type { Product } from "@/types/database";

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

    const { data: items, error, count } = await query;

    if (error) {
      console.error("Products fetch error:", error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Failed to fetch products" },
        { status: 500 }
      );
    }

    const total = count || 0;
    const response: PaginatedResponse<Product> = {
      items: items || [],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };

    return NextResponse.json<ApiResponse<PaginatedResponse<Product>>>({
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

    if (typeof price !== "number" || price < 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Price must be a non-negative number" },
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
        name,
        description: body.description || null,
        short_description: body.short_description || null,
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
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
