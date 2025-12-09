-- Part 5: CRM and Vending
-- Run this after Part 4

-- Omnichannel Interaction Log
CREATE TABLE IF NOT EXISTS omni_interaction_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    channel interaction_channel NOT NULL,
    direction VARCHAR(10) NOT NULL,
    content TEXT NOT NULL,
    content_type VARCHAR(50) DEFAULT 'text',
    sentiment_score DECIMAL(3, 2),
    intent VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support Tickets
CREATE TABLE IF NOT EXISTS tickets (
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
CREATE TABLE IF NOT EXISTS ticket_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vending Machines
CREATE TABLE IF NOT EXISTS vending_machines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_serial VARCHAR(100) UNIQUE NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(500) NOT NULL,
    coordinates JSONB,
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
CREATE TABLE IF NOT EXISTS vending_machine_inventory (
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

-- Vending Transactions
CREATE TABLE IF NOT EXISTS vending_transactions (
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

-- QR Code Redemptions
CREATE TABLE IF NOT EXISTS qr_redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    order_id UUID REFERENCES aura_orders(id) ON DELETE SET NULL,
    product_id UUID NOT NULL REFERENCES aura_products(id) ON DELETE RESTRICT,
    machine_id UUID REFERENCES vending_machines(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending',
    expires_at TIMESTAMPTZ NOT NULL,
    redeemed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Storefronts
CREATE TABLE IF NOT EXISTS storefronts (
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

-- Promo Codes
CREATE TABLE IF NOT EXISTS promo_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL,
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
