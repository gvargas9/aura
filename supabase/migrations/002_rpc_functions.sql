-- Aura Platform RPC Functions
-- Version: 1.0
-- Date: 2025-12-09

-- =====================================================
-- DEALER COMMISSION FUNCTIONS
-- =====================================================

-- Increment dealer commission (called from webhook)
CREATE OR REPLACE FUNCTION increment_dealer_commission(
    p_dealer_id UUID,
    p_amount DECIMAL(10, 2)
)
RETURNS VOID AS $$
BEGIN
    UPDATE dealers
    SET
        commission_earned = commission_earned + p_amount,
        commission_pending = commission_pending + p_amount,
        updated_at = NOW()
    WHERE id = p_dealer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pay out dealer commission
CREATE OR REPLACE FUNCTION payout_dealer_commission(
    p_dealer_id UUID,
    p_amount DECIMAL(10, 2),
    p_payout_id VARCHAR(255)
)
RETURNS VOID AS $$
BEGIN
    -- Update dealer record
    UPDATE dealers
    SET
        commission_paid = commission_paid + p_amount,
        commission_pending = commission_pending - p_amount,
        updated_at = NOW()
    WHERE id = p_dealer_id;

    -- Record the transaction
    INSERT INTO commission_transactions (
        dealer_id,
        amount,
        type,
        status,
        stripe_payout_id
    ) VALUES (
        p_dealer_id,
        p_amount,
        'paid',
        'completed',
        p_payout_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INVENTORY FUNCTIONS
-- =====================================================

-- Decrement inventory for an order
CREATE OR REPLACE FUNCTION decrement_order_inventory(
    p_order_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_item RECORD;
    v_order_items JSONB;
BEGIN
    -- Get order items
    SELECT items INTO v_order_items
    FROM aura_orders
    WHERE id = p_order_id;

    -- Loop through items and decrement inventory
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_order_items)
    LOOP
        UPDATE inventory
        SET
            quantity = quantity - COALESCE((v_item.value->>'quantity')::INTEGER, 1),
            updated_at = NOW()
        WHERE product_id = (v_item.value->>'productId')::UUID
          AND warehouse_location = 'el_paso';

        -- Record inventory transaction
        INSERT INTO inventory_transactions (
            product_id,
            warehouse_location,
            quantity_change,
            type,
            reference_id,
            reference_type
        ) VALUES (
            (v_item.value->>'productId')::UUID,
            'el_paso',
            -COALESCE((v_item.value->>'quantity')::INTEGER, 1),
            'sale',
            p_order_id,
            'order'
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check and alert low stock items
CREATE OR REPLACE FUNCTION get_low_stock_items()
RETURNS TABLE (
    product_id UUID,
    product_name VARCHAR(255),
    sku VARCHAR(100),
    current_quantity INTEGER,
    reorder_point INTEGER,
    warehouse_location VARCHAR(100)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        i.product_id,
        p.name,
        p.sku,
        i.quantity,
        i.reorder_point,
        i.warehouse_location
    FROM inventory i
    JOIN aura_products p ON p.id = i.product_id
    WHERE i.quantity <= i.reorder_point
    ORDER BY i.quantity ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Restock inventory
CREATE OR REPLACE FUNCTION restock_inventory(
    p_product_id UUID,
    p_quantity INTEGER,
    p_warehouse VARCHAR(100) DEFAULT 'el_paso',
    p_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Update inventory
    UPDATE inventory
    SET
        quantity = quantity + p_quantity,
        last_restock_date = NOW(),
        updated_at = NOW()
    WHERE product_id = p_product_id
      AND warehouse_location = p_warehouse;

    -- Record transaction
    INSERT INTO inventory_transactions (
        product_id,
        warehouse_location,
        quantity_change,
        type,
        notes
    ) VALUES (
        p_product_id,
        p_warehouse,
        p_quantity,
        'restock',
        p_notes
    );

    -- Update product stock level
    UPDATE aura_products
    SET stock_level = (
        SELECT COALESCE(SUM(quantity), 0)
        FROM inventory
        WHERE product_id = p_product_id
    )
    WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ORDER FUNCTIONS
-- =====================================================

-- Get order with full details
CREATE OR REPLACE FUNCTION get_order_details(p_order_id UUID)
RETURNS TABLE (
    order_data JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT jsonb_build_object(
        'order', to_jsonb(o.*),
        'user', jsonb_build_object(
            'id', pr.id,
            'email', pr.email,
            'full_name', pr.full_name
        ),
        'subscription', to_jsonb(s.*),
        'products', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', p.id,
                    'name', p.name,
                    'sku', p.sku,
                    'price', p.price,
                    'image_url', p.image_url,
                    'quantity', (item->>'quantity')::INTEGER
                )
            )
            FROM jsonb_array_elements(o.items) AS item
            JOIN aura_products p ON p.id = (item->>'productId')::UUID
        )
    )
    FROM aura_orders o
    LEFT JOIN profiles pr ON pr.id = o.user_id
    LEFT JOIN aura_subscriptions s ON s.id = o.subscription_id
    WHERE o.id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- USER FUNCTIONS
-- =====================================================

-- Get user dashboard stats
CREATE OR REPLACE FUNCTION get_user_dashboard_stats(p_user_id UUID)
RETURNS TABLE (
    total_orders INTEGER,
    total_spent DECIMAL(10, 2),
    active_subscriptions INTEGER,
    credits INTEGER,
    last_order_date TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*)::INTEGER FROM aura_orders WHERE user_id = p_user_id),
        (SELECT COALESCE(SUM(total), 0) FROM aura_orders WHERE user_id = p_user_id AND status != 'cancelled'),
        (SELECT COUNT(*)::INTEGER FROM aura_subscriptions WHERE user_id = p_user_id AND status = 'active'),
        (SELECT COALESCE(pr.credits, 0) FROM profiles pr WHERE pr.id = p_user_id),
        (SELECT MAX(created_at) FROM aura_orders WHERE user_id = p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
