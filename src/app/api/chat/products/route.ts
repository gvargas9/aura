import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types";

interface ProductSearchResult {
  id: string;
  name: string;
  price: number;
  category: string;
  dietary_labels: string[];
  short_description: string | null;
  image_url: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    const q = searchParams.get("q") || "";
    const dietary = searchParams.get("dietary") || "";
    const category = searchParams.get("category") || "";

    let query = supabase
      .from("aura_products")
      .select(
        "id, name, price, category, dietary_labels, short_description, image_url"
      )
      .eq("is_active", true);

    if (q) {
      query = query.or(
        `name.ilike.%${q}%,description.ilike.%${q}%,tags.cs.{${q}}`
      );
    }

    if (dietary) {
      const labels = dietary
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean);
      for (const label of labels) {
        query = query.contains("dietary_labels", [label]);
      }
    }

    if (category) {
      query = query.ilike("category", `%${category}%`);
    }

    query = query.order("sort_order", { ascending: true }).limit(5);

    const { data: products, error } = await query;

    if (error) {
      console.error("Chat product search error:", error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Failed to search products" },
        { status: 500 }
      );
    }

    const results: ProductSearchResult[] = (products || []).map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      category: p.category,
      dietary_labels: p.dietary_labels || [],
      short_description: p.short_description,
      image_url: p.image_url,
    }));

    return NextResponse.json<ApiResponse<ProductSearchResult[]>>({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Chat products GET error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
