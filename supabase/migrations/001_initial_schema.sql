-- Aura Platform Database Schema
-- Version: 1.0
-- Date: 2025-12-09

-- =====================================================
-- EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- =====================================================
-- ENUMS
-- =====================================================
CREATE TYPE user_role AS ENUM ('customer', 'dealer', 'admin');
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE subscription_status AS ENUM ('active', 'paused', 'cancelled');
CREATE TYPE box_size AS ENUM ('starter', 'voyager', 'bunker');
CREATE TYPE dealer_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum');
CREATE TYPE interaction_channel AS ENUM ('web', 'voice', 'sms', 'email', 'ai_bot');
CREATE TYPE machine_status AS ENUM ('online', 'offline', 'maintenance', 'low_stock');

-- =====================================================
-- TABLES
-- =====================================================

-- Organizations (B2B Tenants)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    custom_domain VARCHAR(255) UNIQUE,
    dealer_tier dealer_tier DEFAULT 'bronze',
    stripe_connect_id VARCHAR(255),
    commission_rate DECIMAL(5, 4) DEFAULT 0.10,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    address JSONB,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Profiles (Extends Supabase Auth)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    role user_role DEFAULT 'customer',
    phone VARCHAR(50),
    address JSONB,
    credits INTEGER DEFAULT 0,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    churn_risk_score DECIMAL(3, 2),
    taste_preferences JSONB DEFAULT '{}',
    dietary_restrictions TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE aura_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    price DECIMAL(10, 2) NOT NULL,
    compare_at_price DECIMAL(10, 2),
    cost_price DECIMAL(10, 2),
    image_url TEXT,
    images TEXT[] DEFAULT '{}',
    stock_level INTEGER DEFAULT 0,
    is_bunker_safe BOOLEAN DEFAULT true,
    shelf_life_months INTEGER DEFAULT 24,
    weight_oz DECIMAL(6, 2),
    nutritional_info JSONB,
    ingredients TEXT,
    allergens TEXT[],
    category VARCHAR(100) NOT NULL,
    tags TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    -- For AI recommendations
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- B2B Pricing Rules (Per Organization)
CREATE TABLE organization_price_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    product_id UUID REFERENCES aura_products(id) ON DELETE CASCADE,
    category VARCHAR(100),
    discount_percentage DECIMAL(5, 2),
    fixed_price DECIMAL(10, 2),
    min_quantity INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT price_rule_target CHECK (product_id IS NOT NULL OR category IS NOT NULL)
);

-- Subscriptions
CREATE TABLE aura_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    box_size box_size NOT NULL,
    box_config UUID[] DEFAULT '{}',
    status subscription_status DEFAULT 'active',
    price DECIMAL(10, 2) NOT NULL,
    next_delivery_date DATE,
    delivery_frequency_days INTEGER DEFAULT 30,
    shipping_address JSONB NOT NULL,
    auto_fill_enabled BOOLEAN DEFAULT false,
    pause_until DATE,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription Selection History
CREATE TABLE subscription_selections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES aura_subscriptions(id) ON DELETE CASCADE,
    delivery_date DATE NOT NULL,
    product_ids UUID[] NOT NULL,
    is_confirmed BOOLEAN DEFAULT false,
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(subscription_id, delivery_date)
);

-- Orders
CREATE TABLE aura_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(20) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES aura_subscriptions(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    dealer_attribution_id UUID,
    stripe_payment_intent_id VARCHAR(255),
    stripe_invoice_id VARCHAR(255),
    status order_status DEFAULT 'pending',
    subtotal DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(10, 2) DEFAULT 0,
    shipping DECIMAL(10, 2) DEFAULT 0,
    tax DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    items JSONB NOT NULL,
    shipping_address JSONB NOT NULL,
    billing_address JSONB,
    tracking_number VARCHAR(255),
    tracking_url TEXT,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    notes TEXT,
    internal_notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items (Normalized)
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES aura_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES aura_products(id) ON DELETE RESTRICT,
    sku VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dealers
CREATE TABLE dealers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    qr_code_url TEXT,
    referral_code VARCHAR(50) UNIQUE NOT NULL,
    commission_earned DECIMAL(10, 2) DEFAULT 0,
    commission_paid DECIMAL(10, 2) DEFAULT 0,
    commission_pending DECIMAL(10, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id, organization_id)
);

