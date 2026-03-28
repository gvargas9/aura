import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { Product } from "@/types/database";
import { generateProductEmbedding, generateUserTasteProfile } from "./embeddings";

type ServiceClient = SupabaseClient<Database>;

function getServiceClient(): ServiceClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey);
}

interface MatchProductResult {
  id: string;
  name: string;
  similarity: number;
}

/**
 * Call the match_products RPC function.
 * Uses a type cast because this custom function is not in the generated Database types.
 */
async function callMatchProducts(
  supabase: ServiceClient,
  queryEmbedding: string,
  matchThreshold: number,
  matchCount: number
): Promise<MatchProductResult[]> {
  const { data, error } = await (supabase.rpc as Function)(
    "match_products",
    {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
    }
  );

  if (error || !data) {
    return [];
  }

  return data as MatchProductResult[];
}

export interface RecommendedProduct extends Product {
  similarity?: number;
}

/**
 * Get products similar to a given product using cosine similarity on embeddings.
 * Calls the match_products RPC function in Supabase.
 */
export async function getRecommendations(
  productId: string,
  limit: number = 6
): Promise<RecommendedProduct[]> {
  const supabase = getServiceClient();

  // Fetch the source product to get its embedding data
  const { data: sourceProduct, error: sourceError } = await supabase
    .from("aura_products")
    .select("id, name, description, category, tags, dietary_labels")
    .eq("id", productId)
    .single();

  if (sourceError || !sourceProduct) {
    return [];
  }

  // Generate embedding for the source product
  let embedding: number[];
  try {
    embedding = await generateProductEmbedding({
      name: sourceProduct.name,
      description: sourceProduct.description,
      category: sourceProduct.category,
      tags: sourceProduct.tags || [],
      dietary_labels: sourceProduct.dietary_labels || [],
    });
  } catch {
    return [];
  }

  // Use RPC to find similar products via pgvector cosine similarity
  const matches = await callMatchProducts(
    supabase,
    JSON.stringify(embedding),
    0.3,
    limit + 1 // +1 in case the source product is returned
  );

  if (matches.length === 0) {
    return [];
  }

  // Filter out the source product
  const matchedIds = matches
    .filter((m) => m.id !== productId)
    .slice(0, limit);

  if (matchedIds.length === 0) {
    return [];
  }

  const similarityMap = new Map<string, number>();
  for (const m of matchedIds) {
    similarityMap.set(m.id, m.similarity);
  }

  // Fetch full product data for the matched IDs
  const { data: products, error: productsError } = await supabase
    .from("aura_products")
    .select("*")
    .in(
      "id",
      matchedIds.map((m) => m.id)
    )
    .eq("is_active", true);

  if (productsError || !products) {
    return [];
  }

  return products.map((p) => ({
    ...p,
    similarity: similarityMap.get(p.id) ?? 0,
  }));
}

/**
 * Get personalized product recommendations for a user based on their taste profile.
 */
export async function getPersonalizedRecommendations(
  userId: string,
  limit: number = 6
): Promise<RecommendedProduct[]> {
  const supabase = getServiceClient();

  // Generate the user's taste profile from order history
  let tasteProfile: number[] | null;
  try {
    tasteProfile = await generateUserTasteProfile(userId);
  } catch {
    return [];
  }

  if (!tasteProfile) {
    // Fall back to popular products if no order history
    return getPopularProducts(limit);
  }

  // Use RPC to find products matching the taste profile
  const matches = await callMatchProducts(
    supabase,
    JSON.stringify(tasteProfile),
    0.2,
    limit + 10 // Fetch extra to filter already-purchased
  );

  if (matches.length === 0) {
    return getPopularProducts(limit);
  }

  // Get user's previously ordered product IDs to avoid recommending those
  const { data: orders } = await supabase
    .from("aura_orders")
    .select("items")
    .eq("user_id", userId)
    .in("status", ["processing", "shipped", "delivered"]);

  const orderedIds = new Set<string>();
  if (orders) {
    for (const order of orders) {
      const items = order.items as Array<{
        productId?: string;
        product_id?: string;
      }>;
      if (Array.isArray(items)) {
        for (const item of items) {
          const pid = item.productId || item.product_id;
          if (pid) orderedIds.add(pid);
        }
      }
    }
  }

  // Filter out already-ordered products and take top results
  const filteredMatches = matches
    .filter((m) => !orderedIds.has(m.id))
    .slice(0, limit);

  if (filteredMatches.length === 0) {
    return getPopularProducts(limit);
  }

  const similarityMap = new Map<string, number>();
  for (const m of filteredMatches) {
    similarityMap.set(m.id, m.similarity);
  }

  const { data: products, error: productsError } = await supabase
    .from("aura_products")
    .select("*")
    .in(
      "id",
      filteredMatches.map((m) => m.id)
    )
    .eq("is_active", true);

  if (productsError || !products) {
    return [];
  }

  return products.map((p) => ({
    ...p,
    similarity: similarityMap.get(p.id) ?? 0,
  }));
}

