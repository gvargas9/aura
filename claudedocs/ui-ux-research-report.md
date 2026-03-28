# Premium Food Subscription UI/UX Research Report

**Date**: March 27, 2026
**Subject**: UI/UX Patterns for Premium Food Subscription & Ecommerce Platforms
**Scope**: Landing pages, product pages, build-a-box UX, dashboard UX, modern trends, mobile-first, accessibility
**Confidence Level**: HIGH -- based on established patterns from HelloFresh, Factor, Daily Harvest, ButcherBox, Thrive Market, Sakara Life, and current ecommerce design trends

---

## Executive Summary

After analyzing the leading food subscription platforms and current ecommerce design trends, this report identifies **42 specific, actionable recommendations** for the Aura platform. The findings are organized into 7 research areas with concrete implementation guidance mapped to your existing Next.js + Tailwind + Supabase stack.

**Key Themes Across All Top Platforms**:
1. Photography-first design -- hero sections are dominated by high-quality food imagery, not icons or illustrations
2. Progressive disclosure -- information is layered, not dumped. Users see what they need at each decision point
3. Urgency and social proof are woven into every section, not bolted on
4. The build-a-box experience is the product -- the selection UX IS the brand experience
5. Mobile is not a responsive afterthought; it is the primary design target

---

## 1. Landing Page Analysis: What Makes Top Food Subscriptions Convert

### 1.1 Hero Section Patterns

**What the leaders do**:

| Platform | Hero Approach | CTA Style | Key Differentiator |
|----------|--------------|-----------|-------------------|
| HelloFresh | Full-bleed food photography with overlay text | Single primary CTA "Get Started" + pricing anchor | Shows actual meal with steam/texture |
| Factor | Split hero: left copy, right rotating meal cards | "Select Your Plan" with plan toggle visible | Calorie/macro badges visible in hero |
| Daily Harvest | Video background of ingredients being prepared | "Get Started" with flavor quiz option | Ingredient transparency from first scroll |
| ButcherBox | Dark, premium aesthetic with meat close-ups | "Get Your Custom Box" | Quality certifications in hero |
| Sakara Life | Lifestyle photography (people eating, not just food) | "Start Your Journey" with quiz | Aspirational, wellness-focused |
| Thrive Market | Value-first: "Save X% on organic" | "Start Saving" with membership price | Price comparison visible immediately |

**Critical gap in Aura's current hero**: The hero uses a placeholder box icon and decorative floating cards instead of actual food photography. Every top-converting food subscription leads with mouth-watering product imagery. The current hero reads more like a SaaS product than a premium food brand.

**Recommended hero structure for Aura**:
```
[Full-width section]
  [Left 55%]
    - Badge: "Premium Shelf-Stable Food" (keep existing)
    - H1: Keep "Energy, Anywhere." headline (strong)
    - Subtext: Emphasize taste + convenience (already good)
    - Primary CTA: "Build Your Box" (keep)
    - Secondary CTA: Change from "Watch Video" to "Take the Quiz" (higher conversion)
    - Trust signals row: Keep existing, add "4.9 stars | 10K+ customers" inline
  [Right 45%]
    - Hero image: High-quality photo of an open Aura box with meals visible
    - OR: Rotating carousel of 3-4 actual meal photos
    - Floating badge: Keep the rating card (effective pattern)
    - Remove: The icon-based box placeholder entirely
```

### 1.2 Social Proof Patterns

**What converts**:
- **Real customer photos** (not avatars/initials) -- Sakara and Factor both use real headshots
- **Video testimonials** -- HelloFresh embeds 15-second customer clips
- **Trust badge bar** immediately below the fold: "As seen in..." with media logos
- **Real-time social proof**: "Sarah from Austin just ordered..." notification toasts
- **Specific numbers** beat vague claims: "Saved 4.2 hours per week" vs "Saves time"

**Aura gap**: Testimonials use initials (SM, DR, JK) instead of photos. Stats section is generic. No media mentions or press logos.

**Recommendations**:
1. Replace avatar initials with real customer photos (or AI-generated realistic avatars as placeholder)
2. Add a "Featured In" press bar between hero and stats (even if bootstrapped: "Food & Wine", "Gear Patrol", etc.)
3. Make stats section count-up animated on scroll (Intersection Observer + number animation)
4. Add a live notification toast: "Someone in [city] just built their box" (use Supabase realtime or fake it tastefully)

### 1.3 Pricing Section Patterns

**What leaders do differently from Aura's current approach**:

