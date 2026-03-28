import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, isAuthError } from "@/lib/api/auth";
import type { ApiResponse, PaginatedResponse } from "@/types";
import type { GiftCard } from "@/types/database";

function generateGiftCardCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const segments = 4;
  const segmentLength = 4;
  const parts: string[] = [];

  for (let s = 0; s < segments; s++) {
    let segment = "";
    for (let i = 0; i < segmentLength; i++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    parts.push(segment);
  }

  return parts.join("-");
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
      .from("gift_cards")
      .select("*", { count: "exact" });

    if (isActive === "true") {
      query = query.eq("is_active", true);
    } else if (isActive === "false") {
      query = query.eq("is_active", false);
    }

    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data: items, error, count } = await query;

    if (error) {
      console.error("Gift cards fetch error:", error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Failed to fetch gift cards" },
        { status: 500 }
      );
    }

    const total = count || 0;
    const response: PaginatedResponse<GiftCard> = {
      items: items || [],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };

    return NextResponse.json<ApiResponse<PaginatedResponse<GiftCard>>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Gift cards GET error:", error);
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
    const { initial_balance } = body;

    if (
      initial_balance === undefined ||
      typeof initial_balance !== "number" ||
      initial_balance <= 0
    ) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "initial_balance must be a positive number",
        },
        { status: 400 }
      );
    }

    // Generate a unique code, retrying on collision
    let code = body.code || generateGiftCardCode();
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      const { data: existing } = await supabase
        .from("gift_cards")
        .select("id")
        .eq("code", code)
        .single();

      if (!existing) break;

      code = generateGiftCardCode();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Failed to generate a unique gift card code",
        },
        { status: 500 }
      );
    }

    const { data: giftCard, error: insertError } = await supabase
      .from("gift_cards")
      .insert({
        code,
        initial_balance,
        current_balance: initial_balance,
        purchased_by: body.purchased_by || auth.profile.id,
        recipient_email: body.recipient_email || null,
        is_active: true,
        expires_at: body.expires_at || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Gift card insert error:", insertError);
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Failed to create gift card" },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<GiftCard>>(
      {
        success: true,
        data: giftCard,
        message: "Gift card created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Gift cards POST error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
