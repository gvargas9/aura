import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, isAuthError } from "@/lib/api/auth";
import type { ApiResponse, PaginatedResponse } from "@/types";
import type { Dealer } from "@/types/database";

function generateReferralCode(length: number = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

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
      .from("dealers")
      .select(
        "*, profiles(id, email, full_name), organizations(id, name, dealer_tier)",
        { count: "exact" }
      );

    if (isActive === "true") {
      query = query.eq("is_active", true);
    } else if (isActive === "false") {
      query = query.eq("is_active", false);
    }

    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data: items, error, count } = await query;

    if (error) {
      console.error("Dealers fetch error:", error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Failed to fetch dealers" },
        { status: 500 }
      );
    }

    const total = count || 0;

    return NextResponse.json<ApiResponse<PaginatedResponse<unknown>>>({
      success: true,
      data: {
        items: items || [],
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Dealers GET error:", error);
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
    const { profile_id, organization_id } = body;

    if (!profile_id || !organization_id) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Missing required fields: profile_id, organization_id",
        },
        { status: 400 }
      );
    }

    // Verify profile exists
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", profile_id)
      .single();

    if (!profileData) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    // Verify organization exists
    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("id", organization_id)
      .single();

    if (!org) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Organization not found" },
        { status: 404 }
      );
    }

    // Check if dealer already exists for this profile
    const { data: existingDealer } = await supabase
      .from("dealers")
      .select("id")
      .eq("profile_id", profile_id)
      .single();

    if (existingDealer) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "A dealer record already exists for this profile",
        },
        { status: 409 }
      );
    }

    // Generate referral code if not provided, ensure uniqueness
    let referralCode = body.referral_code || generateReferralCode();
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      const { data: codeExists } = await supabase
        .from("dealers")
        .select("id")
        .eq("referral_code", referralCode)
        .single();

      if (!codeExists) break;

      referralCode = generateReferralCode();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Failed to generate a unique referral code",
        },
        { status: 500 }
      );
    }

    const { data: dealer, error: insertError } = await supabase
      .from("dealers")
      .insert({
        profile_id,
        organization_id,
        referral_code: referralCode,
        qr_code_url: body.qr_code_url || null,
        commission_earned: 0,
        commission_paid: 0,
        is_active: body.is_active !== undefined ? body.is_active : true,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Dealer insert error:", insertError);
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Failed to create dealer" },
        { status: 500 }
      );
    }

    // Update the profile role to dealer if it's currently customer
    if (profileData.role === "customer") {
      await supabase
        .from("profiles")
        .update({
          role: "dealer",
          organization_id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile_id);
    }

    return NextResponse.json<ApiResponse<Dealer>>(
      {
        success: true,
        data: dealer,
        message: "Dealer created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Dealers POST error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
