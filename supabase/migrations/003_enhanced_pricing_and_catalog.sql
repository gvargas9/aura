-- Enhanced Pricing, Product Catalog, and Promotions Schema
-- Version: 3.0
-- Date: 2026-03-27

-- =====================================================
-- ENUMS (idempotent)
-- =====================================================
DO $$ BEGIN
    CREATE TYPE bundle_type AS ENUM ('fixed', 'custom');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE relationship_type AS ENUM ('pairs_with', 'also_bought', 'upgrade');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE discount_type AS ENUM ('percentage', 'fixed_amount', 'free_shipping', 'bogo', 'bundle', 'volume');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE trigger_type AS ENUM ('automatic', 'coupon_code', 'referral');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE credit_type AS ENUM ('earned_purchase', 'earned_referral', 'earned_review', 'redeemed', 'expired', 'adjustment');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE referral_status AS ENUM ('pending', 'signed_up', 'converted', 'rewarded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE gift_type AS ENUM ('box', 'subscription', 'gift_card');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE contract_status AS ENUM ('draft', 'active', 'expired', 'terminated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- NEW TABLES
-- =====================================================

-- 1. Product Variants
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES aura_products(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    size VARCHAR(100),
    flavor VARCHAR(100),
    pack_count INTEGER,
    price NUMERIC(10,2) NOT NULL,
    compare_at_price NUMERIC(10,2),
    cost_price NUMERIC(10,2),
    weight_oz NUMERIC(8,2),
    stock_level INTEGER NOT NULL DEFAULT 0,
    barcode VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Product Bundles
CREATE TABLE IF NOT EXISTS product_bundles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    images TEXT[] DEFAULT '{}',
    bundle_price NUMERIC(10,2) NOT NULL,
    compare_at_price NUMERIC(10,2),
    bundle_type bundle_type NOT NULL DEFAULT 'fixed',
    custom_pick_count INTEGER,
    custom_eligible_product_ids UUID[] DEFAULT '{}',
    category VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    is_seasonal BOOLEAN DEFAULT false,
    available_from TIMESTAMPTZ,
    available_until TIMESTAMPTZ,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Product Bundle Items
CREATE TABLE IF NOT EXISTS product_bundle_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bundle_id UUID NOT NULL REFERENCES product_bundles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES aura_products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER DEFAULT 0
);

-- 4. Product Nutrition
CREATE TABLE IF NOT EXISTS product_nutrition (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES aura_products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    serving_size VARCHAR(100),
    servings_per_container NUMERIC(6,1),
    calories INTEGER,
    total_fat_g NUMERIC(6,1),
    saturated_fat_g NUMERIC(6,1),
    trans_fat_g NUMERIC(6,1),
    cholesterol_mg NUMERIC(6,1),
    sodium_mg NUMERIC(6,1),
    total_carbohydrate_g NUMERIC(6,1),
    dietary_fiber_g NUMERIC(6,1),
    total_sugars_g NUMERIC(6,1),
    added_sugars_g NUMERIC(6,1),
    protein_g NUMERIC(6,1),
    vitamin_d_mcg NUMERIC(6,1),
    calcium_mg NUMERIC(6,1),
    iron_mg NUMERIC(6,1),
    potassium_mg NUMERIC(6,1),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, variant_id)
);

-- 5. Product Reviews
CREATE TABLE IF NOT EXISTS product_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES aura_products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES aura_orders(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    body TEXT,
    taste_rating INTEGER CHECK (taste_rating IS NULL OR (taste_rating >= 1 AND taste_rating <= 5)),
    value_rating INTEGER CHECK (value_rating IS NULL OR (value_rating >= 1 AND value_rating <= 5)),
    preparation_ease INTEGER CHECK (preparation_ease IS NULL OR (preparation_ease >= 1 AND preparation_ease <= 5)),
    images TEXT[] DEFAULT '{}',
    status review_status DEFAULT 'pending',
    is_verified_purchase BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    admin_response TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, user_id, order_id)
);