- **Toggle between billing frequencies**: Monthly vs. every 2 weeks vs. one-time (Factor, HelloFresh)
- **Per-serving price prominence**: The per-meal price is larger than the total -- $6.25/meal is the anchor, not $149.99/mo
- **Feature comparison table**: Not just slot count, but what's included (free shipping, priority support, etc.)
- **"Most Popular" badge**: Aura has this (good) but should add "Best Value" to Bunker tier

**Specific changes for Aura pricing cards**:
```
Current:  $149.99/mo  (large)  →  24 Premium Meals  →  Only $6.25 per meal (small)
Better:   $6.25/meal  (large)  →  24 Premium Meals  →  $149.99/mo billed monthly (small)
```

### 1.4 CTA Hierarchy

**Pattern from top performers**: Every scroll-section ends with a CTA. The page has a "CTA cadence":
1. Hero CTA (primary action)
2. After social proof: "Join 10,000+ happy customers"
3. After pricing: "Start Building"
4. After features: "See How It Works"
5. Final CTA: Full-width dark section with urgency ("Your first box ships free")

Aura currently has: Hero CTA, pricing CTA, and final CTA. Missing the mid-page reinforcements.

---

## 2. Product Detail Pages: Premium Food Brand Standards

### 2.1 Information Architecture

**The gold standard (Factor + Daily Harvest + Sakara)**:

```
[Product Detail Page Layout]

[Sticky top bar on scroll: Product name | Price | "Add to Box" CTA]

[Image Gallery]                    [Product Info]
  - Primary: Large hero shot         - Category badge
  - Secondary: Ingredients flat-lay  - Product name (H1)
  - Tertiary: Nutritional panel      - Short description
  - Quaternary: Lifestyle/context    - Star rating + review count
                                     - Price with per-serving calc
                                     - Dietary badges row:
                                       [Organic] [Non-GMO] [Gluten-Free]
                                       [Shelf-Stable] [High Protein]
                                     - "Add to Box" primary CTA
                                     - Quantity selector

[Tabbed content below fold]
  Tab 1: Nutrition Facts (standard label format)
  Tab 2: Ingredients (with allergen highlights)
  Tab 3: How to Prepare
  Tab 4: Reviews

[Recommended Pairings]
  "Pairs Well With" horizontal scroll of 4-6 products

[Recently Viewed]
```

### 2.2 Nutritional Information Display

**Best practices from premium food brands**:

- **Standard FDA nutrition label** format (users recognize and trust this format)
- **Macro badges** at top: Calories, Protein, Carbs, Fat as pill badges
- **Allergen warnings** in a distinct colored callout box (amber/yellow background)
- **Ingredient list** with bold allergens (FDA requirement pattern)
- **Dietary certification badges**: Row of visual icons
  - Shelf-Stable (clock icon)
  - Non-GMO (leaf icon)
  - No Preservatives (shield icon)
  - High Protein (flame icon)
  - Organic (certified badge)

**For Aura specifically** -- the `is_bunker_safe` field should be displayed as a premium badge:
```
[Shield icon] BUNKER CERTIFIED
Rated for 2+ year shelf life in any storage condition
```

### 2.3 Product Image Treatment

**Patterns from top food ecommerce**:

| Aspect | Recommendation |
|--------|---------------|
| Aspect ratio | 1:1 (square) for grid, 4:3 for detail hero |
| Background | Clean white or soft gradient (not busy patterns) |
| Hover effect | Subtle 5% scale-up with 0.3s ease (Aura already has this) |
| Image count | Minimum 3 per product: hero, ingredients, nutrition label |
| Lazy loading | Use Next.js Image with blur placeholder |
| Overlay on hover | Semi-transparent gradient from bottom with quick-add CTA |
| Badge positioning | Top-left corner (discount), bottom-right (quick add) |

### 2.4 Reviews Display

**What ButcherBox and Thrive Market do well**:
- Star distribution bar chart (5-star: 78%, 4-star: 15%, etc.)
- "Verified Purchase" badge on reviews
- Photo reviews get priority display
- Helpful vote system ("Was this helpful? Yes / No")
- Filter by rating and dietary preference

---

## 3. Build-a-Box / Meal Selector UX

This is the most critical flow for Aura. The build-a-box IS the core product experience.

### 3.1 Selection Paradigm Analysis

| Platform | Selection Method | Key UX Pattern |
|----------|-----------------|----------------|
| HelloFresh | Grid + click to add, sidebar counter | Progress bar showing meals selected |
| Factor | Card grid with + button overlay | Sticky bottom bar with total |
| Daily Harvest | Visual slot grid (like a tray) | Drag from catalog to slot |
| ButcherBox | Curated bundles + customize | Pre-filled suggestions |
| Sakara | Calendar-based selection | Meal-by-day planning |

### 3.2 Recommended Build-a-Box UX Overhaul for Aura

