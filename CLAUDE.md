# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev          # Start development server (Next.js on localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Environment Variables

Required in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=         # Server-side only, bypasses RLS

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STARTER=              # Stripe Price IDs for each box tier
STRIPE_PRICE_VOYAGER=
STRIPE_PRICE_BUNKER=

# App
NEXT_PUBLIC_APP_URL=

# n8n (automation)
N8N_WEBHOOK_URL=
```

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 16 (App Router) + React 19 + Tailwind CSS 4
- **Backend**: Supabase (Postgres, Auth, RLS)
- **Payments**: Stripe (subscriptions, checkout, webhooks)
- **Automation**: n8n workflows

### Key Patterns

**Supabase Client Usage** (critical for correct auth):
```typescript
// Browser components
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();

// Server Components & API Routes (async - uses cookies())
import { createClient } from "@/lib/supabase/server";
const supabase = await createClient();

// Webhooks (bypasses RLS with service role)
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!);
```

**Route Protection** (defined in `src/lib/supabase/middleware.ts`):
- Protected: `/dashboard`, `/account`, `/checkout`, `/orders` → redirects to `/auth/login`
- Admin: `/admin` → role check handled in page component

**Utility Functions** (`src/lib/utils.ts`):
- `cn()` - Tailwind class merging (clsx + tailwind-merge)
- `formatCurrency()` - USD formatting
- `formatDate()` - Readable date strings

### Core Data Flow: Build-a-Box → Checkout

1. User selects box size from `BOX_CONFIGS` (`src/types/index.ts`)
2. Fills slots with products from `aura_products` table
3. Box config stored in localStorage → redirect to `/checkout`
4. `/api/checkout` creates Stripe Checkout Session with box metadata
5. Stripe webhook (`/api/webhooks/stripe`) creates `aura_subscriptions` + `aura_orders`

### Box Tiers

| Tier | Slots | Price/mo |
|------|-------|----------|
| Starter | 8 | $59.99 |
| Voyager | 12 | $84.99 |
| Bunker | 24 | $149.99 |

### Database Schema (Key Tables)

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles with role (customer/dealer/admin), credits |
| `organizations` | B2B dealer organizations with Stripe Connect |
| `aura_products` | Product catalog with `is_bunker_safe`, nutritional info |
| `aura_subscriptions` | User subscriptions with `box_config` (product ID array) |
| `aura_orders` | Orders with dealer attribution, shipping address |
| `dealers` | Dealer accounts with referral codes, commission tracking |
| `inventory` | Warehouse inventory with safety stock levels |

### Path Alias

`@/*` → `./src/*`

## n8n Workflows

Located in `/workflows/`:
- `order-fulfillment.json`: New order → WMS → status update → email
- `low-stock-alert.json`: Every 6h → inventory check → PO generation
- `subscription-reminder.json`: Daily → 7-day reminder emails/SMS
