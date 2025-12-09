-- Part 3: Subscriptions and Orders
-- Run this after Part 2

-- Subscriptions
CREATE TABLE IF NOT EXISTS aura_subscriptions (
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

-- Subscription Selections
CREATE TABLE IF NOT EXISTS subscription_selections (
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
CREATE TABLE IF NOT EXISTS aura_orders (
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

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
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