-- 6. Product Relationships
CREATE TABLE IF NOT EXISTS product_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_product_id UUID NOT NULL REFERENCES aura_products(id) ON DELETE CASCADE,
    target_product_id UUID NOT NULL REFERENCES aura_products(id) ON DELETE CASCADE,
    relationship_type relationship_type NOT NULL,
    score NUMERIC(5,2) DEFAULT 0,
    is_manual BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source_product_id, target_product_id, relationship_type),
    CHECK (source_product_id != target_product_id)
);

-- 7. Price Lists
CREATE TABLE IF NOT EXISTS price_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    currency VARCHAR(3) DEFAULT 'USD',
    priority INTEGER DEFAULT 0,
    applies_to_channels TEXT[] DEFAULT '{}',
    applies_to_roles user_role[] DEFAULT '{}',
    applies_to_dealer_tiers dealer_tier[] DEFAULT '{}',
    effective_from TIMESTAMPTZ,
    effective_until TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Price List Entries
CREATE TABLE IF NOT EXISTS price_list_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    price_list_id UUID NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
    product_id UUID REFERENCES aura_products(id) ON DELETE CASCADE,
    category VARCHAR(100),
    fixed_price NUMERIC(10,2),
    discount_percentage NUMERIC(5,2),
    quantity_breaks JSONB,
    min_quantity INTEGER,
    max_quantity INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (product_id IS NOT NULL OR category IS NOT NULL)
);

-- 9. Promotions
CREATE TABLE IF NOT EXISTS promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    internal_notes TEXT,
    discount_type discount_type NOT NULL,
    trigger_type trigger_type NOT NULL DEFAULT 'coupon_code',
    coupon_code VARCHAR(100) UNIQUE,
    discount_value NUMERIC(10,2) NOT NULL DEFAULT 0,
    max_discount_amount NUMERIC(10,2),
    -- BOGO fields
    bogo_buy_quantity INTEGER,
    bogo_get_quantity INTEGER,
    bogo_get_discount_pct NUMERIC(5,2),
    -- Volume/spend breaks
    volume_breaks JSONB,
    spend_breaks JSONB,
    -- Applicability
    min_order_amount NUMERIC(10,2),
    min_quantity INTEGER,
    applicable_product_ids UUID[] DEFAULT '{}',
    applicable_categories TEXT[] DEFAULT '{}',
    excluded_product_ids UUID[] DEFAULT '{}',
    first_order_only BOOLEAN DEFAULT false,
    subscription_only BOOLEAN DEFAULT false,
    -- Stacking
    stacking_group VARCHAR(100),
    priority INTEGER DEFAULT 0,
    is_stackable BOOLEAN DEFAULT false,
    -- Usage limits
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    per_user_limit INTEGER,
    -- Schedule
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Promotion Redemptions
CREATE TABLE IF NOT EXISTS promotion_redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES aura_orders(id) ON DELETE SET NULL,
    discount_amount NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Credit Ledger
CREATE TABLE IF NOT EXISTS credit_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type credit_type NOT NULL,
    reference_id UUID,
    reference_type VARCHAR(100),
    description TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Referrals
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    referral_code VARCHAR(50) NOT NULL,
    referee_email VARCHAR(255),
    referrer_reward_value NUMERIC(10,2) DEFAULT 0,
    referee_reward_value NUMERIC(10,2) DEFAULT 0,
    status referral_status DEFAULT 'pending',
    converted_order_id UUID REFERENCES aura_orders(id) ON DELETE SET NULL,
    rewarded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Gift Orders
