-- App Settings table for admin-configurable settings
-- Key-value store with JSON values and categorization

CREATE TABLE IF NOT EXISTS app_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}',
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write settings
CREATE POLICY "Admins can read settings" ON app_settings
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can update settings" ON app_settings
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can insert settings" ON app_settings
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Seed default settings
INSERT INTO app_settings (key, value, category, description) VALUES
    ('store_name', '"Aura"', 'general', 'Public-facing store name'),
    ('support_email', '"hello@aura.com"', 'general', 'Customer support email'),
    ('store_timezone', '"America/Chicago"', 'general', 'Store timezone for scheduling'),
    ('default_warehouse', '"El Paso, TX"', 'shipping', 'Primary ship-from location'),
    ('free_shipping_threshold', '0', 'shipping', 'Minimum order for free shipping (0 = always free)'),
    ('carrier_preference', '"EasyPost"', 'shipping', 'Default shipping carrier'),
    ('notify_order_confirmation', 'true', 'notifications', 'Send email on new order'),
    ('notify_shipping_updates', 'true', 'notifications', 'Notify customers on shipment'),
    ('notify_low_stock', 'true', 'notifications', 'Alert admins on low inventory')
ON CONFLICT (key) DO NOTHING;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_app_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER app_settings_updated_at
    BEFORE UPDATE ON app_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_app_settings_timestamp();
