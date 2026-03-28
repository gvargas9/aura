# Lessons Learned

Technical lessons and decisions from the Aura platform build.

## Bugs & Root Causes

### Admin Layout Infinite Loading (Critical)
- **Symptom**: `/admin` page showed infinite loading spinner, never rendered content
- **Root Cause**: The `useAuth()` hook uses `useCallback` + `onAuthStateChange` with complex dependency chains. When used in a Next.js 16 App Router `layout.tsx` with Turbopack, the hook never completes hydration — the component mounts but `getSession()` never resolves on the client.
- **Fix**: Replaced `useAuth()` in admin layout with a direct `useEffect` → `getSession()` → `fetchProfile()` flow. Simple, no dependency chains.
- **Rule**: Do NOT use `useAuth()` in `layout.tsx` files. Use direct Supabase calls.

### Login Page Invisible Text
- **Symptom**: Text on login form was invisible
- **Root Cause**: `globals.css` had `prefers-color-scheme: dark` media query setting `--foreground-rgb` to white. Since the Card component uses `bg-white`, users with system dark mode saw white text on white background.
- **Fix**: Added explicit `text-gray-900` to all form elements and the Input component. Added `bg-white` to input element itself.
- **Rule**: Always set explicit text colors — never rely on inherited body color.

### RLS Infinite Recursion on Profiles
- **Symptom**: Supabase queries to `profiles` table hung or returned 406
- **Root Cause**: RLS policy "Admins can view all profiles" used `is_admin()` function which queries `profiles` table, causing recursive policy evaluation.
- **Fix**: Made `is_admin()` a `SECURITY DEFINER` function (bypasses RLS when executing). Keep simple `auth.uid() = id` policies separate from admin policies.
- **Rule**: Never create RLS policies that query the same table they protect without SECURITY DEFINER functions.

### Missing Profile After User Creation
- **Symptom**: 406 error on profile fetch after admin user creation
- **Root Cause**: `create-admin.mjs` created auth user with service role but profile upsert went through a different client path, blocked by RLS.
- **Fix**: Inserted profile directly via psql/service role connection.
- **Rule**: When creating users programmatically, always create the profile record with the service role client.

## Patterns That Worked Well

### Parallel Agent Dispatch
- Dispatching 2-3 specialized agents (frontend, backend, testing) in parallel dramatically sped up development
- Each agent gets full context about the codebase, database schema, and existing patterns
- Build check after each agent completes catches integration issues early

### Research Before Implementation
- Dispatching research agents (deep-research-agent) before implementation agents produced significantly better results
- UI/UX research from HelloFresh/Factor/Daily Harvest directly informed component design
- B2B research from Sysco/Faire/Amazon Business identified features we wouldn't have thought of

### Supabase Edge Functions for Critical Paths
- Price resolution and order creation as Edge Functions keeps them close to the database
- Fire-and-forget pattern for n8n integration (never blocks the main flow)
- CORS headers + JWT validation as shared utilities reduce boilerplate

### Database-First Approach
- Building comprehensive schema with migrations before writing UI/API code
- TypeScript types generated from schema ensure type safety across the stack
- RLS policies as defense-in-depth alongside API-level auth checks

## Architecture Decisions

### Why NOT useAuth() in Layouts
Next.js 16 Turbopack has issues with hooks that have complex dependency chains in `layout.tsx` files. The `useAuth()` hook creates new `createBrowserClient()` instances, uses `useCallback` with the client as a dependency, and subscribes to `onAuthStateChange`. This creates an unstable dependency graph that Turbopack can't properly hydrate.

### Why Fire-and-Forget for n8n
n8n is an external dependency that can be down. Order creation, subscription management, and checkout must NEVER fail because n8n is unreachable. All n8n calls use try/catch with console.error logging — the app functions fully without n8n.

### Why Price Resolution as Edge Function
Price resolution involves multiple database queries (contracts, price lists, entries, quantity breaks). Running this at the edge (close to the Supabase database) minimizes latency. The Edge Function can also be called by external systems (vending machines, partner APIs) without going through Next.js.

### Why Deno for Edge Functions
Supabase Edge Functions run on Deno. The `supabase/functions/` directory is excluded from `tsconfig.json` to prevent Next.js from trying to compile Deno imports. Each function is self-contained with URL-based imports.

## Common Pitfalls

1. **Don't use `createClient()` outside of components/hooks** — it creates a new instance every call. In layouts, create it once in a `useEffect`.
2. **Don't add `/admin` to middleware's protected paths** — the admin layout handles its own auth. Middleware redirect strips the session context.
3. **Always check `is_active` on products** — seed data defaults to active, but soft-deleted products have `is_active = false`.
4. **Gift card codes are case-insensitive** — always use `.toUpperCase()` when comparing.
5. **The `Json` type from database.ts** — when passing objects to Supabase insert/update that expect `Json`, cast with `as unknown as Json`.
6. **Product images** — stored in Supabase Storage `media/products/` bucket. The Next.js image config allows `*.supabase.co` domains.
7. **Embedding model naming** — Google renamed models; `text-embedding-004` doesn't exist in v1beta. Use `gemini-embedding-001` and check available models via ListModels API.
8. **pgvector dimension limits** — IVFFlat max 2000 dims, HNSW also max 2000. Always truncate Gemini embeddings (3072) to 1536.
9. **Storefront theming** — use CSS custom properties, not Tailwind classes, for dynamic per-storefront colors. Tailwind classes are compile-time only.
10. **Supabase Realtime** — must enable replication for tables in Supabase dashboard (Database > Replication). Without this, realtime hooks receive no events.
11. **Agent directory creation** — subagents can't always create new directories. Pre-create directory structures before dispatching agents.

## Architecture Decisions (Phase 2)

### Why pgvector for Recommendations (not external ML service)
Keeping recommendations in-database with pgvector means zero additional infrastructure, sub-millisecond similarity queries, and the ability to join recommendations with product data in a single query. Adequate for the current catalog size (<1000 products). Would need a dedicated vector DB (Pinecone, Weaviate) only at 100K+ products.

### Why CSS Custom Properties for Storefronts (not Tailwind)
Tailwind classes are compiled at build time. Dynamic storefront themes need runtime color changes. CSS custom properties (`--sf-primary`) can be set via inline styles and cascade to all children, making per-storefront theming work without rebuilding.

### Why Truncate Embeddings to 1536 (not use full 3072)
Gemini's `gemini-embedding-001` outputs 3072 dimensions. pgvector indexes (IVFFlat, HNSW) support max 2000 dimensions. Truncating to 1536 loses some information but maintains strong similarity performance — research shows truncated embeddings retain 95%+ of their discriminative power for top-k retrieval.

### Why Mock Mode for Shipping
Not all development environments have EasyPost API keys. Mock mode returns realistic carrier data so the full checkout → shipping → tracking flow can be developed and tested without credentials. The `mock: true` flag in responses lets the UI optionally indicate demo mode.
