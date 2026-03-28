-- 004_aura_academy.sql
-- Creates the product_recipes table for Aura Academy

CREATE TABLE IF NOT EXISTS product_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES aura_products(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  chef_name TEXT NOT NULL,
  chef_title TEXT,
  chef_image_url TEXT,
  difficulty TEXT DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'advanced')),
  prep_time_minutes INT,
  cook_time_minutes INT,
  servings INT DEFAULT 1,
  ingredients JSONB NOT NULL DEFAULT '[]',
  steps JSONB NOT NULL DEFAULT '[]',
  tips TEXT[],
  tags TEXT[] DEFAULT '{}',
  video_url TEXT,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recipes_product ON product_recipes(product_id);
ALTER TABLE product_recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view recipes" ON product_recipes FOR SELECT USING (true);
CREATE POLICY "Admins can manage recipes" ON product_recipes FOR ALL USING (is_admin());

-- Seed some sample recipes
INSERT INTO product_recipes (product_id, title, description, chef_name, chef_title, difficulty, prep_time_minutes, cook_time_minutes, servings, ingredients, steps, tips, tags, is_featured) VALUES
((SELECT id FROM aura_products WHERE sku = 'AUR-ENT-001'), 'Mediterranean Herb Chicken Bowl', 'Transform your Herb Roasted Chicken into a vibrant Mediterranean bowl with fresh vegetables and tangy tzatziki.', 'Chef Maria Santos', 'Head Chef, Aura Kitchen', 'easy', 10, 5, 2, '["1 pouch Aura Herb Roasted Chicken", "1 cup cooked rice or quinoa", "1/2 cucumber, diced", "1/4 cup cherry tomatoes, halved", "2 tbsp tzatziki sauce", "Fresh parsley", "Lemon wedge"]'::jsonb, '["Heat the Aura Herb Roasted Chicken according to package directions (microwave 90 seconds or boil in pouch 3 minutes).", "Prepare a base of warm rice or quinoa in a bowl.", "Slice or shred the heated chicken and arrange over the grain base.", "Add diced cucumber, cherry tomatoes, and a dollop of tzatziki.", "Garnish with fresh parsley and a squeeze of lemon.", "Serve immediately and enjoy!"]'::jsonb, ARRAY['Add olives and feta for extra Mediterranean flavor', 'Swap rice for cauliflower rice for a low-carb version'], ARRAY['bowl', 'mediterranean', 'quick', 'healthy'], true),
((SELECT id FROM aura_products WHERE sku = 'AUR-ENT-001'), 'Quick Chicken Quesadilla', 'A cheesy, protein-packed quesadilla ready in under 10 minutes using your Aura Herb Roasted Chicken.', 'Chef Marco Rivera', 'Sous Chef, Aura Kitchen', 'easy', 5, 5, 1, '["1 pouch Aura Herb Roasted Chicken", "2 flour tortillas", "1/2 cup shredded cheese", "2 tbsp salsa", "Sour cream for dipping"]'::jsonb, '["Heat chicken per package directions and shred with a fork.", "Place one tortilla in a dry skillet over medium heat.", "Spread shredded chicken and cheese evenly over tortilla.", "Top with second tortilla and press gently.", "Cook 2-3 minutes per side until golden and cheese melts.", "Cut into wedges, serve with salsa and sour cream."]'::jsonb, ARRAY['Add sliced jalapenos for heat', 'Works great with a camping stove'], ARRAY['quesadilla', 'quick', 'camping', 'kid-friendly'], false),
((SELECT id FROM aura_products WHERE sku = 'AUR-ENT-002'), 'Loaded Beef Stew Baked Potato', 'Comfort food elevated — pour our hearty Beef Stew over a fluffy baked potato.', 'Chef Maria Santos', 'Head Chef, Aura Kitchen', 'easy', 5, 45, 2, '["1 pouch Aura Beef Stew Classic", "2 large russet potatoes", "2 tbsp butter", "Shredded cheddar cheese", "Chopped chives", "Salt and pepper"]'::jsonb, '["Bake potatoes at 400°F for 40-45 minutes until tender (or microwave 5 min each).", "Heat Aura Beef Stew per package directions.", "Split potatoes open and fluff with a fork, add butter.", "Ladle generous portions of beef stew over each potato.", "Top with shredded cheddar and chives.", "Season with salt and pepper to taste."]'::jsonb, ARRAY['For camping, wrap potatoes in foil and cook in campfire coals for 45 minutes', 'Add a side salad for a complete meal'], ARRAY['comfort-food', 'hearty', 'camping', 'winter'], true),
((SELECT id FROM aura_products WHERE sku = 'AUR-ENT-003'), 'Curry Buddha Bowl', 'A nourishing plant-based bowl featuring our Vegetable Curry with grains and fresh toppings.', 'Chef Aisha Patel', 'Plant-Based Chef, Aura Kitchen', 'easy', 10, 5, 2, '["1 pouch Aura Vegetable Curry", "1 cup cooked brown rice", "1/2 avocado, sliced", "Handful of baby spinach", "2 tbsp hummus", "Sesame seeds", "Lime wedge"]'::jsonb, '["Cook brown rice according to package directions (or use pre-cooked).", "Heat Aura Vegetable Curry per package directions.", "Arrange rice in a bowl, pour warm curry alongside.", "Add sliced avocado, fresh spinach, and a scoop of hummus.", "Sprinkle with sesame seeds and squeeze lime over top.", "Mix everything together or eat in sections — both are delicious!"]'::jsonb, ARRAY['Swap brown rice for naan bread for a different texture', 'This recipe is naturally vegan and gluten-free'], ARRAY['vegan', 'buddha-bowl', 'plant-based', 'healthy'], true);
