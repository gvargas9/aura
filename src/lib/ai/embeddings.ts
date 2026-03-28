import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const GEMINI_EMBEDDING_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent";

interface ProductForEmbedding {
  name: string;
  description: string | null;
  category: string;
  tags: string[];
  dietary_labels: string[];
}

/**
 * Build a text representation of a product suitable for embedding generation.
 */
function buildProductText(product: ProductForEmbedding): string {
  const parts = [`Product: ${product.name}.`, `Category: ${product.category}.`];

  if (product.description) {
    parts.push(product.description);
  }

  if (product.tags && product.tags.length > 0) {
    parts.push(`Tags: ${product.tags.join(", ")}.`);
  }

  if (product.dietary_labels && product.dietary_labels.length > 0) {
    parts.push(`Dietary: ${product.dietary_labels.join(", ")}.`);
  }

  return parts.join(" ");
}

/**
 * Call Gemini text-embedding-004 to generate a 1536-dimensional embedding vector.
 */
async function callGeminiEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GEMINI_API_KEY environment variable is not set");
  }

  const response = await fetch(`${GEMINI_EMBEDDING_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "models/text-embedding-004",
      content: {
        parts: [{ text }],
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Gemini embedding API error (${response.status}): ${errorBody}`
    );
  }

  const data = await response.json();
  const rawValues: number[] = data?.embedding?.values;

  if (!rawValues || !Array.isArray(rawValues)) {
    throw new Error("Unexpected Gemini embedding response structure");
  }

  // Truncate to 1536 dimensions (pgvector column size)
  const values = rawValues.slice(0, 1536);
  return values;
}

/**
 * Generate an embedding for a single product and return the vector.
 */
export async function generateProductEmbedding(
  product: ProductForEmbedding
): Promise<number[]> {
  const text = buildProductText(product);
  return callGeminiEmbedding(text);
}

/**
 * Generate embeddings for all products that don't have one yet,
 * and store them in the aura_products.embedding column.
 * Uses the service role key to bypass RLS.
 */
export async function generateAllProductEmbeddings(): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"
    );
  }

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey);

  // Fetch all active products without embeddings
  const { data: products, error } = await supabase
    .from("aura_products")
    .select("id, name, description, category, tags, dietary_labels")
    .eq("is_active", true);

  if (error) {
    throw new Error(`Failed to fetch products: ${error.message}`);
  }

  if (!products || products.length === 0) {
    console.log("No products found to generate embeddings for.");
    return;
  }

  console.log(`Generating embeddings for ${products.length} products...`);

  let successCount = 0;
  let errorCount = 0;

  for (const product of products) {
    try {
      const embedding = await generateProductEmbedding({
        name: product.name,
        description: product.description,
        category: product.category,
        tags: product.tags || [],
        dietary_labels: product.dietary_labels || [],
      });

      // Store the embedding as a JSON string of the vector array
      // pgvector accepts this format
      const { error: updateError } = await supabase
        .from("aura_products")
        .update({ embedding: JSON.stringify(embedding) } as Record<string, unknown>)
        .eq("id", product.id);

      if (updateError) {
        console.error(
          `Failed to update embedding for "${product.name}": ${updateError.message}`
        );
        errorCount++;
      } else {
        successCount++;
        console.log(
          `[${successCount}/${products.length}] Generated embedding for "${product.name}"`
        );
      }

      // Rate limit: 100ms delay between API calls
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (err) {
      console.error(
        `Error generating embedding for "${product.name}":`,
        err instanceof Error ? err.message : err
      );
      errorCount++;
    }
  }

  console.log(
    `\nEmbedding generation complete: ${successCount} succeeded, ${errorCount} failed out of ${products.length} total.`
  );
}

/**
 * Generate a taste profile embedding for a user based on their order history.
 * The taste profile is the average of all product embeddings they have ordered.
 */
export async function generateUserTasteProfile(
  userId: string
): Promise<number[] | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"
    );
  }

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey);

  // Fetch user's order history
  const { data: orders, error } = await supabase
    .from("aura_orders")
    .select("items")
    .eq("user_id", userId)
    .in("status", ["processing", "shipped", "delivered"]);

  if (error || !orders || orders.length === 0) {
    return null;
  }

  // Extract product IDs from order items
  const productIdSet = new Set<string>();
  for (const order of orders) {
    const items = order.items as Array<{ productId?: string; product_id?: string }>;
    if (Array.isArray(items)) {
      for (const item of items) {
        const pid = item.productId || item.product_id;
        if (pid) productIdSet.add(pid);
      }
    }
  }

  if (productIdSet.size === 0) {
    return null;
  }

  // Fetch products that the user has ordered, along with their data for embedding
  const { data: products, error: productsError } = await supabase
    .from("aura_products")
    .select("id, name, description, category, tags, dietary_labels")
    .in("id", Array.from(productIdSet));

  if (productsError || !products || products.length === 0) {
    return null;
  }

  // Generate embeddings for these products and average them
  const embeddings: number[][] = [];

  for (const product of products) {
    try {
      const embedding = await generateProductEmbedding({
        name: product.name,
        description: product.description,
        category: product.category,
        tags: product.tags || [],
        dietary_labels: product.dietary_labels || [],
      });
      embeddings.push(embedding);
    } catch {
      // Skip products that fail to generate embeddings
      continue;
    }
  }

  if (embeddings.length === 0) {
    return null;
  }

  // Average all embeddings to create the taste profile
  const dimensions = embeddings[0].length;
  const averaged = new Array(dimensions).fill(0);

  for (const emb of embeddings) {
    for (let i = 0; i < dimensions; i++) {
      averaged[i] += emb[i];
    }
  }

  for (let i = 0; i < dimensions; i++) {
    averaged[i] /= embeddings.length;
  }

  return averaged;
}
