-- Add API key column to vending_machines for machine-to-server authentication.
-- Keys are plain tokens (not hashed) rotated periodically by operations.
ALTER TABLE vending_machines ADD COLUMN IF NOT EXISTS api_key TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_vending_machines_api_key ON vending_machines(api_key);
