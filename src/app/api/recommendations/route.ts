import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/api/auth";
import type { ApiResponse } from "@/types";
import {
  getRecommendations,
  getPersonalizedRecommendations,
  getPopularProducts,
  getFrequentlyBoughtTogether,
  type RecommendedProduct,
} from "@/lib/ai/recommendations";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get("productId");
    const userId = searchParams.get("userId");
    const type = searchParams.get("type");
    const limit = Math.min(
      20,
      Math.max(1, parseInt(searchParams.get("limit") || "6", 10))
    );

    // Product-based recommendations (public)
    if (productId) {
      const includeFrequentlyBought =
        searchParams.get("includeFrequentlyBought") === "true";

      const [similar, frequentlyBought] = await Promise.all([
        getRecommendations(productId, limit),
        includeFrequentlyBought
          ? getFrequentlyBoughtTogether(productId, limit)
          : Promise.resolve([]),
      ]);

      return NextResponse.json<
        ApiResponse<{
          similar: RecommendedProduct[];
          frequentlyBought: RecommendedProduct[];
        }>
      >({
        success: true,
        data: {
          similar,
          frequentlyBought,
        },
      });
    }

    // Personalized recommendations (requires auth)
    if (userId || type === "personalized") {
      const supabase = await createClient();
      const authResult = await getAuthenticatedUser(supabase);

      if (!authResult) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "Authentication required for personalized recommendations" },
          { status: 401 }
        );
      }

      const recommendations = await getPersonalizedRecommendations(
        authResult.user.id,
        limit
      );

      return NextResponse.json<ApiResponse<RecommendedProduct[]>>({
        success: true,
        data: recommendations,
      });
    }

    // Popular products (public)
    if (type === "popular") {
      const popular = await getPopularProducts(limit);
      return NextResponse.json<ApiResponse<RecommendedProduct[]>>({
        success: true,
        data: popular,
      });
    }

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error:
          "Provide productId for similar products, userId/type=personalized for personalized, or type=popular for bestsellers",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Recommendations GET error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
