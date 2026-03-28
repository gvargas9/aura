import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        data: { products: [], recipes: [], categories: [] },
      });
    }

    const supabase = await createClient();
    const searchPattern = `%${query}%`;

    // Search products, recipes, and extract categories in parallel
    const [productsResult, recipesResult, categoriesResult] = await Promise.all(
      [
        supabase
          .from("aura_products")
          .select(
            "id, name, price, compare_at_price, image_url, category, is_bunker_safe, short_description, dietary_labels"
          )
          .eq("is_active", true)
          .or(
            `name.ilike.${searchPattern},description.ilike.${searchPattern},category.ilike.${searchPattern},short_description.ilike.${searchPattern}`
          )
          .limit(5),
        supabase
          .from("product_recipes")
          .select(
            "id, product_id, title, description, chef_name, image_url, difficulty, prep_time_minutes, cook_time_minutes"
          )
          .or(
            `title.ilike.${searchPattern},description.ilike.${searchPattern},chef_name.ilike.${searchPattern}`
          )
          .limit(5),
        supabase
          .from("aura_products")
          .select("category")
          .eq("is_active", true)
          .ilike("category", searchPattern),
      ]
    );

    // Deduplicate categories
    const uniqueCategories = [
      ...new Set(
        (categoriesResult.data || []).map(
          (c: { category: string }) => c.category
        )
      ),
    ].slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        products: productsResult.data || [],
        recipes: recipesResult.data || [],
        categories: uniqueCategories,
      },
    });
  } catch (err) {
    console.error("[Search] Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
