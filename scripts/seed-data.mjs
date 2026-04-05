/**
 * Seed Data Script for Aura Platform
 *
 * Populates the database with realistic test data for development and QA.
 * Uses the Supabase service role key to bypass RLS.
 *
 * Usage:
 *   node scripts/seed-data.mjs
 *
 * Or with env vars pre-loaded:
 *   export $(grep -v '^#' .env.local | grep -v '^\s*$' | xargs) && node scripts/seed-data.mjs
 *
 * The script is idempotent — safe to run multiple times.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ---------------------------------------------------------------------------
// ENV LOADING
// ---------------------------------------------------------------------------
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env.local");

function loadEnv(filePath) {
  try {
    const content = readFileSync(filePath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();
      // Strip surrounding quotes
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env.local may not exist — rely on pre-exported env vars
  }
}

loadEnv(envPath);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
  console.error("   Set them in .env.local or export before running.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
function log(msg) {
  console.log(`  ✔ ${msg}`);
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ---------------------------------------------------------------------------
// 1. PRODUCTS (50)
// ---------------------------------------------------------------------------
const PRODUCTS = [
  // Entrees (15)
  { name: "Thai Basil Chicken", category: "entrees", price: 13.99, weight_oz: 10, dietary_labels: ["high-protein", "gluten-free"], allergens: ["soy"], description: "Aromatic Thai basil chicken with jasmine rice, lemongrass, and chili flakes." },
  { name: "Mushroom Risotto", category: "entrees", price: 12.99, weight_oz: 9, dietary_labels: ["vegetarian"], allergens: ["dairy"], description: "Creamy Arborio risotto with wild mushroom medley and Parmesan." },
  { name: "Protein Power Bowl", category: "entrees", price: 14.99, weight_oz: 12, dietary_labels: ["high-protein", "gluten-free"], allergens: [], description: "Grilled chicken, quinoa, black beans, roasted sweet potato, and avocado crema." },
  { name: "Beef Bourguignon", category: "entrees", price: 15.99, weight_oz: 11, dietary_labels: ["high-protein"], allergens: ["gluten", "sulfites"], description: "Slow-braised beef in red wine sauce with pearl onions and carrots." },
  { name: "Coconut Curry Lentils", category: "entrees", price: 11.99, weight_oz: 10, dietary_labels: ["vegan", "gluten-free"], allergens: ["tree-nuts"], description: "Red lentil dal in rich coconut curry with turmeric and ginger." },
  { name: "Smoked Brisket Mac & Cheese", category: "entrees", price: 14.99, weight_oz: 12, dietary_labels: ["high-protein"], allergens: ["dairy", "gluten"], description: "Tender smoked brisket over creamy three-cheese macaroni." },
  { name: "Mediterranean Lamb Tagine", category: "entrees", price: 16.99, weight_oz: 11, dietary_labels: ["gluten-free", "paleo"], allergens: [], description: "Slow-cooked lamb with apricots, olives, and warm Moroccan spices." },
  { name: "Chicken Tikka Masala", category: "entrees", price: 13.99, weight_oz: 10, dietary_labels: ["gluten-free"], allergens: ["dairy"], description: "Marinated chicken in spiced tomato-cream sauce with basmati rice." },
  { name: "Black Bean Enchiladas", category: "entrees", price: 11.99, weight_oz: 10, dietary_labels: ["vegetarian"], allergens: ["dairy"], description: "Corn tortillas filled with seasoned black beans, topped with salsa verde and queso." },
  { name: "Korean BBQ Beef", category: "entrees", price: 15.99, weight_oz: 10, dietary_labels: ["high-protein"], allergens: ["soy", "sesame"], description: "Bulgogi-style beef with gochujang glaze, pickled daikon, and sticky rice." },
  { name: "Tuscan White Bean Stew", category: "entrees", price: 10.99, weight_oz: 10, dietary_labels: ["vegan", "gluten-free"], allergens: [], description: "Hearty cannellini beans with sun-dried tomatoes, kale, and rosemary." },
  { name: "Cajun Shrimp Jambalaya", category: "entrees", price: 14.99, weight_oz: 11, dietary_labels: ["gluten-free", "high-protein"], allergens: ["shellfish"], description: "Andouille sausage and Gulf shrimp with Cajun-spiced rice and the holy trinity." },
  { name: "Teriyaki Salmon Bowl", category: "entrees", price: 16.99, weight_oz: 9, dietary_labels: ["high-protein", "gluten-free"], allergens: ["fish", "soy"], description: "Wild-caught salmon with teriyaki glaze, edamame, and sushi rice." },
  { name: "Chipotle Chicken Burrito Bowl", category: "entrees", price: 13.99, weight_oz: 12, dietary_labels: ["high-protein", "gluten-free"], allergens: [], description: "Smoky chipotle chicken with cilantro-lime rice, pinto beans, and pico de gallo." },
  { name: "Pesto Pasta Primavera", category: "entrees", price: 12.99, weight_oz: 10, dietary_labels: ["vegetarian"], allergens: ["dairy", "gluten", "tree-nuts"], description: "Penne with basil pesto, roasted bell peppers, zucchini, and cherry tomatoes." },

  // Sides (8)
  { name: "Garlic Mashed Potatoes", category: "sides", price: 8.99, weight_oz: 8, dietary_labels: ["vegetarian", "gluten-free"], allergens: ["dairy"], description: "Roasted garlic Yukon Gold potatoes whipped with butter and cream." },
  { name: "Cilantro Lime Rice", category: "sides", price: 7.99, weight_oz: 8, dietary_labels: ["vegan", "gluten-free"], allergens: [], description: "Fluffy long-grain rice tossed with fresh cilantro and lime zest." },
  { name: "Roasted Brussels Sprouts", category: "sides", price: 9.49, weight_oz: 8, dietary_labels: ["vegan", "keto", "paleo"], allergens: [], description: "Crispy roasted Brussels sprouts with balsamic glaze and toasted pecans." },
  { name: "Sweet Potato Casserole", category: "sides", price: 8.99, weight_oz: 9, dietary_labels: ["vegetarian", "gluten-free"], allergens: ["dairy", "tree-nuts"], description: "Mashed sweet potatoes with brown sugar pecan crumble topping." },
  { name: "Mexican Street Corn", category: "sides", price: 8.49, weight_oz: 8, dietary_labels: ["vegetarian", "gluten-free"], allergens: ["dairy"], description: "Elote-style corn with cotija cheese, chipotle mayo, and fresh lime." },
  { name: "Wild Rice Pilaf", category: "sides", price: 9.99, weight_oz: 8, dietary_labels: ["vegan", "gluten-free"], allergens: [], description: "Wild and brown rice blend with dried cranberries, toasted almonds, and herbs." },
  { name: "Cauliflower Mac & Cheese", category: "sides", price: 9.99, weight_oz: 9, dietary_labels: ["keto", "gluten-free"], allergens: ["dairy"], description: "Cauliflower florets in sharp cheddar sauce — low-carb comfort." },
  { name: "Quinoa Tabbouleh", category: "sides", price: 9.49, weight_oz: 8, dietary_labels: ["vegan", "gluten-free"], allergens: [], description: "Quinoa with fresh parsley, mint, cucumber, tomato, and lemon dressing." },

  // Snacks (9)
  { name: "Spicy Trail Mix", category: "snacks", price: 8.99, weight_oz: 6, dietary_labels: ["vegan", "gluten-free"], allergens: ["peanuts", "tree-nuts"], description: "Almonds, cashews, pumpkin seeds, and dried mango with chili-lime seasoning." },
  { name: "Dark Chocolate Protein Bites", category: "snacks", price: 9.99, weight_oz: 5, dietary_labels: ["high-protein", "gluten-free"], allergens: ["dairy", "soy"], description: "Whey protein bites coated in 72% dark chocolate with sea salt." },
  { name: "Everything Seed Crackers", category: "snacks", price: 8.49, weight_oz: 6, dietary_labels: ["vegan", "keto", "paleo"], allergens: ["sesame"], description: "Crunchy seed-based crackers with everything bagel seasoning." },
  { name: "Freeze-Dried Mango Slices", category: "snacks", price: 7.99, weight_oz: 4, dietary_labels: ["vegan", "gluten-free", "paleo"], allergens: [], description: "Crispy freeze-dried Philippine mango — no added sugar." },
  { name: "Beef Jerky Teriyaki", category: "snacks", price: 10.99, weight_oz: 4, dietary_labels: ["high-protein", "keto"], allergens: ["soy", "gluten"], description: "Grass-fed beef jerky marinated in sweet teriyaki with black pepper." },
  { name: "Peanut Butter Power Bar", category: "snacks", price: 8.99, weight_oz: 4, dietary_labels: ["high-protein", "vegetarian"], allergens: ["peanuts", "soy"], description: "20g protein bar with real peanut butter, oats, and honey." },
  { name: "Sea Salt Chickpea Crisps", category: "snacks", price: 7.49, weight_oz: 5, dietary_labels: ["vegan", "gluten-free", "high-protein"], allergens: [], description: "Crispy roasted chickpeas with Himalayan pink salt." },
  { name: "Coconut Cashew Clusters", category: "snacks", price: 9.49, weight_oz: 5, dietary_labels: ["vegan", "paleo"], allergens: ["tree-nuts"], description: "Toasted coconut flakes, cashews, and pumpkin seeds in maple clusters." },
  { name: "Turkey Meat Sticks", category: "snacks", price: 9.99, weight_oz: 4, dietary_labels: ["high-protein", "gluten-free", "paleo"], allergens: [], description: "Free-range turkey snack sticks with cracked black pepper and sage." },

  // Breakfast (9)
  { name: "Maple Pecan Granola", category: "breakfast", price: 9.99, weight_oz: 12, dietary_labels: ["vegetarian"], allergens: ["tree-nuts", "gluten"], description: "Crunchy oat granola with real maple syrup, pecans, and cinnamon." },
  { name: "Overnight Oats Vanilla Chai", category: "breakfast", price: 8.99, weight_oz: 8, dietary_labels: ["vegetarian"], allergens: ["gluten", "dairy"], description: "Steel-cut oats with vanilla, chai spices, and chia seeds — just add milk." },
  { name: "Paleo Banana Pancake Mix", category: "breakfast", price: 10.99, weight_oz: 10, dietary_labels: ["paleo", "gluten-free"], allergens: ["eggs", "tree-nuts"], description: "Almond flour pancake mix with freeze-dried banana — just add water." },
  { name: "Protein Açaí Bowl Mix", category: "breakfast", price: 11.99, weight_oz: 8, dietary_labels: ["vegan", "gluten-free", "high-protein"], allergens: [], description: "Freeze-dried açaí blend with pea protein, banana, and blueberry." },
  { name: "Savory Egg Bites", category: "breakfast", price: 12.99, weight_oz: 8, dietary_labels: ["keto", "gluten-free", "high-protein"], allergens: ["eggs", "dairy"], description: "Sous-vide egg bites with gruyère, bacon, and roasted red pepper." },
  { name: "Cinnamon Raisin Oatmeal", category: "breakfast", price: 7.99, weight_oz: 10, dietary_labels: ["vegan"], allergens: ["gluten"], description: "Instant steel-cut oats with Ceylon cinnamon and California raisins." },
  { name: "Keto Nut Butter Waffles", category: "breakfast", price: 11.99, weight_oz: 8, dietary_labels: ["keto", "gluten-free"], allergens: ["tree-nuts", "eggs"], description: "Low-carb waffles made with almond butter and coconut flour." },
  { name: "Tropical Smoothie Pack", category: "breakfast", price: 9.49, weight_oz: 8, dietary_labels: ["vegan", "gluten-free", "paleo"], allergens: [], description: "Frozen blend of mango, pineapple, coconut, and spinach — just add liquid." },
  { name: "Blueberry Lemon Muffins", category: "breakfast", price: 10.49, weight_oz: 10, dietary_labels: ["vegetarian"], allergens: ["gluten", "eggs", "dairy"], description: "Bakery-style muffins with wild blueberries and fresh lemon zest." },

  // Desserts (5)
  { name: "Salted Caramel Brownie", category: "desserts", price: 9.99, weight_oz: 6, dietary_labels: [], allergens: ["gluten", "dairy", "eggs"], description: "Fudgy dark chocolate brownie with salted caramel swirl." },
  { name: "Coconut Macaroons", category: "desserts", price: 8.99, weight_oz: 5, dietary_labels: ["gluten-free"], allergens: ["eggs", "tree-nuts"], description: "Chewy coconut macaroons dipped in Belgian dark chocolate." },
  { name: "Lemon Shortbread Cookies", category: "desserts", price: 8.49, weight_oz: 6, dietary_labels: ["vegetarian"], allergens: ["gluten", "dairy", "eggs"], description: "Buttery shortbread with Meyer lemon zest and powdered sugar." },
  { name: "Vegan Chocolate Mousse", category: "desserts", price: 10.99, weight_oz: 6, dietary_labels: ["vegan", "gluten-free"], allergens: [], description: "Rich avocado-based chocolate mousse with coconut cream." },
  { name: "Matcha Green Tea Cake", category: "desserts", price: 11.99, weight_oz: 6, dietary_labels: ["vegetarian"], allergens: ["gluten", "dairy", "eggs"], description: "Delicate sponge cake with ceremonial-grade matcha and white chocolate drizzle." },

  // Beverages (4)
  { name: "Cold Brew Coffee Concentrate", category: "beverages", price: 12.99, weight_oz: 16, dietary_labels: ["vegan", "keto", "paleo"], allergens: [], description: "Small-batch Arabica cold brew concentrate — makes 8 cups. No sugar added." },
  { name: "Turmeric Golden Latte Mix", category: "beverages", price: 10.99, weight_oz: 8, dietary_labels: ["vegan", "gluten-free"], allergens: [], description: "Turmeric, ginger, cinnamon, and black pepper blend — add to warm milk." },
  { name: "Electrolyte Hydration Powder", category: "beverages", price: 9.99, weight_oz: 8, dietary_labels: ["vegan", "keto", "gluten-free"], allergens: [], description: "Zero-sugar electrolyte mix with pink salt, magnesium, and potassium." },
  { name: "Chai Spice Latte Mix", category: "beverages", price: 10.49, weight_oz: 8, dietary_labels: ["vegan"], allergens: [], description: "Organic black tea with cardamom, clove, ginger, and star anise." },
];

function buildProductRows() {
  return PRODUCTS.map((p, i) => ({
    sku: `AURA-${String(i + 100).padStart(3, "0")}`,
    name: p.name,
    slug: slugify(p.name),
    description: p.description,
    short_description: p.description.slice(0, 120),
    price: p.price,
    compare_at_price: +(p.price * 1.2).toFixed(2),
    category: p.category,
    dietary_labels: p.dietary_labels,
    allergens: p.allergens,
    allergens_enum: p.allergens,
    shelf_life_months: 24,
    weight_oz: p.weight_oz,
    is_active: true,
    is_bunker_safe: true,
    tags: [...p.dietary_labels, p.category],
    image_url: `/images/products/${slugify(p.name)}.jpg`,
  }));
}

// ---------------------------------------------------------------------------
// 2. ORGANIZATION
// ---------------------------------------------------------------------------
const ORG = {
  name: "Austin Fitness Co",
  dealer_tier: "gold",
  commission_rate: 0.15,
  contact_email: "orders@austinfitnessco.com",
  contact_phone: "+15125551234",
  payment_terms: "net_30",
  is_active: true,
  address: {
    street: "4200 S Lamar Blvd",
    city: "Austin",
    state: "TX",
    zip: "78704",
    country: "US",
  },
};

// ---------------------------------------------------------------------------
// 3. STOREFRONT
// ---------------------------------------------------------------------------
const STOREFRONT = {
  name: "Austin Fitness Store",
  slug: "austin-fitness",
  is_active: true,
  theme: {
    primary: "#10B981",
    secondary: "#1F2937",
    accent: "#F59E0B",
    font: "Inter",
    borderRadius: "8px",
  },
  settings: {
    showReviews: true,
    showNutrition: true,
    enableChat: false,
    enableSubscriptions: true,
    enableGiftCards: true,
    featuredCategories: ["entrees", "snacks", "breakfast"],
  },
};

// ---------------------------------------------------------------------------
// 4. PROMOTIONS
// ---------------------------------------------------------------------------
const PROMOTIONS = [
  {
    name: "Welcome 10% Off",
    description: "10% off your first order",
    coupon_code: "WELCOME10",
    discount_type: "percentage",
    trigger_type: "coupon_code",
    discount_value: 10,
    first_order_only: true,
    per_user_limit: 1,
    is_active: true,
    starts_at: new Date("2026-01-01").toISOString(),
    ends_at: new Date("2026-12-31").toISOString(),
  },
  {
    name: "Summer $25 Off",
    description: "$25 off orders over $100",
    coupon_code: "SUMMER25",
    discount_type: "fixed_amount",
    trigger_type: "coupon_code",
    discount_value: 25,
    min_order_amount: 100,
    per_user_limit: 2,
    is_active: true,
    starts_at: new Date("2026-06-01").toISOString(),
    ends_at: new Date("2026-09-30").toISOString(),
  },
  {
    name: "Free Shipping",
    description: "Free shipping on all orders",
    coupon_code: "FREESHIP",
    discount_type: "free_shipping",
    trigger_type: "coupon_code",
    discount_value: 0,
    is_active: true,
    starts_at: new Date("2026-01-01").toISOString(),
    ends_at: new Date("2026-12-31").toISOString(),
  },
];

// ---------------------------------------------------------------------------
// 5. REVIEWS
// ---------------------------------------------------------------------------
const REVIEW_TEXTS = [
  { rating: 5, title: "Absolutely delicious!", body: "Way better than I expected from shelf-stable food. The flavor is restaurant-quality and the portion size is generous. Already reordered." },
  { rating: 5, title: "Perfect for busy weeknights", body: "As a working parent, these meals are a lifesaver. Heat and eat in minutes with real, wholesome ingredients. The kids love them too." },
  { rating: 4, title: "Great taste, slightly salty", body: "Really impressed with the quality. The only reason for 4 stars is the sodium level is a bit high for my taste, but the flavor is excellent." },
  { rating: 5, title: "Best emergency food I've tried", body: "Stocking my bunker with Aura was the best decision. These taste like actual meals, not survival rations. 2-year shelf life is incredible." },
  { rating: 4, title: "Solid value for the price", body: "At around $13 per meal, it's comparable to a fast-casual restaurant but much healthier. The subscription discount makes it even better." },
  { rating: 3, title: "Good but not great", body: "Decent meal overall. The texture was slightly mushy after reheating but the flavor was good. Would try other varieties." },
  { rating: 5, title: "My go-to hiking food", body: "Lightweight, shelf-stable, and actually tastes amazing on the trail. So much better than freeze-dried alternatives." },
  { rating: 4, title: "Impressed with the ingredients", body: "Clean ingredient list with no artificial preservatives. You can taste the quality. Some meals are better than others though." },
  { rating: 5, title: "Subscription is worth it", body: "The Voyager box is perfect for my household. Love being able to customize each delivery. The variety keeps things interesting." },
  { rating: 4, title: "Great for dietary restrictions", body: "Finally found shelf-stable meals that cater to my gluten-free keto diet. Not all options are available but the ones that are taste great." },
];

// ---------------------------------------------------------------------------
// SEED FUNCTIONS
// ---------------------------------------------------------------------------

async function getAdminUser() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("email", "admin@inspiration-ai.com")
    .single();

  if (error || !data) {
    console.error("❌ Could not find admin user (admin@inspiration-ai.com)");
    console.error("   Run create-admin.mjs first or create the user manually.");
    process.exit(1);
  }
  return data;
}

async function seedProducts() {
  console.log("\n📦 Seeding 50 products...");
  const rows = buildProductRows();

  const { data, error } = await supabase
    .from("aura_products")
    .upsert(rows, { onConflict: "sku" })
    .select("id, sku, name");

  if (error) throw new Error(`Products seed failed: ${error.message}`);
  log(`${data.length} products upserted`);
  return data;
}

async function seedOrganization() {
  console.log("\n🏢 Seeding organization...");

  // Upsert by checking for existing
  const { data: existing } = await supabase
    .from("organizations")
    .select("id")
    .eq("name", ORG.name)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("organizations")
      .update(ORG)
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw new Error(`Org update failed: ${error.message}`);
    log(`Organization updated: ${data.name}`);
    return data;
  }

  const { data, error } = await supabase
    .from("organizations")
    .insert(ORG)
    .select()
    .single();
  if (error) throw new Error(`Org insert failed: ${error.message}`);
  log(`Organization created: ${data.name}`);
  return data;
}

async function seedDealer(adminUser, org) {
  console.log("\n👤 Seeding dealer...");

  const dealer = {
    profile_id: adminUser.id,
    organization_id: org.id,
    referral_code: "AUSTINFIT",
    is_active: true,
    commission_earned: 1250.0,
    commission_paid: 800.0,
    commission_pending: 450.0,
  };

  // Delete existing dealer for this profile+org combo then insert
  await supabase
    .from("dealers")
    .delete()
    .eq("profile_id", adminUser.id)
    .eq("organization_id", org.id);

  const { data, error } = await supabase
    .from("dealers")
    .insert(dealer)
    .select()
    .single();
  if (error) throw new Error(`Dealer seed failed: ${error.message}`);
  log(`Dealer created: ${data.referral_code}`);
  return data;
}

async function seedStorefront() {
  console.log("\n🏪 Seeding storefront...");

  const { data: existing } = await supabase
    .from("storefronts")
    .select("id")
    .eq("slug", STOREFRONT.slug)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("storefronts")
      .update(STOREFRONT)
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw new Error(`Storefront update failed: ${error.message}`);
    log(`Storefront updated: ${data.name}`);
    return data;
  }

  const { data, error } = await supabase
    .from("storefronts")
    .insert(STOREFRONT)
    .select()
    .single();
  if (error) throw new Error(`Storefront insert failed: ${error.message}`);
  log(`Storefront created: ${data.name}`);
  return data;
}

async function seedOrders(adminUser, products) {
  console.log("\n📋 Seeding 5 orders...");

  const shippingAddress = {
    street: "123 Main St",
    city: "El Paso",
    state: "TX",
    zip: "79901",
    country: "US",
  };

  const statuses = ["pending", "processing", "shipped", "delivered", "delivered"];
  const boxSizes = ["starter", "voyager", "bunker", "voyager", "starter"];
  const totals = [69.99, 99.99, 179.99, 84.99, 59.99];

  // Delete existing seed orders (by checking for test stripe IDs)
  await supabase
    .from("aura_orders")
    .delete()
    .like("stripe_payment_intent_id", "pi_seed_%");

  for (let i = 0; i < 5; i++) {
    // Pick some products for the order items
    const orderProducts = products.slice(i * 3, i * 3 + 3);
    const items = orderProducts.map((p) => ({
      productId: p.id,
      sku: p.sku,
      name: p.name,
      quantity: 1,
      unitPrice: totals[i] / 3,
    }));

    const orderNumber = `AUR-SEED-${String(i + 1).padStart(4, "0")}`;

    // Delete any existing order with this number
    await supabase.from("aura_orders").delete().eq("order_number", orderNumber);

    const order = {
      order_number: orderNumber,
      user_id: adminUser.id,
      status: statuses[i],
      subtotal: totals[i],
      discount: 0,
      shipping: 0,
      tax: +(totals[i] * 0.0825).toFixed(2),
      total: +(totals[i] * 1.0825).toFixed(2),
      currency: "USD",
      items: JSON.stringify(items),
      shipping_address: shippingAddress,
      stripe_payment_intent_id: `pi_seed_${i + 1}`,
      purchase_type: i < 3 ? "subscription" : "one_time",
      created_at: daysAgo(30 - i * 6),
      tracking_number: statuses[i] === "shipped" || statuses[i] === "delivered"
        ? `1Z999AA10123456784${i}`
        : null,
      shipped_at: statuses[i] === "shipped" || statuses[i] === "delivered"
        ? daysAgo(25 - i * 6)
        : null,
      delivered_at: statuses[i] === "delivered"
        ? daysAgo(22 - i * 6)
        : null,
    };

    const { error } = await supabase.from("aura_orders").insert(order);
    if (error) throw new Error(`Order ${i + 1} seed failed: ${error.message}`);
    log(`Order ${orderNumber} — ${statuses[i]} (${boxSizes[i]})`);
  }
}

async function seedSubscriptions(adminUser, products) {
  console.log("\n🔄 Seeding 2 subscriptions...");

  const shippingAddress = {
    street: "123 Main St",
    city: "El Paso",
    state: "TX",
    zip: "79901",
    country: "US",
  };

  // Delete existing seed subscriptions
  await supabase
    .from("aura_subscriptions")
    .delete()
    .like("stripe_subscription_id", "sub_seed_%");

  const productIds = products.map((p) => p.id);

  const subs = [
    {
      user_id: adminUser.id,
      stripe_subscription_id: "sub_seed_voyager_001",
      box_size: "voyager",
      box_config: productIds.slice(0, 12),
      status: "active",
      price: 84.99,
      next_delivery_date: new Date(Date.now() + 15 * 86400000)
        .toISOString()
        .split("T")[0],
      delivery_frequency_days: 30,
      shipping_address: shippingAddress,
      auto_fill_enabled: true,
    },
    {
      user_id: adminUser.id,
      stripe_subscription_id: "sub_seed_starter_001",
      box_size: "starter",
      box_config: productIds.slice(12, 20),
      status: "paused",
      price: 59.99,
      next_delivery_date: null,
      delivery_frequency_days: 30,
      shipping_address: shippingAddress,
      auto_fill_enabled: false,
      pause_until: new Date(Date.now() + 30 * 86400000)
        .toISOString()
        .split("T")[0],
    },
  ];

  for (const sub of subs) {
    const { error } = await supabase.from("aura_subscriptions").insert(sub);
    if (error) throw new Error(`Subscription seed failed: ${error.message}`);
    log(`Subscription ${sub.stripe_subscription_id} — ${sub.status} (${sub.box_size})`);
  }
}

async function seedInventory(products) {
  console.log("\n📦 Seeding inventory for all products...");

  const rows = products.map((p) => ({
    product_id: p.id,
    warehouse_location: "ELP-A",
    quantity: randomBetween(50, 500),
    reserved_quantity: randomBetween(0, 20),
    safety_stock: 20,
    reorder_point: 50,
    reorder_quantity: 200,
    last_restock_date: daysAgo(randomBetween(1, 14)),
  }));

  // Upsert using the unique constraint (product_id, warehouse_location)
  const { data, error } = await supabase
    .from("inventory")
    .upsert(rows, { onConflict: "product_id,warehouse_location" })
    .select("id");

  if (error) throw new Error(`Inventory seed failed: ${error.message}`);
  log(`${data.length} inventory records upserted`);
}

async function seedReviews(adminUser, products) {
  console.log("\n⭐ Seeding 10 product reviews...");

  // Delete existing reviews by this user (idempotent)
  await supabase.from("product_reviews").delete().eq("user_id", adminUser.id);

  for (let i = 0; i < 10; i++) {
    const product = products[i % products.length];
    const review = REVIEW_TEXTS[i];

    const { error } = await supabase.from("product_reviews").insert({
      product_id: product.id,
      user_id: adminUser.id,
      rating: review.rating,
      title: review.title,
      body: review.body,
      taste_rating: Math.min(5, review.rating + randomBetween(-1, 1)),
      value_rating: Math.min(5, Math.max(1, review.rating + randomBetween(-1, 0))),
      preparation_ease: randomBetween(3, 5),
      status: "approved",
      is_verified_purchase: true,
      helpful_count: randomBetween(0, 25),
      created_at: daysAgo(randomBetween(1, 60)),
    });

    if (error) throw new Error(`Review ${i + 1} seed failed: ${error.message}`);
  }
  log("10 product reviews created");
}

async function seedPromotions() {
  console.log("\n🎫 Seeding 3 promotions...");

  for (const promo of PROMOTIONS) {
    // Upsert by coupon_code
    const { data: existing } = await supabase
      .from("promotions")
      .select("id")
      .eq("coupon_code", promo.coupon_code)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("promotions")
        .update(promo)
        .eq("id", existing.id);
      if (error) throw new Error(`Promo update failed: ${error.message}`);
      log(`Promotion updated: ${promo.coupon_code}`);
    } else {
      const { error } = await supabase.from("promotions").insert(promo);
      if (error) throw new Error(`Promo insert failed: ${error.message}`);
      log(`Promotion created: ${promo.coupon_code}`);
    }
  }
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------
async function main() {
  console.log("🌱 Aura Platform — Seed Data Script");
  console.log("====================================");
  console.log(`   Supabase: ${SUPABASE_URL}`);

  try {
    const adminUser = await getAdminUser();
    log(`Admin user found: ${adminUser.email} (${adminUser.id})`);

    const products = await seedProducts();
    const org = await seedOrganization();
    await seedDealer(adminUser, org);
    await seedStorefront();
    await seedOrders(adminUser, products);
    await seedSubscriptions(adminUser, products);
    await seedInventory(products);
    await seedReviews(adminUser, products);
    await seedPromotions();

    console.log("\n====================================");
    console.log("✅ Seed data complete!");
    console.log("   50 products, 1 org, 1 dealer, 1 storefront,");
    console.log("   5 orders, 2 subscriptions, 50 inventory records,");
    console.log("   10 reviews, 3 promotions");
  } catch (err) {
    console.error(`\n❌ Seed failed: ${err.message}`);
    process.exit(1);
  }
}

main();
