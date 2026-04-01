-- ==========================================================================
-- Migration 011: Sample Allocations for Business Manager CRM Integration
-- ==========================================================================

-- Sample allocations: track product samples given to dealers
CREATE TABLE IF NOT EXISTS sample_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES aura_products(id) ON DELETE RESTRICT,
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE RESTRICT,
  quantity_allocated INT NOT NULL DEFAULT 0,
  quantity_distributed INT NOT NULL DEFAULT 0,
  quantity_returned INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'fully_distributed', 'expired', 'returned', 'cancelled')),
  lead_external_id TEXT,
  lead_name TEXT,
  lead_email TEXT,
  notes TEXT,
  expires_at TIMESTAMPTZ,
  allocated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- quantity_distributed + quantity_returned must never exceed quantity_allocated
  CONSTRAINT chk_quantity_bounds
    CHECK (quantity_distributed + quantity_returned <= quantity_allocated)
);

-- Sample events: audit trail for every sample movement
CREATE TABLE IF NOT EXISTS sample_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  allocation_id UUID NOT NULL REFERENCES sample_allocations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL
    CHECK (event_type IN ('allocated', 'distributed', 'returned', 'expired', 'cancelled', 'note')),
  quantity INT NOT NULL DEFAULT 0,
  from_holder TEXT,
  to_holder TEXT,
  notes TEXT,
  performed_by UUID REFERENCES profiles(id),
  business-manager_activity_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sample_allocations_dealer_id ON sample_allocations(dealer_id);
CREATE INDEX IF NOT EXISTS idx_sample_allocations_product_id ON sample_allocations(product_id);
CREATE INDEX IF NOT EXISTS idx_sample_allocations_status ON sample_allocations(status);
CREATE INDEX IF NOT EXISTS idx_sample_events_allocation_id ON sample_events(allocation_id);

-- RLS
ALTER TABLE sample_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sample_events ENABLE ROW LEVEL SECURITY;

-- Admins: full access to sample_allocations
CREATE POLICY "Admins full access on sample_allocations"
  ON sample_allocations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Dealers: read their own allocations
CREATE POLICY "Dealers read own sample_allocations"
  ON sample_allocations
  FOR SELECT
  TO authenticated
  USING (
    dealer_id IN (
      SELECT id FROM dealers WHERE profile_id = auth.uid()
    )
  );

-- Admins: full access to sample_events
CREATE POLICY "Admins full access on sample_events"
  ON sample_events
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Dealers: read events for their own allocations
CREATE POLICY "Dealers read own sample_events"
  ON sample_events
  FOR SELECT
  TO authenticated
  USING (
    allocation_id IN (
      SELECT sa.id FROM sample_allocations sa
      JOIN dealers d ON d.id = sa.dealer_id
      WHERE d.profile_id = auth.uid()
    )
  );

-- Dealers: insert events for their own allocations (distribute/return)
CREATE POLICY "Dealers insert own sample_events"
  ON sample_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    allocation_id IN (
      SELECT sa.id FROM sample_allocations sa
      JOIN dealers d ON d.id = sa.dealer_id
      WHERE d.profile_id = auth.uid()
    )
  );
