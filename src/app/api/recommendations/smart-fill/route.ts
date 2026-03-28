import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/api/auth";
import type { ApiResponse } from "@/types";
import type { Product } from "@/types/database";
import { getSmartFillProducts } from "@/lib/ai/recommendations";

interface SmartFillRequest {
  selectedProductIds: string[];
  boxSize: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: SmartFillRequest = await request.json();

    // Validate input
    if (!body.selectedProductIds || !Array.isArray(body.selectedProductIds)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "selectedProductIds must be an array" },
        { status: 400 }
      );
    }

    if (!body.boxSize || typeof body.boxSize !== "number" || body.boxSize < 1) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "boxSize must be a positive number" },
        { status: 400 }
      );
    }

    const validBoxSizes = [8, 12, 24];
    if (!validBoxSizes.includes(body.boxSize)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "boxSize must be 8, 12, or 24" },
        { status: 400 }
      );
    }

    if (body.selectedProductIds.length >= body.boxSize) {
      return NextResponse.json<ApiResponse<Product[]>>({
        success: true,
        data: [],
        message: "Box is already full",
      });
    }

    // Check for authenticated user (optional, improves recommendations)
    let userId: string | undefined;
    try {
      const supabase = await createClient();
      const authResult = await getAuthenticatedUser(supabase);
      if (authResult) {
        userId = authResult.user.id;
      }
    } catch {
      // Authentication is optional for smart fill
    }

    const products = await getSmartFillProducts(
      body.selectedProductIds,
      body.boxSize,
      userId
    );

    return NextResponse.json<ApiResponse<Product[]>>({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Smart fill POST error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
