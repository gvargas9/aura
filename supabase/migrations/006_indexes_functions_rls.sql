-- Part 6: Indexes, Functions, Triggers, RLS
-- Run this after Part 5

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_organization ON profiles(organization_id);

CREATE INDEX IF NOT EXISTS idx_products_sku ON aura_products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON aura_products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON aura_products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_tags ON aura_products USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_orders_user ON aura_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON aura_orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON aura_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_organization ON aura_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_orders_number ON aura_orders(order_number);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON aura_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON aura_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_delivery ON aura_subscriptions(next_delivery_date);

CREATE INDEX IF NOT EXISTS idx_dealers_referral ON dealers(referral_code);
CREATE INDEX IF NOT EXISTS idx_dealers_organization ON dealers(organization_id);

CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);

CREATE INDEX IF NOT EXISTS idx_interactions_user ON omni_interaction_log(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_session ON omni_interaction_log(session_id);
CREATE INDEX IF NOT EXISTS idx_interactions_created ON omni_interaction_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vending_machines_org ON vending_machines(organization_id);
CREATE INDEX IF NOT EXISTS idx_vending_machines_status ON vending_machines(status);
CREATE INDEX IF NOT EXISTS idx_vending_inventory_machine ON vending_machine_inventory(machine_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
BEGIN
    new_number := 'AUR-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
                  LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
BEGIN
    new_number := 'TKT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
                  LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON aura_products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON aura_products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON aura_subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON aura_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON aura_orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON aura_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dealers_updated_at ON dealers;
CREATE TRIGGER update_dealers_updated_at
    BEFORE UPDATE ON dealers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inventory_updated_at ON inventory;
CREATE TRIGGER update_inventory_updated_at
    BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gift_cards_updated_at ON gift_cards;
CREATE TRIGGER update_gift_cards_updated_at
    BEFORE UPDATE ON gift_cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;
CREATE TRIGGER update_tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vending_machines_updated_at ON vending_machines;
CREATE TRIGGER update_vending_machines_updated_at
    BEFORE UPDATE ON vending_machines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE aura_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE aura_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE aura_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE omni_interaction_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE vending_machines ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Products Policies (Public read)
DROP POLICY IF EXISTS "Anyone can view active products" ON aura_products;
CREATE POLICY "Anyone can view active products"
    ON aura_products FOR SELECT
    USING (is_active = true);

-- Subscriptions Policies
DROP POLICY IF EXISTS "Users can view own subscriptions" ON aura_subscriptions;
CREATE POLICY "Users can view own subscriptions"
    ON aura_subscriptions FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own subscriptions" ON aura_subscriptions;
CREATE POLICY "Users can create own subscriptions"
    ON aura_subscriptions FOR INSERT
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own subscriptions" ON aura_subscriptions;
CREATE POLICY "Users can update own subscriptions"
    ON aura_subscriptions FOR UPDATE
    USING (user_id = auth.uid());

-- Orders Policies
DROP POLICY IF EXISTS "Users can view own orders" ON aura_orders;
CREATE POLICY "Users can view own orders"
    ON aura_orders FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create orders" ON aura_orders;
CREATE POLICY "Users can create orders"
    ON aura_orders FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Dealers Policies
DROP POLICY IF EXISTS "Dealers can view own records" ON dealers;
CREATE POLICY "Dealers can view own records"
    ON dealers FOR SELECT
    USING (profile_id = auth.uid());

-- Vending Machines Policies
DROP POLICY IF EXISTS "Org members can view their machines" ON vending_machines;
CREATE POLICY "Org members can view their machines"
    ON vending_machines FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );
