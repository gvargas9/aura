# Aura — Production Deployment Guide

## Prerequisites
- Vercel account connected to GitHub repo
- Supabase project (qshpheimnzpkqgerikwh) already provisioned
- Stripe account with live API keys
- Domain name configured

## Environment Variables (Set in Vercel Dashboard)

### Required
| Variable | Description | Example |
|----------|-------------|---------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase project URL | https://qshpheimnzpkqgerikwh.supabase.co |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase anonymous key | eyJ... |
| SUPABASE_SERVICE_ROLE_KEY | Supabase service role key (server only) | eyJ... |
| DATABASE_URL | Direct Postgres connection | postgresql://... |
| STRIPE_SECRET_KEY | Stripe live secret key | sk_live_... |
| STRIPE_WEBHOOK_SECRET | Stripe webhook signing secret | whsec_... |
| STRIPE_PRICE_STARTER | Stripe Price ID for Starter box | price_... |
| STRIPE_PRICE_VOYAGER | Stripe Price ID for Voyager box | price_... |
| STRIPE_PRICE_BUNKER | Stripe Price ID for Bunker box | price_... |
| GOOGLE_GEMINI_API_KEY | Google AI API key | AI... |
| N8N_API_URL | n8n webhook base URL | https://automation.inspiration-ai.com |
| N8N_WEBHOOK_SECRET | n8n webhook shared secret | ... |
| CRON_SECRET | Cron endpoint auth secret | ... |
| NEXT_PUBLIC_APP_URL | Production URL | https://aura.yourdomain.com |
| NEXT_PUBLIC_APP_NAME | App display name | Aura |

### Optional
| Variable | Description |
|----------|-------------|
| MENUMASTER_API_URL | MenuMaster CRM URL |
| MENUMASTER_API_TOKEN | MenuMaster API token |
| MENUMASTER_BUSINESS_ID | MenuMaster business ID |
| EASYPOST_API_KEY | EasyPost shipping API key |

## Deployment Steps

1. **Connect to Vercel**
   ```bash
   npx vercel link
   ```

2. **Set environment variables**
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   # ... repeat for each variable
   ```
   Or set them in the Vercel Dashboard > Settings > Environment Variables

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Configure Stripe Webhooks**
   - Go to Stripe Dashboard > Developers > Webhooks
   - Add endpoint: `https://your-domain.com/api/webhooks/stripe`
   - Select events: checkout.session.completed, customer.subscription.*, invoice.*

5. **Configure Cron Jobs**
   Vercel Cron is configured in `vercel.json`. Verify cron jobs are running:
   - Subscription reminders (daily 3 PM UTC)
   - Low stock check (every 6 hours)
   - Abandoned cart recovery (daily 6 PM UTC)
   - Demand forecast (weekly Monday 3 AM UTC)
   - Churn scoring (weekly Monday 4 AM UTC)

6. **DNS Configuration**
   - Point your domain to Vercel
   - Add CNAME record: `cname.vercel-dns.com`

7. **Verify**
   - [ ] Homepage loads
   - [ ] Products page shows catalog
   - [ ] Auth flow works (signup, login)
   - [ ] Stripe checkout completes
   - [ ] AI chat responds
   - [ ] Admin panel accessible
   - [ ] Sitemap at /sitemap.xml
   - [ ] Robots.txt at /robots.txt

## Architecture Notes

- **Region**: `iad1` (US East) — co-located with Supabase us-east-1
- **Headers**: Security headers and API cache-control are configured in `next.config.ts` (not duplicated in vercel.json)
- **Cron auth**: All `/api/cron/*` routes validate the `CRON_SECRET` header. Vercel automatically sends this for cron invocations.
- **Mobile app**: The `/mobile` directory (Expo) is excluded from Vercel builds via `ignoreCommand`
- **Sitemap/Robots**: Handled natively by Next.js App Router (no rewrites needed)
