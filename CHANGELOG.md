# Changelog

All notable changes to the Aura platform are documented in this file.

## [2026-04-01] — Platform Expansion (Phase 4)

### Added — Production E2E Test Suite
- 112 production tests across 6 personas (visitor, customer, admin, dealer, B2B, API)
- Comprehensive coverage: auth flows, checkout, admin CRUD, B2B portal, API endpoints
- `tests/e2e/production/` directory with persona-based test organization

### Added — Expo React Native Mobile App
- Expo React Native app scaffold in `/mobile` with 5 tabs (Home, Products, Box, Orders, Profile)
- Auth integration with Supabase (login, register, session persistence)
- AI chat screen (Ask Aura) with Gemini integration
- Product browsing with category filters and search
- Excluded from root TypeScript compilation via tsconfig `exclude`

### Added — Business Manager CRM Integration
- Bidirectional sync between Aura and Business Manager (CRM at crm.inspiration-ai.com)
- Lead, contact, and activity management via CRM API
- Sample tracking system with allocation (admin + dealer portal)
- Dealer sync API (Aura ↔ Business Manager)
- Fire-and-forget pattern: CRM failures never block commerce operations
- Renamed MenuMaster to Business Manager across entire codebase

### Added — Vending Machine REST API
- 4 vending endpoints: inventory check, purchase, restock, status
- Outbound webhooks for machine events (low stock, jam, sale)
- Machine authentication via API keys

### Added — White-Label Platform
- API key management for partners
- v1 partner API with rate limiting and scoped permissions
- Embeddable widget for third-party sites
- Custom domain support (CNAME configuration)

### Added — SEO & Analytics
- Dynamic sitemap generation (`/sitemap.xml`)
- Robots.txt with crawler directives
- JSON-LD structured data for products and organization
- Per-page metadata with Open Graph and Twitter Cards
- Security headers (CSP, HSTS, X-Frame-Options)
- Admin analytics dashboard (revenue, conversion funnels)
- Vercel Analytics integration

### Added — Cinematic Presentation
- 19-slide presentation page with obsidian theme and orbit animations
- CRM Integration slide (slide 8/19) showcasing Business Manager sync
- Responsive design with keyboard navigation

### Added — Database Migrations
- 5 new migrations (007-011): CRM tables, vending API, white-label, SEO metadata, sample tracking

### Added — Vercel Deployment
- `vercel.json` configuration with build settings
- Deferred Supabase client creation to request time (was module-scope)
- TypeScript build fixes for production compilation

### Fixed
- Vercel build: deferred module-scope `createClient()` calls to request time (crashed during "Collecting page data")
- `ignoreCommand` in vercel.json with `exit 0` was skipping ALL Vercel builds
- Root `tsconfig.json` `include: ["**/*.ts"]` was catching `/mobile` — added to `exclude`
- Hydration mismatch in AuraChatWidget (`new Date()` in module scope diverged SSR/client)
- 47 failing E2E tests: strict mode violations, auth timeouts (15s → 30s), selector mismatches
- TypeScript build errors: `NodeJS.Timeout` type, rate-limit `unref()` compatibility
- Supabase CLI v2.75+ config compatibility update

---

## [2026-03-28] — Security, AI Analytics & i18n (Phase 3)

### Added — Security Hardening
- In-memory rate limiting with IP-based tracking and auto-cleanup (`src/lib/api/rate-limit.ts`)
- Per-endpoint limits: auth 5/min, write 20/min, chat 10/min, checkout 10/min
- Input validation library: email, phone, UUID, price, sanitizeString, sanitizeHtml (`src/lib/api/validation.ts`)
- CSRF protection on all mutation API routes (`src/lib/api/csrf.ts`)
- Security headers: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- Secure cookie configuration: HttpOnly, Secure in production, SameSite=Lax
- Safe error responses: no internal details leaked in production (`src/lib/api/safe-error.ts`)
- Applied rate limiting + validation to 9 API routes
- Full security audit report (`docs/SECURITY-AUDIT.md`)

### Added — Churn Prediction AI
- Rule-based churn scoring engine with Gemini-powered retention recommendations (`src/lib/ai/churn.ts`)
- Scoring factors: order frequency, value trend, subscription pauses, support tickets, engagement
- Risk levels: low (0-0.25), medium (0.26-0.50), high (0.51-0.75), critical (0.76-1.0)
- Batch scoring with profiles.churn_risk_score updates
- `/api/analytics/churn` (GET scores, POST batch recalculate)
- `/api/cron/churn-scoring` for daily automated scoring
- n8n alerts for critical-risk customers

### Added — Demand Forecasting AI
- Demand forecasting engine with trend detection and seasonality (`src/lib/ai/forecast.ts`)
- Calculates: avg daily demand, days until stockout, recommended reorder date/quantity
- Reorder report generator: urgent/upcoming/stable categorization with cost estimates
- `/api/analytics/demand` (GET forecast, POST generate report)
- `/api/cron/demand-forecast` for daily automated forecasting
- Admin analytics dashboard (`/admin/analytics`) with churn + demand tabs

### Added — Internationalization (i18n)
- Lightweight translation system with 4 languages: English, Spanish, French, Portuguese
- ~90 translation keys covering nav, hero, product, checkout, auth, dashboard
- Multi-currency support: USD, MXN, EUR, BRL with static exchange rates
- `useLocale` hook with browser language detection and localStorage persistence
- `LocaleSelector` component in Header (language + currency dropdown)
- `PriceDisplay` component for multi-currency price rendering
- Locale settings page (`/account/locale`) with live formatting previews
- Enhanced `formatCurrency()` with currency parameter (backward compatible)

---

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