**Current Aura issues identified**:
1. The featured product section at top takes too much space before users see the product grid
2. No visual progress indicator for box filling
3. The sidebar is hidden on mobile (critical since mobile is primary traffic)
4. No dietary preference filtering (vegan, keto, high-protein, allergen-free)
5. Category tabs are not prominent enough
6. "Aura Fill" is a good feature but buried at the bottom of the sidebar
7. No drag-and-drop or visual slot representation

**Recommended architecture**:

```
[TOP BAR - Sticky]
  Box Size Toggle: [Starter 8] [Voyager 12] [Bunker 24]
  Progress: [|||||||---] 7/12 meals selected
  Price: $84.99/mo ($7.08/meal)
  [Checkout] button (disabled until complete)

[FILTER BAR - Sticky below top bar]
  [All] [Main Dishes] [Vegan] [Snacks] [Desserts] [Drinks]
  [Search icon] [Dietary filters dropdown: Gluten-Free, High-Protein, Keto, etc.]
  Sort: [Popular | Price | New]

[PRODUCT GRID - 3 columns desktop, 2 mobile]
  Each card:
    - Product image (1:1)
    - Name
    - Calories + Protein badges
    - Price
    - [+] button (turns to checkmark when added)
    - Quantity in box indicator

[STICKY SIDEBAR - Desktop only, 320px]
  "Your Box" heading
  Visual slot grid: [img][img][img][img]
                    [img][img][ + ][ + ]
                    [ + ][ + ][ + ][ + ]
  (Filled slots show product thumbnails, empty show dashed borders)

  "Let Aura Choose" button (AI fill)
  Promo code input
  Order summary (subtotal, discount, delivery, total)
  [Confirm Order] full-width CTA

[MOBILE BOTTOM SHEET - Slides up from bottom]
  Collapsed: Progress bar + price + [View Box] button
  Expanded: Full box view + checkout
```

### 3.3 Critical UX Improvements

**Visual slot filling (highest-impact change)**:
Instead of a plain list, show the box as a visual grid where each slot is a small square. As users add products, the product thumbnail fills a slot. Empty slots show a dashed border with a "+" icon. This creates a satisfying "completion" feeling.

```tsx
// Visual box grid concept
<div className="grid grid-cols-4 gap-2">
  {Array.from({ length: maxSlots }).map((_, i) => (
    <div key={i} className={cn(
      "aspect-square rounded-xl border-2 transition-all",
      selectedProducts[i]
        ? "border-aura-primary bg-aura-light"
        : "border-dashed border-gray-200 hover:border-aura-primary/50"
    )}>
      {selectedProducts[i] ? (
        <Image src={selectedProducts[i].image_url} ... />
      ) : (
        <Plus className="w-4 h-4 text-gray-300" />
      )}
    </div>
  ))}
</div>
```

**Smart recommendations**:
- After adding 3+ items, show "Based on your selections" recommendations
- Use category affinity: if user picks 3 main dishes, suggest a dessert or snack
- Show "Popular combos" section: "Customers who picked X also loved Y"

**Dietary preference filter (essential)**:
Add a multi-select filter bar for:
- Allergen-free: Gluten-Free, Dairy-Free, Nut-Free, Soy-Free
- Diet: Vegan, Vegetarian, Keto, Paleo, High-Protein
- Preference: Spicy, Mild, Sweet, Savory

### 3.4 Mobile Build-a-Box (Critical Path)

**Current mobile experience**: A fixed bottom bar with progress and two buttons. This is functional but lacks the engagement needed.

**Recommended mobile experience**:
1. **Swipeable product cards** in a horizontal carousel per category
2. **Bottom sheet** that slides up to show box contents (like Uber Eats cart)
3. **Haptic feedback** on add (navigator.vibrate on supported devices)
4. **Pull-to-refresh** for product catalog
5. **Category pills** as horizontal scrollable row (already partially implemented)
6. **Floating progress ring** in bottom-right showing fill percentage

---

## 4. Dashboard / Account Management UX

### 4.1 Subscription Management Patterns

**What HelloFresh, Factor, and Daily Harvest do**:

```
[Dashboard Layout]

[Sidebar Navigation]          [Main Content]
  Overview                      [Next Delivery Card - PROMINENT]
  My Subscription                 "Your next box ships in 3 days"
  Order History                   [Edit Box] [Skip This Week] [Pause]
  Payment Methods                 Delivery date: April 3, 2026
  Address Book                    Items: 12 meals
  Referral Program                [View/Swap Items]
  Account Settings
                                [Subscription Summary]
                                  Plan: Voyager (12 meals)
                                  Frequency: Monthly
                                  Next billing: April 1, 2026
                                  [Change Plan] [Change Frequency]

                                [Quick Actions Grid]
                                  [Swap Items] [Skip Delivery] [Pause]
                                  [Gift a Box] [Refer a Friend] [Support]

                                [Delivery Calendar]
                                  Visual calendar showing upcoming deliveries
                                  Past deliveries marked as delivered

                                [Recent Orders]
                                  Order cards with status timeline
```

