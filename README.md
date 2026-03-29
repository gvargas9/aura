# Aura

**AI-Native Omni-Commerce Food Platform**

Aura is a next-generation e-commerce platform for premium, shelf-stable natural food — built for multi-channel commerce across B2C subscriptions, B2B wholesale, dealer networks, vending, and specialty markets.

> *"Energy, Anywhere."* — Gourmet food that lives in a pantry, boat galley, or bunker for years but tastes like it was cooked today.

## Platform Overview

| Channel | Description |
|---------|-------------|
| **B2C Subscriptions** | "Build-a-Box" customizable meal boxes (Starter/Voyager/Bunker) |
| **B2C One-Time** | Individual product purchases and gift boxes |
| **B2B Wholesale** | Dealer portal with tiered pricing, PO workflow, net terms |
| **Gift Cards** | Digital gift card purchase and redemption |
| **Vending** | "Virtual Distributor" QR-code-based vending machine sales |
| **Specialty** | Aviation, marine, camping, disaster preparedness markets |

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | Next.js 16 (App Router) + React 19 + Tailwind CSS 4 |
| **Backend/DB** | Supabase (PostgreSQL, Auth, RLS, Edge Functions, Storage) |
| **Payments** | Stripe (Billing, Checkout, Connect, Invoicing) |
| **Automation** | n8n (order fulfillment, inventory alerts, reminders) |
| **AI** | Google Gemini 2.5 Flash (chat), Imagen 4.0 (product images) |
| **Deployment** | Vercel (frontend), Supabase Cloud (backend) |

## Quick Start

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # Production build
npm run lint         # ESLint
npx playwright test  # E2E tests (166 tests)
```

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Google AI
GOOGLE_GEMINI_API_KEY=

# n8n Automation
N8N_API_KEY=
N8N_API_URL=
N8N_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Project Metrics

| Metric | Count |
|--------|-------|
| **Routes** | 96 |
| **Source Files** | 170 |
| **Lines of Code** | 51,563 |
| **UI Components** | 22 |
| **Pages** | 50 |
| **API Endpoints** | 45 |
| **Edge Functions** | 7 |
| **Custom Hooks** | 7 |
| **Lib Modules** | 35 |
| **Database Tables** | 42+ |
| **DB Migrations** | 6 |
| **E2E Tests** | 166 (15 files) |
| **n8n Workflows** | 3 |
| **Storefronts** | 4 |
| **Languages** | 4 (EN/ES/FR/PT) |
| **Currencies** | 4 (USD/MXN/EUR/BRL) |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Next.js 16)             │
│  Landing · Products · Build-a-Box · Dashboard       │
│  Admin Panel · B2B Portal · Gift Cards · Checkout   │
│  Ask Aura Chat Widget                               │
├─────────────────────────────────────────────────────┤
│                    API Layer (32 routes)             │
│  Products · Orders · Subscriptions · Inventory      │
│  Pricing · Promotions · Gift Cards · Reviews        │
│  Chat · Notifications · Webhooks · Cron             │
├─────────────────────────────────────────────────────┤
│              Supabase Edge Functions (7)             │
│  resolve-price · validate-promo · process-order     │
│  redeem-gift-card · dealer-commission               │
│  subscription-webhook · generate-product-image      │
├─────────────────────────────────────────────────────┤
│              Pricing Engine (src/lib/pricing/)       │
│  Price Lists → Volume Breaks → Promotions           │
│  Subscribe & Save · B2B Contracts · Credits         │
├─────────────────────────────────────────────────────┤
│           AI Engine (src/lib/ai/)                    │
│  Embeddings · Recommendations · Smart Fill          │
│  pgvector Similarity · Taste Profiles               │
├─────────────────────────────────────────────────────┤
│           Shipping (src/lib/shipping/)               │
│  EasyPost · Mock Mode · Rates · Labels · Tracking   │
├─────────────────────────────────────────────────────┤
│                 Supabase (PostgreSQL)                │
│  42+ tables · RLS · Triggers · pgvector · Realtime  │
├─────────────────────────────────────────────────────┤
│               External Integrations                  │
│  Stripe · n8n · Gemini AI · Imagen 4.0 · Twilio    │
└─────────────────────────────────────────────────────┘
```

## Key Features

