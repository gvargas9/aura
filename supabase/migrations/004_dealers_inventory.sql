-- Part 4: Dealers and Inventory
-- Run this after Part 3

-- Dealers
CREATE TABLE IF NOT EXISTS dealers (
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
CREATE TABLE IF NOT EXISTS commission_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
    order_id UUID REFERENCES aura_orders(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    stripe_payout_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory
CREATE TABLE IF NOT EXISTS inventory (
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
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES aura_products(id) ON DELETE CASCADE,
    warehouse_location VARCHAR(100) NOT NULL,
    quantity_change INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    reference_id UUID,
    reference_type VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gift Cards
CREATE TABLE IF NOT EXISTS gift_cards (
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

-- Gift Card Transactions
CREATE TABLE IF NOT EXISTS gift_card_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gift_card_id UUID NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
    order_id UUID REFERENCES aura_orders(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    balance_after DECIMAL(10, 2) NOT NULL,
    type VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
