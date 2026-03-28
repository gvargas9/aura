# Changelog

All notable changes to the Aura platform are documented in this file.

## [2026-03-28] — Major Platform Build

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
