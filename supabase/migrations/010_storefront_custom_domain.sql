-- Add custom_domain column to storefronts for white-label domain mapping
ALTER TABLE storefronts ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE;

-- Partial index for efficient domain lookups (only non-null domains)
CREATE INDEX IF NOT EXISTS idx_storefronts_domain
  ON storefronts(custom_domain)
  WHERE custom_domain IS NOT NULL;
