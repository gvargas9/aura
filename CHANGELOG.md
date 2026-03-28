# Changelog

All notable changes to the Aura platform are documented in this file.

## [2026-03-28] — Core Platform Complete (Phase 2)

### Added — AI Recommendations & Smart Fill
- Product embeddings via Gemini `gemini-embedding-001` (truncated to 1536 dims for pgvector)
- `match_products` RPC function for cosine similarity search with HNSW index
- Smart Aura Fill replaces random selection with category diversity + taste profile matching
- "You Might Also Like" AI-powered section on product detail pages
- Personalized recommendations from order history
- Frequently bought together from order co-occurrence
- Embedding generation script (`scripts/generate-embeddings.mjs`)

### Added — Multi-Storefront System
- 4 themed stores: Main (emerald), Camping/Outdoor (brown), Marine/Aviation (blue), Preparedness (gray)
- Dynamic CSS theming via custom properties (`--sf-primary`, `--sf-accent`, `--sf-dark`)
- Storefront directory (`/store`) with color swatches and "Visit Store" cards
- Individual stores (`/store/[slug]`) with audience-specific hero copy
- Storefront-scoped product catalog and box builder
- Admin storefront management with theme editor and color pickers (`/admin/storefronts`)
- B2B dealer branding page for Gold/Platinum tiers (`/b2b/portal/branding`)

### Added — Supabase Realtime
- `useRealtimeOrders` hook for live order status updates on dashboard
- `useRealtimeInventory` hook for admin inventory monitoring with change highlighting
- `useRealtimeNotifications` hook replacing polling in NotificationCenter
- Live connection indicators with animated badges

### Added — Wishlist / Favorites
- `wishlists` table with RLS (migration)
- `useWishlist` hook with optimistic updates and O(1) lookup
- Heart toggle animations on product cards and detail pages (auth-gated)
- Wishlist page (`/dashboard/wishlist`) with sort options
- Wishlist API (`/api/wishlist`)

### Added — Global Search
- `SearchModal` component (Spotlight-style, `Cmd+K` keyboard shortcut)
- Unified search API (`/api/search`) across products + recipes + categories
- Keyboard navigation (arrow keys, enter, escape)
- Recent searches in localStorage, popular searches
- Integrated in Header search button

### Added — Product Detail Page
- Full product page (`/products/[id]`) with image gallery, variant selector, dietary badges
- Subscribe & Save toggle with 15% savings display
- 4 tabs: Description (ingredients, allergens), Nutrition Facts (FDA-style label), Aura Academy (recipes), Reviews
- Cross-sells: "Pairs Well With", "Customers Also Bought", "You Might Also Like" (AI)
- Review submission form for verified purchasers

### Added — Aura Academy
- `product_recipes` table (migration 004) with chef-prepared recipes
- 4 seed recipes with full ingredients, steps, and chef bios
- Academy landing page (`/academy`) with recipe grid, filters, chef spotlights
- Individual recipe page (`/academy/[recipeId]`) with interactive ingredient checklists
- Admin recipe management (`/admin/recipes`) with step/ingredient editors

### Added — Vending Machine Dashboard
- Admin vending overview (`/admin/vending`) with status indicators and stats
- Machine detail (`/admin/vending/[id]`) with slot inventory grid, restock controls
- Transaction history, QR redemptions tracking, machine config editor

### Added — Shipping Integration
- Shipping client library (`src/lib/shipping/`) with EasyPost provider + mock mode
- Warehouse config (El Paso, TX origin)
- `/api/shipping/rates`, `/api/shipping/label`, `/api/shipping/track` endpoints
- Customer order tracking page (`/orders/[id]`) with visual timeline
- Admin order detail (`/admin/orders/[id]`) with rate selection and label creation

### Added — Email Templates
- Email renderer (`src/lib/email/renderer.ts`) with branded HTML wrapper
- 9 transactional templates (order, shipping, subscription, welcome, etc.)
- Admin template management (`/admin/email-templates`) with split-view editor
- Live preview with variable substitution, send-test functionality
- `/api/email/preview` and `/api/email/send-test` endpoints

### Fixed
- Hero showcase now uses real product images from Supabase Storage (was CSS gradients)
- Embedding model corrected from `text-embedding-004` to `gemini-embedding-001`
- Embedding dimensions truncated to 1536 (pgvector HNSW limit)

---

## [2026-03-28] — Major Platform Build (Phase 1)

### Added — Payment System
- Gift card purchase page (`/gift-cards`) with amount selector, recipient form, live preview
- Gift card code generation (AURA-XXXX-XXXX-XXXX format) with 1-year expiry
- Gift card balance check API (`/api/checkout/gift-card-balance`)
- Credits application API (`/api/checkout/apply-credits`)
- Enhanced checkout with multi-step flow (Review → Discounts → Shipping → Payment)
- Subscribe & Save toggle showing 14-17% savings vs one-time
- B2B invoice/PO option for dealers at checkout
- Enhanced success page with purchase-type messaging and referral sharing

### Added — AI Chat Widget ("Ask Aura")
- Floating chat bubble on all pages with sparkle animation
- Gemini 2.5 Flash-powered conversational AI assistant
- Product search integration with dietary/category filtering
- Quick action chips (popular items, order tracking, dietary help)
- Mobile full-screen overlay, typing indicator, auto-scroll