### Consumer (B2C)
- **Build-a-Box**: Visual slot grid, dietary filters, AI-powered "Smart Fill"
- **Subscribe & Save**: 14-17% savings vs one-time purchases
- **Product Detail**: Image gallery, variants, FDA nutrition facts, reviews, Aura Academy recipes
- **Product Catalog**: Dietary badges, allergen filtering, reviews, shelf-life info
- **AI Recommendations**: pgvector similarity search, personalized suggestions, "You Might Also Like"
- **Ask Aura**: AI chat assistant powered by Gemini for recommendations and support
- **Aura Academy**: Chef-crafted recipes with step-by-step instructions, ingredient checklists
- **Gift Cards**: Purchase, send, and redeem digital gift cards
- **Wishlist**: Save favorite products with heart toggles, dedicated wishlist page
- **Global Search**: Spotlight-style search (Cmd+K) across products, recipes, categories
- **Order Tracking**: Visual timeline with carrier tracking and status updates
- **Realtime Updates**: Live order status changes via Supabase Realtime
- **Multi-Storefront**: Themed niche stores (Camping, Marine, Preparedness)
- **Dashboard**: Order history, subscription management, notification preferences

### Business (B2B)
- **Dealer Portal**: Commission tracking, tier progress, analytics dashboard
- **Volume Pricing**: Quantity break tables, per-org price lists, contract pricing
- **PO Workflow**: Submit → Approve → Invoice → Ship → Deliver with status timeline
- **Multi-Location**: Manage orders across multiple sites (gyms, marinas, retail)
- **Quick Reorder**: One-click repeat orders, saved templates
- **Referral System**: QR codes, commission attribution, Virtual Distributor model

### Admin
- **Dashboard**: Revenue stats, alerts, recent orders
- **Product CRUD**: Create, edit, deactivate products with full metadata
- **Order Management**: Status updates, tracking numbers, internal notes
- **Inventory**: Color-coded stock levels, inline editing, low-stock alerts
- **Customer Management**: Role changes, credit adjustments, order history
- **Dealer Management**: Organizations, tiers, commission tracking
- **Notifications**: Send manual notifications, view all comms across channels

### Automation
- **n8n Workflows**: Order fulfillment → WMS, low-stock alerts → Suzazon PO, subscription reminders
- **Cron Jobs**: Low stock checks, subscription reminders, abandoned cart recovery
- **Webhook Receivers**: Stripe events, n8n callbacks, shipping carrier updates
- **Event Logging**: All automation events logged to omni_interaction_log for CRM

## Database Schema

### Core Tables
| Table | Purpose |
|-------|---------|
| `profiles` | Users with role (customer/dealer/admin), credits, dietary prefs |
| `organizations` | B2B orgs with tier, commission rate, payment terms, credit limit |
| `aura_products` | Catalog with dietary labels, allergens, shelf life, embeddings |
| `aura_subscriptions` | Subscriptions with box_config, delivery schedule |
| `aura_orders` | All orders with purchase_type, dealer attribution |
| `dealers` | Dealer accounts with referral codes, commission tracking |
| `inventory` | Warehouse stock with safety levels and reorder points |

### Pricing Tables
| Table | Purpose |
|-------|---------|
| `price_lists` | Named price lists by channel/role/tier |
| `price_list_entries` | Per-product/category pricing with volume breaks |
| `promotions` | Discount rules (%, fixed, BOGO, volume, bundle) |
| `b2b_contracts` | Contract pricing with effective dates |

### Product Enrichment
| Table | Purpose |
|-------|---------|
| `product_variants` | Size/flavor variants |
| `product_bundles` | Pre-made and custom bundles |
| `product_nutrition` | FDA-structured nutrition facts |
| `product_reviews` | Customer reviews with food-specific ratings |
| `product_relationships` | Cross-sells, "pairs well with" |

### Commerce
| Table | Purpose |
|-------|---------|
| `gift_cards` | Gift card codes, balances, recipients |
| `credit_ledger` | Loyalty points transaction log |
| `referrals` | Referral tracking and rewards |
| `commission_transactions` | Dealer commission ledger |

## Documentation

| Document | Description |
|----------|-------------|
| [BRD](docs/BRD-OMNI-2025-V2.md) | Business requirements, objectives, KPIs, GTM strategy |
| [PRD](docs/PRD-AURA-2025-V1.md) | Product requirements, user personas, functional specs |
| [CHANGELOG](CHANGELOG.md) | Version history and feature log |
| [UI/UX Research](claudedocs/ui-ux-research-report.md) | Design patterns from HelloFresh, Factor, Daily Harvest |
| [B2B Research](claudedocs/b2b-portal-research-report.md) | B2B portal analysis from Sysco, Faire, Amazon Business |
| [CLAUDE.md](CLAUDE.md) | Development guide for AI-assisted coding |

## Supply Chain

```
Suzazon Mexico (Manufacturing)
       ↓
El Paso TX Warehouse (Fulfillment)
       ↓
USPS/UPS → Customer Delivery (USA)
```

- n8n monitors inventory → auto-generates POs to Suzazon when stock < safety level
- Shipping carrier webhooks update order tracking in real-time

## Admin Access

```
Email: admin@inspiration-ai.com
Password: Inssigma@2
URL: http://localhost:3000/admin
```

## License

Proprietary — All rights reserved.