/**
 * Smart Aura Fill: picks products to complete a box based on:
 * 1. Complementary to already-selected products (different categories for variety)
 * 2. User's taste profile (if authenticated)
 * 3. Popular products (by order frequency) as fallback
 * 4. Dietary compatibility (don't mix conflicting dietary labels)
 */
export async function getSmartFillProducts(
  selectedProductIds: string[],
  boxSize: number,
  userId?: string
): Promise<Product[]> {
  const supabase = getServiceClient();
  const remainingSlots = boxSize - selectedProductIds.length;

  if (remainingSlots <= 0) {
    return [];
  }

  // Fetch selected products to understand current box composition
  let selectedProducts: Product[] = [];
  if (selectedProductIds.length > 0) {
    const { data } = await supabase
      .from("aura_products")
      .select("*")
      .in("id", selectedProductIds);
    selectedProducts = data || [];
  }

  // Analyze the current box composition
  const selectedCategories = new Set(selectedProducts.map((p) => p.category));
  const selectedDietaryLabels = new Set<string>();
  for (const p of selectedProducts) {
    if (p.dietary_labels) {
      for (const label of p.dietary_labels) {
        selectedDietaryLabels.add(label.toLowerCase());
      }
    }
  }

  // Conflicting dietary label pairs
  const conflicts: Record<string, string[]> = {
    vegan: ["keto"],
    keto: ["vegan"],
  };

  // Determine which dietary labels to avoid
  const avoidLabels = new Set<string>();
  for (const label of selectedDietaryLabels) {
    const conflicting = conflicts[label];
    if (conflicting) {
      for (const c of conflicting) {
        avoidLabels.add(c);
      }
    }
  }

  // Strategy 1: Try personalized recommendations if user is authenticated
  let personalizedIds: string[] = [];
  if (userId) {
    try {
      const personalized = await getPersonalizedRecommendations(
        userId,
        remainingSlots + 10
      );
      personalizedIds = personalized.map((p) => p.id);
    } catch {
      // Fall through to other strategies
    }
  }

  // Strategy 2: Get products from underrepresented categories for variety
  const { data: allProducts, error: allError } = await supabase
    .from("aura_products")
    .select("*")
    .eq("is_active", true)
    .gt("stock_level", 0)
    .not("id", "in", `(${selectedProductIds.length > 0 ? selectedProductIds.join(",") : "00000000-0000-0000-0000-000000000000"})`)
    .order("sort_order", { ascending: true });

  if (allError || !allProducts) {
    return [];
  }

  // Score each product for smart fill
  interface ScoredProduct {
    product: Product;
    score: number;
  }

  const scored: ScoredProduct[] = allProducts.map((product) => {
    let score = 0;

    // Variety bonus: prefer categories not yet in the box
    if (!selectedCategories.has(product.category)) {
      score += 30;
    }

    // Personalization bonus: products the recommendation engine suggests
    if (personalizedIds.includes(product.id)) {
      score += 25;
    }

    // Dietary compatibility: penalize conflicting labels
    const productLabels = (product.dietary_labels || []).map((l) =>
      l.toLowerCase()
    );
    const hasConflict = productLabels.some((l) => avoidLabels.has(l));
    if (hasConflict) {
      score -= 50;
    }

    // Dietary match bonus: prefer products with similar dietary labels
    const matchingLabels = productLabels.filter((l) =>
      selectedDietaryLabels.has(l)
    );
    score += matchingLabels.length * 10;

    // Popularity bonus: use stock_level as a rough proxy
    // (higher initial stock likely means more popular)
    // A more accurate approach would count order frequency
    score += Math.min(product.sort_order ? 10 - product.sort_order : 0, 10);

    // Small random factor to add variety between fills
    score += Math.random() * 5;

    return { product, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Select products, ensuring category variety
  const result: Product[] = [];
  const usedCategories = new Set(selectedCategories);

  // First pass: pick high-scoring products from new categories
  for (const { product } of scored) {
    if (result.length >= remainingSlots) break;
    if (!usedCategories.has(product.category)) {
      result.push(product);
      usedCategories.add(product.category);
    }
  }

  // Second pass: fill remaining slots with best-scoring products
  for (const { product } of scored) {
    if (result.length >= remainingSlots) break;
    if (!result.some((r) => r.id === product.id)) {
      result.push(product);
    }
  }

  return result;
}

/**
 * Get frequently bought together products based on co-occurrence in orders.
 */
export async function getFrequentlyBoughtTogether(
  productId: string,
  limit: number = 4
): Promise<Product[]> {
  const supabase = getServiceClient();

  // Fetch orders that contain this product
  const { data: orders, error: ordersError } = await supabase
    .from("aura_orders")
    .select("items")
    .in("status", ["processing", "shipped", "delivered"]);

  if (ordersError || !orders) {
    return [];
  }

  // Count co-occurrence of products with the target product
  const coOccurrence = new Map<string, number>();

  for (const order of orders) {
    const items = order.items as Array<{
      productId?: string;
      product_id?: string;
    }>;
    if (!Array.isArray(items)) continue;

    const orderProductIds = items
      .map((item) => item.productId || item.product_id)
      .filter(Boolean) as string[];

    // Only process orders that contain our target product
    if (!orderProductIds.includes(productId)) continue;

    // Count co-occurrences
    for (const pid of orderProductIds) {
      if (pid !== productId) {
        coOccurrence.set(pid, (coOccurrence.get(pid) || 0) + 1);
      }
    }
  }

  if (coOccurrence.size === 0) {
    return [];
  }

  // Sort by frequency and take top results
  const topIds = Array.from(coOccurrence.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  // Fetch full product data
  const { data: products, error: productsError } = await supabase
    .from("aura_products")
    .select("*")
    .in("id", topIds)
    .eq("is_active", true);

  if (productsError || !products) {
    return [];
  }

  // Sort by co-occurrence frequency
  return products.sort((a, b) => {
    const aCount = coOccurrence.get(a.id) || 0;
    const bCount = coOccurrence.get(b.id) || 0;
    return bCount - aCount;
  });
}

/**
 * Get popular products by order frequency as a fallback recommendation strategy.
 */
export async function getPopularProducts(
  limit: number = 6
): Promise<Product[]> {
  const supabase = getServiceClient();

  // Fetch all delivered/shipped orders to count product frequency
  const { data: orders, error: ordersError } = await supabase
    .from("aura_orders")
    .select("items")
    .in("status", ["processing", "shipped", "delivered"])
    .order("created_at", { ascending: false })
    .limit(200);

  const productCounts = new Map<string, number>();

  if (!ordersError && orders) {
    for (const order of orders) {
      const items = order.items as Array<{
        productId?: string;
        product_id?: string;
        quantity?: number;
      }>;
      if (!Array.isArray(items)) continue;

      for (const item of items) {
        const pid = item.productId || item.product_id;
        if (pid) {
          productCounts.set(
            pid,
            (productCounts.get(pid) || 0) + (item.quantity || 1)
          );
        }
      }
    }
  }

  if (productCounts.size === 0) {
    // Fallback: return products sorted by sort_order
    const { data: products } = await supabase
      .from("aura_products")
      .select("*")
      .eq("is_active", true)
      .gt("stock_level", 0)
      .order("sort_order", { ascending: true })
      .limit(limit);

    return products || [];
  }

  const topIds = Array.from(productCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  const { data: products } = await supabase
    .from("aura_products")
    .select("*")
    .in("id", topIds)
    .eq("is_active", true);

  if (!products) return [];

  // Sort by popularity
  return products.sort((a, b) => {
    return (productCounts.get(b.id) || 0) - (productCounts.get(a.id) || 0);
  });
}
