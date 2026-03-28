import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, isAuthError } from "@/lib/api/auth";
import type { ApiResponse, PaginatedResponse } from "@/types";
import type { Organization } from "@/types/database";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const auth = await requireAdmin(supabase);

    if (isAuthError(auth)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const searchParams = request.nextUrl.searchParams;

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10))
    );
    const isActive = searchParams.get("isActive");

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("organizations")
      .select("*", { count: "exact" });

    if (isActive === "true") {
      query = query.eq("is_active", true);
    } else if (isActive === "false") {
      query = query.eq("is_active", false);
    }

    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data: items, error, count } = await query;

    if (error) {
      console.error("Organizations fetch error:", error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Failed to fetch organizations" },
        { status: 500 }
      );
    }

    const total = count || 0;
    const response: PaginatedResponse<Organization> = {
      items: items || [],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };

    return NextResponse.json<
      ApiResponse<PaginatedResponse<Organization>>
    >({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Organizations GET error:", error);
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
    const { name, contact_email } = body;

    if (!name || !contact_email) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Missing required fields: name, contact_email",
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contact_email)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    const { data: organization, error: insertError } = await supabase
      .from("organizations")
      .insert({
        name,
        logo_url: body.logo_url || null,
        custom_domain: body.custom_domain || null,
        dealer_tier: body.dealer_tier || "bronze",
        stripe_connect_id: body.stripe_connect_id || null,
        commission_rate: body.commission_rate || 0.1,
        contact_email,
        contact_phone: body.contact_phone || null,
        address: body.address || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Organization insert error:", insertError);
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Failed to create organization" },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<Organization>>(
      {
        success: true,
        data: organization,
        message: "Organization created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Organizations POST error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
