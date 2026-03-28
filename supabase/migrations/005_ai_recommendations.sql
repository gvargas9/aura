-- Migration: AI Recommendations - match_products RPC function
-- Requires pgvector extension (already enabled)

-- Create the similarity search function for product recommendations
CREATE OR REPLACE FUNCTION match_products(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (id uuid, name text, similarity float)
AS $$
  SELECT
    id,
    name,
    1 - (embedding <=> query_embedding) AS similarity
  FROM aura_products
  WHERE embedding IS NOT NULL
    AND is_active = true
    AND 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$ LANGUAGE sql STABLE;

-- Create an index on the embedding column for faster similarity search
-- Using ivfflat for approximate nearest neighbor search
-- The number of lists should be sqrt(n) where n is the number of rows
-- Starting with 10 lists, adjust as the product catalog grows
CREATE INDEX IF NOT EXISTS idx_aura_products_embedding
  ON aura_products
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 10);
