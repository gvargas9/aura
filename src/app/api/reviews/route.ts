import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, isAuthError } from "@/lib/api/auth";
import type { ApiResponse, ReviewSummary } from "@/types";

interface ReviewWithProfile {
  id: string;
  product_id: string;
  user_id: string;
  order_id: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  taste_rating: number | null;
  value_rating: number | null;
  preparation_ease: number | null;
  images: string[];
  status: string;
  is_verified_purchase: boolean;
  helpful_count: number;
  admin_response: string | null;
  created_at: string;
  updated_at: string;
}

interface ReviewsResponse {
  reviews: ReviewWithProfile[];
  summary: ReviewSummary;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * GET /api/reviews?productId=xxx&page=1&pageSize=10&sortBy=newest
 * Public endpoint - fetches approved reviews for a product.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    const productId = searchParams.get("productId");
    if (!productId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "productId query parameter is required" },
        { status: 400 }
      );
    }

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("pageSize") || "10", 10))
    );
    const sortBy = searchParams.get("sortBy") || "newest";

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Build query for approved reviews
    let query = supabase
      .from("product_reviews")
      .select("*", { count: "exact" })
      .eq("product_id", productId)
      .eq("status", "approved");

    switch (sortBy) {
      case "rating_high":
        query = query.order("rating", { ascending: false });
        break;
      case "rating_low":
        query = query.order("rating", { ascending: true });
        break;
      case "helpful":
        query = query.order("helpful_count", { ascending: false });
        break;
      case "oldest":
        query = query.order("created_at", { ascending: true });
        break;
      case "newest":
      default:
        query = query.order("created_at", { ascending: false });
        break;
    }

    query = query.range(from, to);

    const { data: reviews, error, count } = await query;

    if (error) {
      console.error("Reviews fetch error:", error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Failed to fetch reviews" },
        { status: 500 }
      );
    }

    // Compute aggregate stats from all approved reviews (not just current page)
    const { data: allRatings } = await supabase
      .from("product_reviews")
      .select("rating")
      .eq("product_id", productId)
      .eq("status", "approved");

    const totalCount = count || 0;
    const ratingDistribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    let ratingSum = 0;
    if (allRatings) {
      for (const r of allRatings) {
        const rating = Math.min(5, Math.max(1, Math.round(r.rating)));
        ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
        ratingSum += r.rating;
      }
    }

    const averageRating =
      allRatings && allRatings.length > 0
        ? Math.round((ratingSum / allRatings.length) * 10) / 10
        : 0;

    const summary: ReviewSummary = {
      averageRating,
      totalCount,
      ratingDistribution,
    };

    const response: ReviewsResponse = {
      reviews: (reviews as ReviewWithProfile[]) || [],
      summary,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    };

    return NextResponse.json<ApiResponse<ReviewsResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Reviews GET error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reviews
 * Authenticated endpoint - submit a review for a product.
 * Checks verified purchase status via order history.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const auth = await requireAuth(supabase);

    if (isAuthError(auth)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const body = await request.json();
    const { productId, rating, title, body: reviewBody, tasteRating, valueRating, preparationEase, images } = body;

    // Validate required fields
    if (!productId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "productId is required" },
        { status: 400 }
      );
    }

    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Rating must be a number between 1 and 5" },
        { status: 400 }
      );
    }

    // Validate optional sub-ratings
    for (const [name, val] of [
      ["tasteRating", tasteRating],
      ["valueRating", valueRating],
      ["preparationEase", preparationEase],
    ] as [string, unknown][]) {
      if (val !== undefined && val !== null) {
        if (typeof val !== "number" || val < 1 || val > 5) {
          return NextResponse.json<ApiResponse>(
            { success: false, error: `${name} must be between 1 and 5` },
            { status: 400 }
          );
        }
      }
    }

    // Check product exists
    const { data: product } = await supabase
      .from("aura_products")
      .select("id")
      .eq("id", productId)
      .single();

    if (!product) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    // Check if user already reviewed this product
    const { data: existingReview } = await supabase
      .from("product_reviews")
      .select("id")
      .eq("product_id", productId)
      .eq("user_id", auth.user.id)
      .limit(1);

    if (existingReview && existingReview.length > 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "You have already reviewed this product. You can update your existing review.",
        },
        { status: 409 }
      );
    }

    // Check verified purchase: has the user ordered this product?
    let isVerifiedPurchase = false;
    let verifiedOrderId: string | null = null;

    const { data: orders } = await supabase
      .from("aura_orders")
      .select("id, items")
      .eq("user_id", auth.user.id)
      .eq("status", "delivered");

    if (orders) {
      for (const order of orders) {
        const orderItems = order.items as unknown;
        if (Array.isArray(orderItems)) {
          const found = orderItems.some(
            (item: Record<string, unknown>) =>
              item.productId === productId || item.product_id === productId
          );
          if (found) {
            isVerifiedPurchase = true;
            verifiedOrderId = order.id;
            break;
          }
        }
      }
    }

    const { data: review, error: insertError } = await supabase
      .from("product_reviews")
      .insert({
        product_id: productId,
        user_id: auth.user.id,
        order_id: verifiedOrderId,
        rating: Math.round(rating),
        title: title || null,
        body: reviewBody || null,
        taste_rating: tasteRating ?? null,
        value_rating: valueRating ?? null,
        preparation_ease: preparationEase ?? null,
        images: Array.isArray(images) ? images : [],
        status: "pending",
        is_verified_purchase: isVerifiedPurchase,
        helpful_count: 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Review insert error:", insertError);
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Failed to submit review" },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: review,
        message: "Review submitted and pending approval",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Reviews POST error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