CREATE TABLE IF NOT EXISTS gift_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES aura_orders(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_name VARCHAR(255) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    gift_message TEXT,
    delivery_date DATE,
    gift_type gift_type NOT NULL DEFAULT 'box',
    num_deliveries INTEGER DEFAULT 1,
    notified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. B2B Contracts
CREATE TABLE IF NOT EXISTS b2b_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    price_list_id UUID NOT NULL REFERENCES price_lists(id) ON DELETE RESTRICT,
    contract_number VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    annual_volume_commitment INTEGER,
    annual_spend_commitment NUMERIC(12,2),
    effective_from DATE NOT NULL,
    effective_until DATE NOT NULL,
    auto_renew BOOLEAN DEFAULT false,
    status contract_status DEFAULT 'draft',
    signed_at TIMESTAMPTZ,
    notes TEXT,
    document_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ALTER EXISTING TABLES (idempotent column additions)
-- =====================================================

-- 15. aura_products - new columns
DO $$ BEGIN
    ALTER TABLE aura_products ADD COLUMN allergens_enum TEXT[] DEFAULT '{}';
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE aura_products ADD COLUMN dietary_labels TEXT[] DEFAULT '{}';
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE aura_products ADD COLUMN preparation_instructions TEXT;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE aura_products ADD COLUMN storage_instructions TEXT;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE aura_products ADD COLUMN is_seasonal BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE aura_products ADD COLUMN is_limited_edition BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE aura_products ADD COLUMN available_from TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE aura_products ADD COLUMN available_until TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE aura_products ADD COLUMN country_of_origin TEXT;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE aura_products ADD COLUMN brand TEXT;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

-- 16. organizations - new columns
DO $$ BEGIN
    ALTER TABLE organizations ADD COLUMN payment_terms TEXT DEFAULT 'prepaid';
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE organizations ADD COLUMN credit_limit NUMERIC(10,2) DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE organizations ADD COLUMN current_balance NUMERIC(10,2) DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE organizations ADD COLUMN tax_exempt BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE organizations ADD COLUMN tax_id TEXT;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE organizations ADD COLUMN min_order_amount NUMERIC(10,2);
EXCEPTION WHEN duplicate_column THEN null;
END $$;

-- 17. aura_orders - new column
DO $$ BEGIN
    ALTER TABLE aura_orders ADD COLUMN purchase_type TEXT DEFAULT 'subscription';
EXCEPTION WHEN duplicate_column THEN null;
END $$;

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_is_active ON product_variants(is_active);

CREATE INDEX IF NOT EXISTS idx_product_bundles_slug ON product_bundles(slug);
CREATE INDEX IF NOT EXISTS idx_product_bundles_is_active ON product_bundles(is_active);
CREATE INDEX IF NOT EXISTS idx_product_bundles_category ON product_bundles(category);

CREATE INDEX IF NOT EXISTS idx_product_bundle_items_bundle_id ON product_bundle_items(bundle_id);
CREATE INDEX IF NOT EXISTS idx_product_bundle_items_product_id ON product_bundle_items(product_id);

CREATE INDEX IF NOT EXISTS idx_product_nutrition_product_id ON product_nutrition(product_id);
CREATE INDEX IF NOT EXISTS idx_product_nutrition_variant_id ON product_nutrition(variant_id);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_status ON product_reviews(status);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(rating);

CREATE INDEX IF NOT EXISTS idx_product_relationships_source ON product_relationships(source_product_id);
CREATE INDEX IF NOT EXISTS idx_product_relationships_target ON product_relationships(target_product_id);
CREATE INDEX IF NOT EXISTS idx_product_relationships_type ON product_relationships(relationship_type);

CREATE INDEX IF NOT EXISTS idx_price_lists_slug ON price_lists(slug);
CREATE INDEX IF NOT EXISTS idx_price_lists_is_active ON price_lists(is_active);
CREATE INDEX IF NOT EXISTS idx_price_lists_priority ON price_lists(priority);

CREATE INDEX IF NOT EXISTS idx_price_list_entries_price_list_id ON price_list_entries(price_list_id);
CREATE INDEX IF NOT EXISTS idx_price_list_entries_product_id ON price_list_entries(product_id);
CREATE INDEX IF NOT EXISTS idx_price_list_entries_category ON price_list_entries(category);

CREATE INDEX IF NOT EXISTS idx_promotions_coupon_code ON promotions(coupon_code);
CREATE INDEX IF NOT EXISTS idx_promotions_is_active ON promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_trigger_type ON promotions(trigger_type);
CREATE INDEX IF NOT EXISTS idx_promotions_starts_ends ON promotions(starts_at, ends_at);

CREATE INDEX IF NOT EXISTS idx_promotion_redemptions_promotion_id ON promotion_redemptions(promotion_id);
CREATE INDEX IF NOT EXISTS idx_promotion_redemptions_user_id ON promotion_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_promotion_redemptions_order_id ON promotion_redemptions(order_id);

CREATE INDEX IF NOT EXISTS idx_credit_ledger_user_id ON credit_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_type ON credit_ledger(type);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_expires_at ON credit_ledger(expires_at);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee_id ON referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

CREATE INDEX IF NOT EXISTS idx_gift_orders_order_id ON gift_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_gift_orders_sender_id ON gift_orders(sender_id);

CREATE INDEX IF NOT EXISTS idx_b2b_contracts_organization_id ON b2b_contracts(organization_id);
CREATE INDEX IF NOT EXISTS idx_b2b_contracts_price_list_id ON b2b_contracts(price_list_id);
CREATE INDEX IF NOT EXISTS idx_b2b_contracts_status ON b2b_contracts(status);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all new tables
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_bundle_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_nutrition ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_list_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_contracts ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES: Public read tables (products, bundles, nutrition)
-- =====================================================

-- Product Variants: public read, admin manage
DROP POLICY IF EXISTS "Anyone can view active product variants" ON product_variants;
CREATE POLICY "Anyone can view active product variants"
    ON product_variants FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage product variants" ON product_variants;
CREATE POLICY "Admins can manage product variants"
    ON product_variants FOR ALL
    USING (is_admin());

-- Product Bundles: public read active, admin manage
DROP POLICY IF EXISTS "Anyone can view active bundles" ON product_bundles;
CREATE POLICY "Anyone can view active bundles"
    ON product_bundles FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage bundles" ON product_bundles;
CREATE POLICY "Admins can manage bundles"
    ON product_bundles FOR ALL
    USING (is_admin());

-- Product Bundle Items: public read, admin manage
DROP POLICY IF EXISTS "Anyone can view bundle items" ON product_bundle_items;
CREATE POLICY "Anyone can view bundle items"
    ON product_bundle_items FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admins can manage bundle items" ON product_bundle_items;
CREATE POLICY "Admins can manage bundle items"
    ON product_bundle_items FOR ALL
    USING (is_admin());

-- Product Nutrition: public read, admin manage
DROP POLICY IF EXISTS "Anyone can view nutrition facts" ON product_nutrition;
CREATE POLICY "Anyone can view nutrition facts"
    ON product_nutrition FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admins can manage nutrition facts" ON product_nutrition;
CREATE POLICY "Admins can manage nutrition facts"
    ON product_nutrition FOR ALL
    USING (is_admin());

-- Product Relationships: public read, admin manage
DROP POLICY IF EXISTS "Anyone can view product relationships" ON product_relationships;
CREATE POLICY "Anyone can view product relationships"
    ON product_relationships FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admins can manage product relationships" ON product_relationships;
CREATE POLICY "Admins can manage product relationships"
    ON product_relationships FOR ALL
    USING (is_admin());

-- =====================================================
-- RLS POLICIES: Reviews (public read approved, users manage own)
-- =====================================================

DROP POLICY IF EXISTS "Anyone can view approved reviews" ON product_reviews;
CREATE POLICY "Anyone can view approved reviews"
    ON product_reviews FOR SELECT
    USING (status = 'approved' OR user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create reviews" ON product_reviews;
CREATE POLICY "Users can create reviews"
    ON product_reviews FOR INSERT
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own reviews" ON product_reviews;
CREATE POLICY "Users can update own reviews"
    ON product_reviews FOR UPDATE
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage reviews" ON product_reviews;
CREATE POLICY "Admins can manage reviews"
    ON product_reviews FOR ALL
    USING (is_admin());

-- =====================================================
-- RLS POLICIES: Pricing (admin manage, limited read)
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage price lists" ON price_lists;
CREATE POLICY "Admins can manage price lists"
    ON price_lists FOR ALL
    USING (is_admin());

DROP POLICY IF EXISTS "Active price lists viewable" ON price_lists;
CREATE POLICY "Active price lists viewable"
    ON price_lists FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage price list entries" ON price_list_entries;
CREATE POLICY "Admins can manage price list entries"
    ON price_list_entries FOR ALL
    USING (is_admin());

DROP POLICY IF EXISTS "Active entries viewable" ON price_list_entries;
CREATE POLICY "Active entries viewable"
    ON price_list_entries FOR SELECT
    USING (is_active = true);

-- =====================================================
-- RLS POLICIES: Promotions (admin manage, limited read)
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage promotions" ON promotions;
CREATE POLICY "Admins can manage promotions"
    ON promotions FOR ALL
    USING (is_admin());

DROP POLICY IF EXISTS "Active promotions viewable" ON promotions;
CREATE POLICY "Active promotions viewable"
    ON promotions FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage promotion redemptions" ON promotion_redemptions;
CREATE POLICY "Admins can manage promotion redemptions"
    ON promotion_redemptions FOR ALL
    USING (is_admin());

DROP POLICY IF EXISTS "Users can view own redemptions" ON promotion_redemptions;
CREATE POLICY "Users can view own redemptions"
    ON promotion_redemptions FOR SELECT
    USING (user_id = auth.uid());

-- =====================================================
-- RLS POLICIES: Credits, Referrals, Gifts (user own + admin)
-- =====================================================

-- Credit Ledger
DROP POLICY IF EXISTS "Users can view own credits" ON credit_ledger;
CREATE POLICY "Users can view own credits"
    ON credit_ledger FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage credits" ON credit_ledger;
CREATE POLICY "Admins can manage credits"
    ON credit_ledger FOR ALL
    USING (is_admin());

-- Referrals
DROP POLICY IF EXISTS "Users can view own referrals" ON referrals;
CREATE POLICY "Users can view own referrals"
    ON referrals FOR SELECT
    USING (referrer_id = auth.uid() OR referee_id = auth.uid());

DROP POLICY IF EXISTS "Users can create referrals" ON referrals;
CREATE POLICY "Users can create referrals"
    ON referrals FOR INSERT
    WITH CHECK (referrer_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage referrals" ON referrals;
CREATE POLICY "Admins can manage referrals"
    ON referrals FOR ALL
    USING (is_admin());

-- Gift Orders
DROP POLICY IF EXISTS "Users can view own gift orders" ON gift_orders;
CREATE POLICY "Users can view own gift orders"
    ON gift_orders FOR SELECT
    USING (sender_id = auth.uid());

DROP POLICY IF EXISTS "Users can create gift orders" ON gift_orders;
CREATE POLICY "Users can create gift orders"
    ON gift_orders FOR INSERT
    WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage gift orders" ON gift_orders;
CREATE POLICY "Admins can manage gift orders"
    ON gift_orders FOR ALL
    USING (is_admin());

-- =====================================================
-- RLS POLICIES: B2B Contracts (admin only)
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage contracts" ON b2b_contracts;
CREATE POLICY "Admins can manage contracts"
    ON b2b_contracts FOR ALL
    USING (is_admin());

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
    CREATE TRIGGER set_product_variants_updated_at
        BEFORE UPDATE ON product_variants
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER set_product_bundles_updated_at
        BEFORE UPDATE ON product_bundles
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER set_product_nutrition_updated_at
        BEFORE UPDATE ON product_nutrition
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER set_product_reviews_updated_at
        BEFORE UPDATE ON product_reviews
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER set_promotions_updated_at
        BEFORE UPDATE ON promotions
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER set_price_lists_updated_at
        BEFORE UPDATE ON price_lists
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER set_b2b_contracts_updated_at
        BEFORE UPDATE ON b2b_contracts
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null;
END $$;
