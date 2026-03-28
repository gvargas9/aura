import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, isAuthError } from "@/lib/api/auth";
import type { ApiResponse } from "@/types";

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();

    // Categories are public - no auth required
    const { data: categories, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("Categories fetch error:", error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Failed to fetch categories" },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: categories || [],
    });
  } catch (error) {
    console.error("Categories GET error:", error);
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
    const { name, slug } = body;

    if (!name || !slug) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Missing required fields: name, slug",
        },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const { data: existing } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", slug)
      .single();

    if (existing) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `Category with slug '${slug}' already exists`,
        },
        { status: 409 }
      );
    }

    const { data: category, error: insertError } = await supabase
      .from("categories")
      .insert({
        name,
        slug,
        description: body.description || null,
        image_url: body.image_url || null,
        parent_id: body.parent_id || null,
        sort_order: body.sort_order || 0,
        is_active: body.is_active !== undefined ? body.is_active : true,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Category insert error:", insertError);
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Failed to create category" },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: category,
        message: "Category created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Categories POST error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