### 4.2 Critical Dashboard Improvements for Aura

**Current Aura dashboard gaps**:
1. No "next delivery" prominent card (the most important information)
2. No subscription modification actions (skip, pause, swap)
3. No delivery calendar visualization
4. Quick actions are generic links, not contextual
5. No referral program surface area
6. Stats cards are plain -- no trend indicators

**Priority additions**:

1. **Next Delivery Card** (top of dashboard):
```
[Card with gradient border]
  "Your next Voyager box ships in 5 days"
  [Progress timeline: Confirmed → Preparing → Shipped → Delivered]
  Delivery estimate: April 3, 2026
  [Edit Box Items] [Skip This Delivery] [Track Package]
```

2. **Subscription Quick Actions**:
- Skip next delivery (one-click)
- Pause subscription (with "resume" date picker)
- Swap items in upcoming box (opens build-a-box with current selections pre-loaded)
- Change delivery frequency

3. **Delivery Calendar**:
- Visual monthly calendar
- Past deliveries in gray with checkmarks
- Upcoming delivery highlighted in green
- Skipped weeks shown with strike-through

4. **Referral Program Card**:
```
"Give $10, Get $10"
[Share Link] [Copy Code]
Referrals: 3 friends joined | $30 earned
```

### 4.3 Order History UX

**Best practices**:
- Order cards (not tables) on mobile
- Status timeline visualization (not just a badge)
- Re-order button on past orders
- Download invoice/receipt
- Rate your box (post-delivery feedback)

---

## 5. Modern Ecommerce UI Trends (2025-2026)

### 5.1 Visual Design Trends

**Micro-animations that increase engagement**:

| Animation | Where to Use | Implementation |
|-----------|-------------|----------------|
| Number count-up | Stats section, pricing | Intersection Observer + requestAnimationFrame |
| Staggered card entrance | Product grids, features | CSS animation-delay with slideUp |
| Button press feedback | All CTAs | scale(0.97) on :active, 100ms |
| Cart add celebration | Box builder + button | Confetti burst or checkmark animation |
| Progress bar fill | Box builder progress | CSS transition width with spring easing |
| Skeleton loading | All data-fetching pages | Pulsing gray placeholder shapes |
| Parallax scroll | Hero section background | CSS transform with scroll listener |
| Hover card lift | Product cards | translateY(-4px) + shadow increase (Aura has this) |
| Image zoom on hover | Product detail gallery | Scale 1.1 with overflow hidden |
| Smooth page transitions | Route changes | Next.js View Transitions API |

**Glassmorphism** (used sparingly for premium feel):
- Header on scroll: `bg-white/80 backdrop-blur-xl` (Aura already has glass utility classes)
- Floating cards/badges: Semi-transparent background with blur
- Modal overlays: Frosted glass effect
- Do NOT overuse -- glassmorphism works for overlays and floating elements, not primary content

**Gradient usage in 2025-2026**:
- Subtle mesh gradients for section backgrounds (not flat colors)
- Text gradients for headings (Aura already has gradient-text classes)
- Border gradients for premium card edges: `border-image: linear-gradient(...)`
- Gradient shadows: `shadow-aura-primary/20` (Aura already does this well)

**Dark mode considerations**:
- Aura already has CSS variables for dark mode but it is not fully implemented
- Recommendation: Implement a proper dark/light toggle
- Dark backgrounds: `#0F1115` (near black), `#1A1D23` (current aura-dark)
- Card surfaces in dark mode: `#1E2128` with `border-gray-800`
- Text: `#F0F0F0` primary, `#9CA3AF` secondary

### 5.2 Layout Patterns

**Sticky sidebars** (Aura partially implements):
- Product detail: Sticky "Add to Box" panel on right
- Build-a-box: Sticky order summary (already implemented)
- Checkout: Sticky order summary (standard pattern)
- Important: Use `top-[header-height]` and `h-[calc(100vh-header-height)]` for proper sticky behavior

**Floating CTAs**:
- Mobile: Sticky bottom CTA bar (Aura has this for build-a-box)
- Desktop: Floating "Build Your Box" button on product/landing pages
- Scroll-triggered: CTA appears after user scrolls past hero

