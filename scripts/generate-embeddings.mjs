/**
 * One-time script to generate embeddings for all products.
 *
 * Usage:
 *   export $(grep -v '^#' .env.local | grep -v '^\s*$' | xargs) && node scripts/generate-embeddings.mjs
 */

const GEMINI_EMBEDDING_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent";

function buildProductText(product) {
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

async function callGeminiEmbedding(text) {
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
  const rawValues = data?.embedding?.values;

  if (!rawValues || !Array.isArray(rawValues)) {
    throw new Error("Unexpected Gemini embedding response structure");
  }

  // Truncate to 1536 dimensions (pgvector column size)
  return rawValues.slice(0, 1536);
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required."
    );
    console.error(
      "Usage: export $(grep -v '^#' .env.local | grep -v '^\\s*$' | xargs) && node scripts/generate-embeddings.mjs"
    );
    process.exit(1);
  }

  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    console.error("Error: GOOGLE_GEMINI_API_KEY environment variable is required.");
    process.exit(1);
  }

  // Use fetch-based Supabase REST API directly (no npm dependency needed)
  const headers = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  };

  // Fetch all active products
  console.log("Fetching products from Supabase...");
  const fetchRes = await fetch(
    `${supabaseUrl}/rest/v1/aura_products?select=id,name,description,category,tags,dietary_labels&is_active=eq.true`,
    { headers }
  );

  if (!fetchRes.ok) {
    console.error(`Failed to fetch products: ${fetchRes.status} ${await fetchRes.text()}`);
    process.exit(1);
  }

  const products = await fetchRes.json();
  console.log(`Found ${products.length} active products.\n`);

  if (products.length === 0) {
    console.log("No products to process.");
    return;
  }

  let successCount = 0;
  let errorCount = 0;
  const startTime = Date.now();

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const progress = `[${i + 1}/${products.length}]`;

    try {
      const text = buildProductText(product);
      const embedding = await callGeminiEmbedding(text);

      // Update the product's embedding column via REST API
      const updateRes = await fetch(
        `${supabaseUrl}/rest/v1/aura_products?id=eq.${product.id}`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({ embedding: JSON.stringify(embedding) }),
        }
      );

      if (!updateRes.ok) {
        const errText = await updateRes.text();
        console.error(`${progress} FAILED to update "${product.name}": ${errText}`);
        errorCount++;
      } else {
        successCount++;
        console.log(`${progress} OK: "${product.name}" (${embedding.length} dims)`);
      }

      // Rate limit: small delay between API calls
      if (i < products.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 150));
      }
    } catch (err) {
      console.error(`${progress} ERROR for "${product.name}": ${err.message}`);
      errorCount++;
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Embedding generation complete in ${elapsed}s`);
  console.log(`  Success: ${successCount}`);
  console.log(`  Failed:  ${errorCount}`);
  console.log(`  Total:   ${products.length}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
