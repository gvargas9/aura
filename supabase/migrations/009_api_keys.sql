-- Migration: API Keys for B2B partner access
-- Enables organizations to authenticate via API keys for v1 endpoints

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,  -- first 8 chars for identification
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  scopes TEXT[] DEFAULT ARRAY['products:read'],
  rate_limit INTEGER DEFAULT 100,  -- requests per minute
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_org ON api_keys(organization_id);

-- RLS policies for api_keys
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Admins can manage all API keys
CREATE POLICY "Admins can manage api_keys" ON api_keys
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Organization members can view their own keys
CREATE POLICY "Org members can view own api_keys" ON api_keys
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.organization_id = api_keys.organization_id
    )
  );
