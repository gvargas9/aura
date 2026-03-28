# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev          # Start development server (Next.js on localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npx playwright test  # Run E2E tests (166 tests)
npx playwright test --headed  # Run tests with visible browser
```

## Environment Variables

Required in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=         # Server-side only, bypasses RLS
DATABASE_URL=                      # Direct Postgres connection

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STARTER=              # Stripe Price IDs for each box tier
STRIPE_PRICE_VOYAGER=
STRIPE_PRICE_BUNKER=

# Google AI
GOOGLE_GEMINI_API_KEY=             # Gemini 2.5 Flash (chat) + Imagen 4.0 (images)

# n8n Automation
N8N_API_KEY=
N8N_API_URL=                       # e.g., https://automation.inspiration-ai.com
N8N_WEBHOOK_SECRET=                # Shared secret for n8n webhook auth
CRON_SECRET=                       # Secret for cron endpoint auth

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Aura
```

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 16 (App Router) + React 19 + Tailwind CSS 4
- **Backend**: Supabase (Postgres 38+ tables, Auth, RLS, Edge Functions, Storage)
- **Payments**: Stripe (subscriptions, checkout, webhooks, Connect for B2B)
- **Automation**: n8n workflows (order fulfillment, inventory, reminders)
- **AI**: Google Gemini 2.5 Flash (chat), Imagen 4.0 (product images)

### Key Patterns

**Supabase Client Usage** (critical for correct auth):
```typescript
// Browser components
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();

// Server Components & API Routes (async - uses cookies())
import { createClient } from "@/lib/supabase/server";
const supabase = await createClient();

// Webhooks & Edge Functions (bypasses RLS with service role)
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!);
```

**Admin Layout Auth** (important — do NOT use useAuth() hook in admin layout):
```typescript
// The admin layout at src/app/admin/layout.tsx uses direct Supabase calls
// instead of useAuth() to avoid hydration issues in Next.js 16 Turbopack.
// DO NOT change this back to useAuth() — it will cause infinite loading.
useEffect(() => {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
  // ...
}, []);
```

**API Route Auth Helper** (`src/lib/api/auth.ts`):
```typescript
import { requireAuth, requireAdmin, isAuthError } from "@/lib/api/auth";
const auth = await requireAdmin(supabase);
if (isAuthError(auth)) return auth.response;
// auth.user and auth.profile are available
```

**Route Protection** (defined in `src/lib/supabase/middleware.ts`):
- Protected: `/dashboard`, `/account`, `/checkout`, `/orders` → redirects to `/auth/login`
- Admin: `/admin` → role check handled in layout component (NOT middleware)
- B2B Portal: `/b2b/portal` → role check in layout (dealer or admin)

**Pricing Engine** (`src/lib/pricing/`):
```typescript
import { resolvePrice, resolveCartPricing } from "@/lib/pricing/engine";
import { validateCouponCode, applyPromotions } from "@/lib/pricing/promotions";
import { getBoxPricing } from "@/lib/pricing/subscription";
```

**n8n Integration** (`src/lib/n8n/`):
```typescript
import { triggerOrderFulfillment, triggerLowStockAlert } from "@/lib/n8n";
// Fire-and-forget — never throws, never blocks
```

### Utility Functions (`src/lib/utils.ts`)
- `cn()` — Tailwind class merging (clsx + tailwind-merge)
- `formatCurrency()` — USD formatting
- `formatDate()` — Readable date strings

### Core Data Flow: Build-a-Box → Checkout

1. User selects box size from `BOX_CONFIGS` (`src/types/index.ts`)
2. Toggles subscription vs one-time (14-17% savings for subscription)
3. Fills slots with products, can use dietary filters
4. Box config stored in localStorage → redirect to `/checkout`
5. Checkout applies: promo code, gift card, credits
6. `/api/checkout` creates Stripe Checkout Session with box metadata
7. Stripe webhook creates `aura_subscriptions` + `aura_orders`
8. n8n triggered for order fulfillment → WMS

### Box Tiers

| Tier | Slots | Subscription | One-Time | Savings |
|------|-------|-------------|----------|---------|
| Starter | 8 | $59.99/mo | $69.99 | 14% |
| Voyager | 12 | $84.99/mo | $99.99 | 15% |
| Bunker | 24 | $149.99/mo | $179.99 | 17% |

### Database Schema (Key Tables — 38+ total)

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles with role (customer/dealer/admin), credits, dietary prefs |
| `organizations` | B2B dealer orgs with tier, commission rate, payment terms |
| `aura_products` | Product catalog with dietary labels, allergens, shelf life |
| `aura_subscriptions` | Subscriptions with `box_config` (product ID array) |
| `aura_orders` | Orders with purchase_type, dealer attribution |
| `dealers` | Dealer accounts with referral codes, commission tracking |
| `inventory` | Warehouse inventory with safety stock levels |
| `price_lists` / `price_list_entries` | Multi-tier pricing engine |
| `promotions` / `promotion_redemptions` | Discount rules and tracking |
| `product_variants` | Size/flavor variants per product |
| `product_reviews` | Customer reviews with food-specific ratings |
| `gift_cards` / `gift_card_transactions` | Gift card system |
| `credit_ledger` | Loyalty points/credits ledger |
| `b2b_contracts` | B2B contract pricing with effective dates |
| `omni_interaction_log` | All communications (CRM backbone) |

### Supabase Edge Functions (in `supabase/functions/`)

| Function | Purpose |
|----------|---------|
| `resolve-price` | Multi-layer price resolution at the edge |
| `validate-promo` | Coupon validation with stacking rules |
| `process-order` | Universal order creation across all channels |
| `redeem-gift-card` | Atomic gift card redemption |
| `generate-product-image` | On-demand Imagen 4.0 generation |
| `subscription-webhook` | Subscription lifecycle handler |
| `dealer-commission` | Commission calculation and tracking |

### Path Alias

`@/*` → `./src/*`

### Testing

- **Framework**: Playwright (E2E)
- **Test directory**: `tests/e2e/`
- **Auth helper**: `tests/e2e/helpers/auth.ts` — `loginAsAdmin(page)`
- **Admin credentials**: `admin@inspiration-ai.com` / `Inssigma@2`
- **Every new feature MUST have Playwright tests**

### Gotchas

1. **Admin layout**: Must use direct Supabase calls, NOT useAuth() hook — Turbopack hydration bug
2. **Edge Functions**: Use Deno syntax (import from URLs), excluded from tsconfig.json
3. **RLS on profiles**: The `is_admin()` function is SECURITY DEFINER — don't create policies that recursively query profiles
4. **Color palette**: Defined in BOTH `tailwind.config.ts` AND `globals.css @theme` — keep them in sync
5. **Supabase region**: us-east-1 (project: qshpheimnzpkqgerikwh)
6. **n8n calls are fire-and-forget**: Never throw on n8n failure — the app must work without n8n

## n8n Workflows

Located in `/workflows/` and deployed to `automation.inspiration-ai.com`:
- `order-fulfillment.json`: New order → WMS → status update → email
- `low-stock-alert.json`: Every 6h → inventory check → PO generation → Suzazon email
- `subscription-reminder.json`: Daily → 7-day reminder emails/SMS via Twilio

## Scripts

- `scripts/generate-product-images.mjs` — Generate product images with Imagen 4.0, upload to Supabase Storage
- `create-admin.mjs` — Create admin user account