**Content width patterns**:
- Max content width: 1280px (Aura uses 1400px which is slightly wide)
- Readable text: max-w-2xl (672px) for paragraph content
- Product grids: 3 columns desktop, 2 tablet, 1-2 mobile
- Full-bleed sections for hero and CTA areas

### 5.3 Typography Trends

**Recommended font pairing for premium food**:

| Role | Font | Weight | Size |
|------|------|--------|------|
| Display/H1 | Cal Sans or Plus Jakarta Sans | 800 | 48-72px |
| Section headers/H2 | Inter or DM Sans | 700 | 32-48px |
| Body | Inter | 400/500 | 16-18px |
| Captions/Labels | Inter | 500 | 12-14px, uppercase tracking-wide |
| Price | Inter or tabular nums | 700 | 20-32px |

**Aura currently uses**: Inter (sans) + Cal Sans (display). This is a solid choice. Ensure Cal Sans is actually loading -- the `font-display` config in tailwind references it but verify the font file is included.

### 5.4 Skeleton Loading (Missing from Aura)

Every data-fetching page should show skeleton states instead of a centered spinner. This is a significant UX improvement.

```tsx
// Product card skeleton
<div className="animate-pulse">
  <div className="aspect-square bg-gray-200 rounded-2xl" />
  <div className="p-4 space-y-2">
    <div className="h-3 bg-gray-200 rounded w-1/4" />
    <div className="h-5 bg-gray-200 rounded w-3/4" />
    <div className="h-4 bg-gray-200 rounded w-full" />
    <div className="h-6 bg-gray-200 rounded w-1/3" />
  </div>
</div>
```

Replace all `<Loader2 className="animate-spin" />` instances with contextual skeleton screens.

---

## 6. Mobile-First Design Patterns

### 6.1 Navigation

**Current Aura**: Traditional hamburger menu on mobile. This is outdated for ecommerce.

**Recommended: Bottom tab navigation** (the dominant mobile ecommerce pattern):

```
[Bottom Tab Bar - Fixed]
  [Home icon]  [Shop icon]  [Box icon+badge]  [Orders icon]  [Profile icon]
   Home          Shop        My Box (3)        Orders        Account
```

