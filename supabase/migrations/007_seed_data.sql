-- Part 7: Seed Data
-- Run this after Part 6

-- Insert default categories
INSERT INTO categories (name, slug, description, sort_order) VALUES
    ('Entrees', 'entrees', 'Complete meal entrees', 1),
    ('Sides', 'sides', 'Side dishes and accompaniments', 2),
    ('Snacks', 'snacks', 'Healthy snacks and energy bites', 3),
    ('Breakfast', 'breakfast', 'Morning meal options', 4),
    ('Beverages', 'beverages', 'Drinks and smoothie bases', 5)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample products
INSERT INTO aura_products (sku, name, short_description, description, price, compare_at_price, category, is_bunker_safe, shelf_life_months, weight_oz, tags, image_url, stock_level) VALUES
    ('AUR-ENT-001', 'Herb Roasted Chicken', 'Tender chicken with Mediterranean herbs', 'Premium all-natural chicken breast seasoned with rosemary, thyme, and garlic. Shelf-stable for 24 months without refrigeration.', 12.99, 15.99, 'Entrees', true, 24, 8.0, ARRAY['chicken', 'protein', 'gluten-free'], '/images/products/chicken.jpg', 1000),
    ('AUR-ENT-002', 'Beef Stew Classic', 'Hearty beef stew with root vegetables', 'Slow-cooked beef chunks with carrots, potatoes, and savory gravy. No refrigeration needed.', 13.99, 16.99, 'Entrees', true, 24, 10.0, ARRAY['beef', 'comfort-food', 'hearty'], '/images/products/beef-stew.jpg', 1000),
    ('AUR-ENT-003', 'Vegetable Curry', 'Aromatic plant-based curry', 'Rich coconut curry with chickpeas, sweet potato, and spinach. Vegan and gluten-free.', 11.99, 14.99, 'Entrees', true, 24, 9.0, ARRAY['vegan', 'curry', 'plant-based'], '/images/products/curry.jpg', 1000),
    ('AUR-ENT-004', 'Salmon Teriyaki', 'Pacific salmon with teriyaki glaze', 'Wild-caught salmon fillet with house-made teriyaki sauce and sesame seeds.', 15.99, 18.99, 'Entrees', true, 18, 7.0, ARRAY['seafood', 'omega-3', 'asian'], '/images/products/salmon.jpg', 1000),
    ('AUR-ENT-005', 'Turkey Meatballs', 'Italian-style turkey meatballs', 'Lean turkey meatballs in marinara sauce with Italian herbs.', 12.49, 14.99, 'Entrees', true, 24, 9.0, ARRAY['turkey', 'protein', 'italian'], '/images/products/meatballs.jpg', 1000),
    ('AUR-ENT-006', 'Pulled Pork BBQ', 'Smoky pulled pork', 'Tender pulled pork with tangy BBQ sauce. Perfect over rice or in tacos.', 13.49, 16.49, 'Entrees', true, 24, 10.0, ARRAY['pork', 'bbq', 'comfort-food'], '/images/products/pulled-pork.jpg', 1000),
    ('AUR-SID-001', 'Quinoa Pilaf', 'Fluffy quinoa with herbs', 'Organic quinoa cooked with vegetable broth and fresh herbs.', 7.99, 9.99, 'Sides', true, 24, 6.0, ARRAY['grain', 'vegan', 'protein'], '/images/products/quinoa.jpg', 1000),
    ('AUR-SID-002', 'Mashed Sweet Potato', 'Creamy sweet potato mash', 'Smooth sweet potatoes with a hint of cinnamon and maple.', 6.99, 8.99, 'Sides', true, 24, 6.0, ARRAY['vegetable', 'comfort-food', 'vegan'], '/images/products/sweet-potato.jpg', 1000),
    ('AUR-SID-003', 'Brown Rice Medley', 'Mixed grain rice blend', 'Wholesome blend of brown rice, wild rice, and ancient grains.', 6.49, 7.99, 'Sides', true, 24, 6.0, ARRAY['grain', 'vegan', 'fiber'], '/images/products/rice.jpg', 1000),
    ('AUR-SNK-001', 'Energy Bites', 'Oat and nut energy bites', 'Packed with oats, almonds, and honey for sustained energy.', 8.99, 10.99, 'Snacks', true, 12, 4.0, ARRAY['snack', 'energy', 'nuts'], '/images/products/energy-bites.jpg', 1000),
    ('AUR-SNK-002', 'Trail Mix Premium', 'Gourmet trail mix', 'Premium nuts, dried fruits, and dark chocolate chips.', 9.99, 11.99, 'Snacks', true, 12, 5.0, ARRAY['snack', 'nuts', 'chocolate'], '/images/products/trail-mix.jpg', 1000),
    ('AUR-BRK-001', 'Overnight Oats', 'Ready-to-eat breakfast oats', 'Steel-cut oats with chia seeds and dried berries. Just add water.', 7.99, 9.99, 'Breakfast', true, 18, 5.0, ARRAY['breakfast', 'oats', 'fiber'], '/images/products/oats.jpg', 1000),
    ('AUR-BRK-002', 'Protein Pancake Mix', 'High-protein pancake mix', 'Fluffy pancakes with 20g protein per serving. Just add water.', 10.99, 12.99, 'Breakfast', true, 18, 8.0, ARRAY['breakfast', 'protein', 'pancakes'], '/images/products/pancakes.jpg', 1000)
ON CONFLICT (sku) DO NOTHING;

-- Update inventory for products
INSERT INTO inventory (product_id, warehouse_location, quantity, safety_stock, reorder_point, reorder_quantity)
SELECT id, 'el_paso', 1000, 100, 200, 500 FROM aura_products
ON CONFLICT (product_id, warehouse_location) DO NOTHING;

-- Insert a default storefront
INSERT INTO storefronts (name, slug, settings) VALUES
    ('Aura Main', 'main', '{"primaryColor": "#10B981", "accentColor": "#F59E0B"}')
ON CONFLICT (slug) DO NOTHING;