### Added — Supabase Edge Functions (7)
- `resolve-price` — Multi-layer price resolution (contract → price list → volume → retail)
- `validate-promo` — Coupon validation with stacking rules and usage limits
- `process-order` — Universal order creation across all channels
- `redeem-gift-card` — Atomic gift card redemption with concurrency guard
- `generate-product-image` — On-demand Imagen 4.0 image generation
- `subscription-webhook` — Subscription lifecycle handler (renew/pause/cancel/update)
- `dealer-commission` — Idempotent commission calculation and tracking

### Added — Pricing Engine
- Multi-layer price resolution engine (`src/lib/pricing/engine.ts`)
- Promotions engine with stacking groups, BOGO, volume breaks (`src/lib/pricing/promotions.ts`)
- Subscribe & Save configuration (14-17% savings) (`src/lib/pricing/subscription.ts`)
- Cart pricing API (`/api/cart/price`)

### Added — UI Redesign (Research-Driven)
- Premium dark hero landing page with per-meal pricing, animated count-up stats
- Sticky blur header with mobile bottom tab navigation
- Product cards with dietary badges, hover zoom, Subscribe & Save badges
- Build-a-Box with circular progress ring, visual slot grid, dietary filters
- Skeleton loading components (`SkeletonLoader.tsx`)
- Fixed color palette inconsistency (tailwind.config.ts ↔ globals.css)

### Added — B2B Dealer Portal Enhancement
- Commission dashboard with CSS bar charts and tier progress bar
- Volume break pricing display with quantity tier tables
- PO status timeline (submitted → approved → invoiced → shipped → delivered)
- Quick reorder and save-as-template functionality
- Analytics page (`/b2b/portal/analytics`) with revenue/commission charts
- Locations page (`/b2b/portal/locations`) for multi-site dealer management
- Multi-step dealer application form with progress tracking

### Added — Database Schema (Migration 003)
- 14 new tables: product_variants, product_bundles, product_bundle_items, product_nutrition, product_reviews, product_relationships, price_lists, price_list_entries, promotions, promotion_redemptions, credit_ledger, referrals, gift_orders, b2b_contracts
- Enhanced aura_products with dietary_labels, allergens_enum, seasonal flags, brand
- Enhanced organizations with payment_terms, credit_limit, tax_exempt
- Enhanced aura_orders with purchase_type column

### Added — Product Images
- AI-generated food photography using Google Imagen 4.0
- 8 product images stored in Supabase Storage (media/products/)
- Generation script at `scripts/generate-product-images.mjs`

### Added — n8n Automation Layer
- n8n client library (`src/lib/n8n/`) with webhook triggers
- Event logger to omni_interaction_log for CRM visibility
- Webhook receivers: `/api/webhooks/n8n`, `/api/webhooks/shipping`
- Cron endpoints: `low-stock-check`, `subscription-reminders`, `abandoned-carts`
- Stripe webhook updated to trigger n8n on checkout/cancellation/payment failure
- 3 workflows deployed to automation.inspiration-ai.com

### Added — Notification System
- NotificationCenter dropdown component (bell icon with unread badge) in Header
- Notification preferences page (`/account/notifications`)
- Admin notification management (`/admin/notifications`)
- Notification API (`/api/notifications`)
- Email/SMS templates with {{variable}} placeholders (`src/lib/notifications/templates.ts`)

### Added — User Experience (Layer 1)
- User dashboard (`/dashboard`) with stats, subscriptions, recent orders
- Order history (`/orders`) with status filters and expandable details
- Subscription management (`/dashboard/subscriptions`) with pause/resume
- Account settings (`/account`) with profile editing, address management

### Added — Admin Operations (Layer 2)
- Shared admin layout with sidebar navigation and dark header
- Product management (`/admin/products`) — CRUD, search, filters, modal forms
- Order management (`/admin/orders`) — status updates, tracking, internal notes
- Customer management (`/admin/customers`) — role changes, credit adjustments
- Inventory management (`/admin/inventory`) — color-coded stock levels, inline editing
- Dealer management (`/admin/dealers`) — organizations, commissions, tier management

### Added — Core API Routes (30 endpoints)
- Products CRUD (`/api/products`, `/api/products/[id]`)
- Orders CRUD (`/api/orders`, `/api/orders/[id]`)
- Subscriptions CRUD (`/api/subscriptions`, `/api/subscriptions/[id]`)
- Inventory management (`/api/inventory`)
- Promo codes (`/api/promo-codes`, `/api/promo-codes/validate`)
- Gift cards (`/api/gift-cards`, `/api/gift-cards/redeem`, `/api/gift-cards/purchase`)
- Dealers (`/api/dealers`), Organizations (`/api/organizations`)
- Categories (`/api/categories`), Bundles (`/api/bundles`)
- Reviews (`/api/reviews`, `/api/reviews/[id]`)
- Notifications (`/api/notifications`)
- Auth helper (`src/lib/api/auth.ts`)

### Added — Testing
- Playwright E2E test suite: 166 tests across 15 files
- Auth, public pages, dashboard, build-a-box, admin (all sections), B2B portal, API endpoints

### Fixed
- Admin layout hydration issue in Next.js 16 Turbopack (replaced useAuth with direct Supabase calls)
- Login page invisible text (dark mode CSS inheritance causing white-on-white)
- Auth page contrast and accessibility improvements
- RLS policy recursion on profiles table
- Missing admin RLS policies on inventory, organizations, gift_cards tables

## [2025-12-09] — Initial Scaffold

### Added
- Next.js 16 project setup with React 19 and Tailwind CSS 4
- Supabase schema (24 tables) with RLS policies
- Auth system (email/password + Google OAuth)
- Build-a-Box subscription flow
- Stripe Checkout integration
- Product catalog with 8 seed products
- Admin dashboard (basic stats)
- B2B landing page