**Why bottom nav**: Thumb reachability. On modern phones (6.5"+ screens), top navigation requires hand repositioning. Bottom navigation keeps primary actions in the thumb zone. HelloFresh, Factor, and every major food app uses bottom tabs.

### 6.2 Swipeable Cards

**For product browsing on mobile**:
- Horizontal swipeable carousel for category browsing
- Tinder-style swipe for "quick pick" mode: Swipe right to add, left to skip
- Swipe-to-remove in the box summary

**Implementation**: Use a library like `react-swipeable` or native CSS scroll-snap:
```css
.category-scroll {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}
.category-scroll > * {
  scroll-snap-align: start;
}
```

### 6.3 Gesture-Based Interactions

| Gesture | Action | Context |
|---------|--------|---------|
| Pull down | Refresh product list | Build-a-box, products page |
| Swipe left on box item | Remove from box | Box summary |
| Long press on product | Quick preview modal | Product grid |
| Pinch to zoom | Product image zoom | Product detail |
| Swipe between tabs | Category navigation | Build-a-box |
| Double tap on product | Quick add to box | Product grid |

### 6.4 Mobile Bottom Sheet Pattern

Replace modals with bottom sheets on mobile. This is the native-feeling pattern users expect from apps.

```
[Bottom Sheet States]
  Collapsed: 80px visible (preview bar)
  Half-open: 50vh (list of items)
  Full-open: 90vh (complete view)
  Dismissed: Swipe down to close
```

Use for: Box summary, filters, product quick-view, promo code entry.

### 6.5 Touch Target Sizes

- Minimum 44x44px for all interactive elements (WCAG requirement)
- Aura's quantity buttons (`w-8 h-8` = 32x32px) are TOO SMALL
- Fix: Increase to `w-11 h-11` minimum (44x44px)
- Add adequate spacing between touch targets (minimum 8px gap)

---

## 7. Accessibility & Performance

### 7.1 WCAG Compliance Gaps in Current Aura

| Issue | Location | Fix |
|-------|----------|-----|
| Missing alt text | Product images use generic alt | Use `alt={product.name}` (partially done) |
| Color contrast | Gray text on white (#9CA3AF on white = 2.9:1) | Use #6B7280 minimum for body text |
| Focus indicators | No visible focus rings on buttons | Add `focus-visible:ring-2 focus-visible:ring-aura-primary` |
| Keyboard navigation | Product cards not keyboard navigable | Add `tabIndex={0}` and `onKeyDown` handlers |
| Screen reader | Box slot status not announced | Add `aria-label="Slot 3 of 12: Chicken Teriyaki"` |
| Motion | Floating animations have no reduce-motion | Add `@media (prefers-reduced-motion: reduce)` |
| Form labels | Some inputs lack associated labels | Add `<label>` elements or `aria-label` |
| Touch targets | 32px buttons on mobile | Minimum 44px per WCAG 2.2 |

### 7.2 Core Web Vitals Optimization

**LCP (Largest Contentful Paint) -- Target: < 2.5s**:
- Hero image: Use `priority` prop on Next.js Image (partially done)
- Preload critical fonts: Add `<link rel="preload">` for Inter and Cal Sans
- Avoid layout shift from loading states: Use skeleton screens with fixed dimensions
- Image optimization: WebP/AVIF with `sizes` attribute for responsive loading

**FID/INP (Interaction to Next Paint) -- Target: < 200ms**:
- The build-a-box page re-renders entire product list on filter change -- memoize with `useMemo` (partially done)
- Use `startTransition` for non-urgent state updates (search filtering)
- Debounce search input (currently fires on every keystroke)

**CLS (Cumulative Layout Shift) -- Target: < 0.1**:
- Set explicit `width` and `height` on all images (Next.js Image handles this with `fill` + parent sizing)
- Reserve space for dynamic content (badge loading, review counts)
- Font loading: Use `font-display: swap` with size-adjust fallback

### 7.3 Performance Architecture Recommendations

1. **Product catalog**: Move from client-side fetching to Server Components with streaming
   ```tsx
   // Current: useEffect + useState (client-side fetch)
   // Better: Server Component with Suspense boundaries
   export default async function ProductsPage() {
     const products = await getProducts(); // Server-side
     return <ProductGrid products={products} />;
   }
   ```

2. **Image optimization**: Use Supabase Storage transforms for responsive images instead of serving originals

3. **Bundle splitting**: The build-a-box page imports everything upfront. Use dynamic imports for:
   - BoxSummary (only rendered when items are added)
   - PromoCode component (rarely used)
   - "Aura Fill" modal

4. **API route caching**: Add `Cache-Control` headers to product fetches:
   ```ts
   // Products rarely change -- cache for 5 minutes
   export const revalidate = 300;
   ```

---

## 8. Color Scheme & Visual Identity Recommendations

### 8.1 Current Color Analysis

**Issue**: The Aura codebase has a color inconsistency.

`tailwind.config.ts` defines:
- `aura-accent: #F59E0B` (Amber)
- `aura-dark: #064E3B` (Deep forest green)

But `globals.css` overrides with:
- `aura-accent: #EF4444` (Red)
- `aura-dark: #1A1D23` (Near black)

This creates confusion. The CSS `@theme` directive in Tailwind v4 takes precedence over `tailwind.config.ts`, so the actual rendered colors are the red/black variants from `globals.css`.

### 8.2 Recommended Color System for Premium Food Brand

For a premium shelf-stable food brand, the color palette should communicate:
- **Trust and safety** (greens, earth tones)
- **Premium quality** (deep, sophisticated neutrals)
- **Energy and appetite** (warm accents)

**Recommended palette**:

```
Primary:     #10B981 (Emerald green -- nature, health, freshness) [KEEP]
Secondary:   #059669 (Darker emerald -- depth, trust) [KEEP]
Accent:      #F59E0B (Amber/Gold -- premium, warmth, appetite) [CHANGE from red]
Dark:        #1A1D23 (Sophisticated near-black) [KEEP the CSS version]
Light:       #ECFDF5 (Mint cream) [KEEP]
Cream:       #FAFAF9 (Warm white for backgrounds) [KEEP]
Warm:        #FEF3C7 (Warm yellow for highlights) [KEEP]

Semantic:
  Success:   #22C55E
  Warning:   #F59E0B
  Error:     #EF4444
  Info:      #3B82F6
```

**Why amber over red for accent**: Red as an accent color (#EF4444) for a food brand CTA creates an association with danger/error in digital contexts. Amber/gold (#F59E0B) communicates premium quality and warmth while still being high-contrast enough for CTAs. Red should be reserved for error states and sale/discount badges only.

**Exception**: If the brand intentionally chose red as the primary CTA color for boldness and urgency (like DoorDash or Grubhub), then keep it but ensure it is not also used for error states. In that case, use a distinct red for CTA (#DC2626) and a different treatment for errors.

### 8.3 Typography System

**Resolve the inconsistency**: Ensure Cal Sans display font is properly loaded. Verify with:
```bash
# Check if font files exist
ls src/app/fonts/
# Or check next.config for font configuration
```

**Recommended type scale**:
```css
--text-xs:    0.75rem / 1rem     /* 12px - badges, labels */
--text-sm:    0.875rem / 1.25rem /* 14px - captions, secondary */
--text-base:  1rem / 1.5rem      /* 16px - body text */
--text-lg:    1.125rem / 1.75rem /* 18px - lead paragraphs */
--text-xl:    1.25rem / 1.75rem  /* 20px - card titles */
--text-2xl:   1.5rem / 2rem      /* 24px - section subheads */
--text-3xl:   1.875rem / 2.25rem /* 30px - section titles */
--text-4xl:   2.25rem / 2.5rem   /* 36px - page titles */
--text-5xl:   3rem / 1           /* 48px - hero headlines */
--text-6xl:   3.75rem / 1        /* 60px - display text */
```

---

## 9. Specific UI Component Recommendations

### 9.1 New Components Needed

| Component | Priority | Purpose |
|-----------|----------|---------|
| `SkeletonCard` | HIGH | Replace spinner loading states |
| `BottomSheet` | HIGH | Mobile box summary, filters, quick-view |
| `ProgressBar` | HIGH | Box fill progress indicator |
| `VisualBoxGrid` | HIGH | Visual slot representation for box builder |
| `DeliveryTimeline` | MEDIUM | Order status visualization |
| `NutritionPanel` | MEDIUM | Standardized nutrition display |
| `DietaryBadges` | MEDIUM | Allergen/diet icon badges |
| `CountUpNumber` | MEDIUM | Animated statistics |
| `ImageGallery` | MEDIUM | Product detail multi-image viewer |
| `BottomTabNav` | HIGH | Mobile navigation replacement |
| `SwipeableCard` | LOW | Touch gesture product cards |
| `PullToRefresh` | LOW | Mobile refresh pattern |
| `CalendarView` | LOW | Delivery calendar visualization |
| `NotificationToast` | LOW | Social proof live notifications |

### 9.2 Existing Component Improvements

**Header.tsx**:
- Add `backdrop-blur-xl bg-white/80` on scroll (glass morphism header)
- Increase search prominence -- expand search to full-width bar on click
- Add cart item count as badge, not text
- Mobile: Replace hamburger with bottom tab bar

**ProductCard.tsx**:
- Add skeleton loading variant
- Add `aria-label` for add/remove buttons
- Increase touch target on mobile (+ button too small)
- Add calorie/protein badges visible on card face
- Add hover overlay with quick-view action

**Button.tsx**:
- Add `focus-visible` ring styles
- Add loading state with spinner
- Ensure minimum 44px height on mobile

**Card.tsx**:
- Add hover lift animation variants
- Add gradient border variant for premium cards

### 9.3 Micro-Interactions Catalog

| Interaction | Trigger | Animation | Duration |
|-------------|---------|-----------|----------|
| Add to box | Click + button | Button scales to checkmark, ripple effect, box counter bounces | 300ms |
| Remove from box | Click x button | Item slides out left, slot empties with fade | 200ms |
| Box complete | Last slot filled | Confetti burst, progress bar turns green, CTA pulses | 500ms |
| Category switch | Click tab | Content fades out, slides in from direction of tab | 250ms |
| Price update | Promo applied | Old price fades, new price slides up in green | 300ms |
| Card hover | Mouse enter | Card lifts 4px, shadow increases, image zooms 5% | 300ms |
| CTA hover | Mouse enter | Background gradient shifts, slight scale up | 200ms |
| Page load | Initial render | Cards stagger in from bottom with 50ms delay each | 400ms |
| Scroll reveal | Element enters viewport | Fade up from 20px below | 500ms |
| Toggle switch | Click | Thumb slides with spring physics, track color transitions | 200ms |

---

## 10. Image Treatment Guide

### 10.1 Product Photography Standards

| Context | Aspect Ratio | Size | Treatment |
|---------|-------------|------|-----------|
| Product grid card | 1:1 (square) | 400x400 | Clean background, centered product |
| Hero/featured | 4:3 or 16:9 | 800x600 | Lifestyle context, steam/texture visible |
| Product detail primary | 1:1 | 800x800 | White/gradient background, high detail |
| Ingredient flat-lay | 16:9 | 1200x675 | Top-down, ingredients spread out |
| Category header | 21:9 (ultra-wide) | 1400x600 | Dark overlay with text, food background |
| Thumbnail (sidebar) | 1:1 | 80x80 | Tight crop, recognizable at small size |

### 10.2 Image Overlay Patterns

```css
/* Category/section header overlay */
.image-overlay-dark {
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.7) 0%,
    rgba(0, 0, 0, 0.3) 50%,
    rgba(0, 0, 0, 0) 100%
  );
}

/* Product card hover overlay */
.image-overlay-hover {
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.5) 0%,
    transparent 60%
  );
  opacity: 0;
  transition: opacity 0.3s;
}
.group:hover .image-overlay-hover {
  opacity: 1;
}

/* Premium badge glow */
.image-overlay-premium {
  background: radial-gradient(
    circle at center,
    rgba(16, 185, 129, 0.1) 0%,
    transparent 70%
  );
}
```

### 10.3 Hover Effects for Product Cards

```css
/* Recommended product card image hover */
.product-image {
  transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.product-card:hover .product-image {
  transform: scale(1.05);
}

/* Quick-add button reveal on hover */
.quick-add-btn {
  opacity: 0;
  transform: translateY(8px);
  transition: all 0.2s ease;
}
.product-card:hover .quick-add-btn {
  opacity: 1;
  transform: translateY(0);
}
```

---

## 11. Implementation Priority Matrix

### Phase 1: High Impact, Low Effort (Do First)

| Change | Effort | Impact | Files |
|--------|--------|--------|-------|
| Replace hero placeholder with food photography | 2h | Very High | `page.tsx` |
| Fix color inconsistency (config vs CSS) | 30min | High | `globals.css`, `tailwind.config.ts` |
| Add skeleton loading screens | 3h | High | New component + all pages |
| Increase touch targets to 44px minimum | 1h | Medium | Multiple components |
| Add focus-visible rings to all interactive elements | 1h | Medium | `globals.css` |
| Flip pricing to per-meal first | 30min | High | `page.tsx` |
| Add scroll-reveal animations | 2h | Medium | New utility + landing page |
| Debounce search input | 15min | Low | `build-box/page.tsx` |

### Phase 2: High Impact, Medium Effort (Do Second)

| Change | Effort | Impact | Files |
|--------|--------|--------|-------|
| Visual box slot grid in builder | 4h | Very High | New component |
| Bottom tab navigation for mobile | 4h | High | New component + layout |
| Bottom sheet for mobile box summary | 4h | High | New component |
| Progress bar for box builder | 2h | High | New component |
| Dietary preference filtering | 3h | High | Build-box page + filter component |
| Product detail page overhaul | 6h | High | `products/[id]/page.tsx` |
| Glass morphism header on scroll | 1h | Medium | `Header.tsx` |
| Add "next delivery" card to dashboard | 3h | High | `dashboard/page.tsx` |

### Phase 3: Medium Impact, Higher Effort (Do Third)

| Change | Effort | Impact | Files |
|--------|--------|--------|-------|
| Full dark mode implementation | 8h | Medium | All components + globals |
| Subscription management actions | 6h | High | Dashboard + API routes |
| Delivery calendar component | 6h | Medium | New component |
| Nutrition panel component | 4h | Medium | New component |
| Move products to Server Components | 4h | Medium | Products page |
| Micro-interaction system (confetti, etc.) | 6h | Medium | Multiple components |
| Referral program UI | 6h | Medium | Dashboard |
| Review system UI | 8h | Medium | Product detail page |

---

## 12. Summary: The 10 Highest-ROI Changes

1. **Replace the hero section placeholder** with professional food photography. This is the single highest-impact visual change. The current icon-based hero undermines the premium positioning.

2. **Build a visual slot grid** for the box builder. Show the box filling up as a satisfying visual grid instead of a plain list. This is the core product interaction.

3. **Implement bottom tab navigation** on mobile. Move from hamburger menu to thumb-friendly bottom tabs. Every major food app does this.

4. **Flip pricing to per-meal first** on the landing page. $6.25/meal converts better than $149.99/mo as the anchor price.

5. **Add skeleton loading states** to all data-fetching pages. Replace the centered spinner with contextual skeleton screens for perceived performance.

6. **Resolve the color palette inconsistency** between tailwind.config.ts and globals.css. Decide on amber vs. red accent and unify.

7. **Add dietary preference filtering** to the build-a-box experience. Users expect to filter by allergens and dietary preferences.

8. **Build a "next delivery" card** for the dashboard. This is the most important information for a subscription customer and it is currently missing.

9. **Add focus-visible indicators and increase touch targets** for accessibility. The 32px buttons fail WCAG 2.2 requirements.

10. **Implement scroll-triggered animations** on the landing page. Staggered card entrances and count-up numbers create the premium, polished feel that matches the brand positioning.

---

*Research conducted March 27, 2026. Based on analysis of HelloFresh, Factor, Daily Harvest, ButcherBox, Thrive Market, Sakara Life design patterns, combined with current ecommerce UI/UX best practices and the Aura codebase at commit 5fe8572.*
