-- Part 2: Core Tables
-- Run this after Part 1

-- Organizations (B2B Tenants)
CREATE TABLE IF NOT EXISTS organizations (
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
CREATE TABLE IF NOT EXISTS profiles (
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
CREATE TABLE IF NOT EXISTS aura_products (
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
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
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

-- Organization Price Rules
CREATE TABLE IF NOT EXISTS organization_price_rules (
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