-- Commission Transactions
CREATE TABLE commission_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
    order_id UUID REFERENCES aura_orders(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'earned', 'paid', 'adjustment'
    status VARCHAR(50) DEFAULT 'pending',
    stripe_payout_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES aura_products(id) ON DELETE CASCADE,
    warehouse_location VARCHAR(100) DEFAULT 'el_paso',
    quantity INTEGER DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    safety_stock INTEGER DEFAULT 100,
    reorder_point INTEGER DEFAULT 200,
    reorder_quantity INTEGER DEFAULT 500,
    last_restock_date TIMESTAMPTZ,
    next_restock_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, warehouse_location)
);

-- Inventory Transactions
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES aura_products(id) ON DELETE CASCADE,
    warehouse_location VARCHAR(100) NOT NULL,
    quantity_change INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'sale', 'restock', 'adjustment', 'return'
    reference_id UUID,
    reference_type VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gift Cards
CREATE TABLE gift_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    initial_balance DECIMAL(10, 2) NOT NULL,
    current_balance DECIMAL(10, 2) NOT NULL,
    purchased_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    recipient_email VARCHAR(255),
    recipient_name VARCHAR(255),
    message TEXT,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    redeemed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    redeemed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gift Card Transactions (Immutable Ledger)
CREATE TABLE gift_card_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gift_card_id UUID NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
    order_id UUID REFERENCES aura_orders(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    balance_after DECIMAL(10, 2) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'credit', 'debit'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Omnichannel Interaction Log
CREATE TABLE omni_interaction_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    channel interaction_channel NOT NULL,
    direction VARCHAR(10) NOT NULL, -- 'inbound', 'outbound'
    content TEXT NOT NULL,
    content_type VARCHAR(50) DEFAULT 'text', -- 'text', 'audio_transcript', 'system'
    sentiment_score DECIMAL(3, 2),
    intent VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support Tickets
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    order_id UUID REFERENCES aura_orders(id) ON DELETE SET NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'open',
    priority VARCHAR(20) DEFAULT 'medium',
    category VARCHAR(100),
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    resolution TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ticket Comments
CREATE TABLE ticket_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vending Machines
CREATE TABLE vending_machines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_serial VARCHAR(100) UNIQUE NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(500) NOT NULL,
    coordinates JSONB, -- {lat, lng}
    status machine_status DEFAULT 'offline',
    last_checkin TIMESTAMPTZ,
    firmware_version VARCHAR(50),
    config JSONB DEFAULT '{}',
    total_sales DECIMAL(10, 2) DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vending Machine Inventory
CREATE TABLE vending_machine_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_id UUID NOT NULL REFERENCES vending_machines(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES aura_products(id) ON DELETE CASCADE,
    slot_number INTEGER NOT NULL,
    quantity INTEGER DEFAULT 0,
    max_quantity INTEGER DEFAULT 10,
    price DECIMAL(10, 2) NOT NULL,
    last_restocked TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(machine_id, slot_number)
);

-- Vending Machine Transactions
CREATE TABLE vending_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_id UUID NOT NULL REFERENCES vending_machines(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES aura_products(id) ON DELETE RESTRICT,
    slot_number INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    price DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    transaction_ref VARCHAR(255),
    qr_redemption_code VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- QR Code Redemptions (O2O Commerce)
CREATE TABLE qr_redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    order_id UUID REFERENCES aura_orders(id) ON DELETE SET NULL,
    product_id UUID NOT NULL REFERENCES aura_products(id) ON DELETE RESTRICT,
    machine_id UUID REFERENCES vending_machines(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'redeemed', 'expired'
    expires_at TIMESTAMPTZ NOT NULL,
    redeemed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Storefronts (Multi-tenant B2C)
CREATE TABLE storefronts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    domain VARCHAR(255) UNIQUE,
    logo_url TEXT,
    theme JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promo Codes (Beyond Stripe)
CREATE TABLE promo_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed', 'free_shipping'
    discount_value DECIMAL(10, 2) NOT NULL,
    min_order_amount DECIMAL(10, 2),
    max_discount DECIMAL(10, 2),
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    per_user_limit INTEGER DEFAULT 1,
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    applicable_products UUID[],
    applicable_categories VARCHAR(100)[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Profiles
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_organization ON profiles(organization_id);

-- Products
CREATE INDEX idx_products_sku ON aura_products(sku);
CREATE INDEX idx_products_category ON aura_products(category);
CREATE INDEX idx_products_active ON aura_products(is_active) WHERE is_active = true;
CREATE INDEX idx_products_tags ON aura_products USING GIN(tags);

-- Orders
CREATE INDEX idx_orders_user ON aura_orders(user_id);
CREATE INDEX idx_orders_status ON aura_orders(status);
CREATE INDEX idx_orders_created ON aura_orders(created_at DESC);
CREATE INDEX idx_orders_organization ON aura_orders(organization_id);
CREATE INDEX idx_orders_number ON aura_orders(order_number);

-- Subscriptions
CREATE INDEX idx_subscriptions_user ON aura_subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON aura_subscriptions(status);
CREATE INDEX idx_subscriptions_next_delivery ON aura_subscriptions(next_delivery_date);

-- Dealers
CREATE INDEX idx_dealers_referral ON dealers(referral_code);
CREATE INDEX idx_dealers_organization ON dealers(organization_id);

-- Inventory
CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_inventory_low_stock ON inventory(quantity) WHERE quantity < reorder_point;

-- Interactions
CREATE INDEX idx_interactions_user ON omni_interaction_log(user_id);
CREATE INDEX idx_interactions_session ON omni_interaction_log(session_id);
CREATE INDEX idx_interactions_created ON omni_interaction_log(created_at DESC);

-- Vending
CREATE INDEX idx_vending_machines_org ON vending_machines(organization_id);
CREATE INDEX idx_vending_machines_status ON vending_machines(status);
CREATE INDEX idx_vending_inventory_machine ON vending_machine_inventory(machine_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

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

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Decrement inventory on order
CREATE OR REPLACE FUNCTION decrement_inventory()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'processing' AND OLD.status = 'pending' THEN
        -- Parse order items and decrement inventory
        UPDATE inventory
        SET quantity = quantity - (item->>'quantity')::INTEGER,
            reserved_quantity = reserved_quantity - (item->>'quantity')::INTEGER
        FROM jsonb_array_elements(NEW.items) AS item
        WHERE inventory.product_id = (item->>'productId')::UUID;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Updated_at triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON aura_products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON aura_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON aura_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dealers_updated_at
    BEFORE UPDATE ON dealers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at
    BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gift_cards_updated_at
    BEFORE UPDATE ON gift_cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vending_machines_updated_at
    BEFORE UPDATE ON vending_machines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inventory decrement trigger
CREATE TRIGGER order_inventory_decrement
    AFTER UPDATE ON aura_orders
    FOR EACH ROW EXECUTE FUNCTION decrement_inventory();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
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
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Products Policies (Public read)
CREATE POLICY "Anyone can view active products"
    ON aura_products FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage products"
    ON aura_products FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Subscriptions Policies
CREATE POLICY "Users can view own subscriptions"
    ON aura_subscriptions FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can manage own subscriptions"
    ON aura_subscriptions FOR ALL
    USING (user_id = auth.uid());

-- Orders Policies
CREATE POLICY "Users can view own orders"
    ON aura_orders FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create orders"
    ON aura_orders FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Dealers can view attributed orders"
    ON aura_orders FOR SELECT
    USING (
        dealer_attribution_id IN (
            SELECT id FROM dealers WHERE profile_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all orders"
    ON aura_orders FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Dealers Policies
CREATE POLICY "Dealers can view own records"
    ON dealers FOR SELECT
    USING (profile_id = auth.uid());

CREATE POLICY "Admins can manage dealers"
    ON dealers FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Vending Machines Policies
CREATE POLICY "Org members can view their machines"
    ON vending_machines FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default categories
INSERT INTO categories (name, slug, description, sort_order) VALUES
    ('Entrees', 'entrees', 'Complete meal entrees', 1),
    ('Sides', 'sides', 'Side dishes and accompaniments', 2),
    ('Snacks', 'snacks', 'Healthy snacks and energy bites', 3),
    ('Breakfast', 'breakfast', 'Morning meal options', 4),
    ('Beverages', 'beverages', 'Drinks and smoothie bases', 5);

-- Insert sample products
INSERT INTO aura_products (sku, name, short_description, description, price, compare_at_price, category, is_bunker_safe, shelf_life_months, weight_oz, tags, image_url) VALUES
    ('AUR-ENT-001', 'Herb Roasted Chicken', 'Tender chicken with Mediterranean herbs', 'Premium all-natural chicken breast seasoned with rosemary, thyme, and garlic. Shelf-stable for 24 months without refrigeration.', 12.99, 15.99, 'Entrees', true, 24, 8.0, ARRAY['chicken', 'protein', 'gluten-free'], '/images/products/chicken.jpg'),
    ('AUR-ENT-002', 'Beef Stew Classic', 'Hearty beef stew with root vegetables', 'Slow-cooked beef chunks with carrots, potatoes, and savory gravy. No refrigeration needed.', 13.99, 16.99, 'Entrees', true, 24, 10.0, ARRAY['beef', 'comfort-food', 'hearty'], '/images/products/beef-stew.jpg'),
    ('AUR-ENT-003', 'Vegetable Curry', 'Aromatic plant-based curry', 'Rich coconut curry with chickpeas, sweet potato, and spinach. Vegan and gluten-free.', 11.99, 14.99, 'Entrees', true, 24, 9.0, ARRAY['vegan', 'curry', 'plant-based'], '/images/products/curry.jpg'),
    ('AUR-ENT-004', 'Salmon Teriyaki', 'Pacific salmon with teriyaki glaze', 'Wild-caught salmon fillet with house-made teriyaki sauce and sesame seeds.', 15.99, 18.99, 'Entrees', true, 18, 7.0, ARRAY['seafood', 'omega-3', 'asian'], '/images/products/salmon.jpg'),
    ('AUR-SID-001', 'Quinoa Pilaf', 'Fluffy quinoa with herbs', 'Organic quinoa cooked with vegetable broth and fresh herbs.', 7.99, 9.99, 'Sides', true, 24, 6.0, ARRAY['grain', 'vegan', 'protein'], '/images/products/quinoa.jpg'),
    ('AUR-SID-002', 'Mashed Sweet Potato', 'Creamy sweet potato mash', 'Smooth sweet potatoes with a hint of cinnamon and maple.', 6.99, 8.99, 'Sides', true, 24, 6.0, ARRAY['vegetable', 'comfort-food', 'vegan'], '/images/products/sweet-potato.jpg'),
    ('AUR-SNK-001', 'Energy Bites', 'Oat and nut energy bites', 'Packed with oats, almonds, and honey for sustained energy.', 8.99, 10.99, 'Snacks', true, 12, 4.0, ARRAY['snack', 'energy', 'nuts'], '/images/products/energy-bites.jpg'),
    ('AUR-BRK-001', 'Overnight Oats', 'Ready-to-eat breakfast oats', 'Steel-cut oats with chia seeds and dried berries. Just add water.', 7.99, 9.99, 'Breakfast', true, 18, 5.0, ARRAY['breakfast', 'oats', 'fiber'], '/images/products/oats.jpg');

-- Update inventory for products
INSERT INTO inventory (product_id, warehouse_location, quantity, safety_stock, reorder_point, reorder_quantity)
SELECT id, 'el_paso', 1000, 100, 200, 500 FROM aura_products;

COMMIT;
