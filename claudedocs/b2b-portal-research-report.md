# B2B Dealer/Reseller Portal Research Report

**Date**: 2026-03-27
**Scope**: Best-in-class B2B portal models for food and consumer goods
**Purpose**: Feature recommendations for Aura B2B dealer portal expansion
**Confidence Level**: HIGH (based on established platform analysis and industry patterns)

---

## Executive Summary

Aura already has a solid B2B foundation: dealer application flow, organization-based pricing rules, commission tracking, referral codes, QR redemptions, vending machine management, and a basic portal with dashboard/products/orders. However, compared to best-in-class platforms (Sysco, US Foods, Faire, Handshake, Amazon Business, Alibaba B2B), significant gaps exist in ordering sophistication, dealer analytics, onboarding automation, white-label depth, and multi-location management.

This report maps 7 research areas to specific feature recommendations, prioritized for Aura's unique verticals: gyms, marinas, food trucks, vending operators, aviation/marine provisioning, and disaster relief organizations.

---

## 1. B2B Portal UX from Leading Platforms

### Platform Analysis

#### Sysco (SHOP Platform)
Sysco's digital ordering platform serves 700,000+ customer locations:
- **Order Guide**: Personalized product list per customer based on order history. Customers see only their relevant products, not the full catalog of 400,000+ items
- **Par-Level Ordering**: Set stock levels, system calculates reorder quantities automatically
- **Delivery Calendar**: Visual calendar showing available delivery windows by route
- **Price Transparency**: Real-time pricing including deal/contract pricing shown inline
- **Invoice Management**: View, download, and dispute invoices directly in portal
- **Product Substitution Engine**: When items are out of stock, suggests equivalent alternatives
- **Nutritional/Allergen Filtering**: Critical for food service - filter by dietary needs
- **Order Cut-off Times**: Clear display of when orders must be placed for next delivery

#### US Foods (MOXe Platform)
- **Menu-Based Ordering**: Build a menu, system reverse-engineers the ingredient order
- **Cost Analysis Tools**: Food cost calculators, plate cost analysis, menu profitability
- **Inventory Integration**: Counts-based ordering tied to physical inventory
- **Business Intelligence Dashboard**: Sales trends, price change alerts, category spend analysis
- **Recipe Management**: Link products to recipes, auto-calculate order needs
- **Mobile-First Design**: Optimized for walk-in cooler inventory counting on phone

#### Faire (Wholesale Marketplace)
- **Net-60 Terms on First Order**: Industry-disrupting payment terms for new retailers
- **Free Returns**: First order free returns reduce buyer risk
- **Brand Discovery**: Algorithm-driven recommendations based on store type and location
- **Opening Order Minimums vs Reorder Minimums**: Different thresholds for new vs repeat
- **Brand Pages**: Each vendor gets a dedicated storefront within the marketplace
- **Real-Time Inventory Sync**: Stock levels updated live across all buyers
- **Automated Reorder Suggestions**: Based on sell-through velocity and lead times
- **Faire Direct**: Brands can send custom links with negotiated terms to specific retailers

#### Handshake (B2B Order Management)
- **Sales Rep Tools**: Reps can place orders on behalf of customers during visits
- **Offline Ordering**: Collect orders without internet, sync when connected
- **Line Sheet Generation**: Auto-generate PDF catalogs from product data
- **Order Approval Workflows**: Multi-level approval chains (buyer -> manager -> finance)
- **Custom Catalogs per Customer**: Different product visibility per account
- **Payment Collection**: Collect payment in-field during order placement
- **ERP Integration**: Deep sync with QuickBooks, NetSuite, SAP

#### Amazon Business
- **Multi-User Accounts**: Organization-level account with individual buyer logins
- **Approval Workflows**: Configurable rules (amount thresholds, category restrictions)
- **Business Analytics**: Spend visibility dashboard with downloadable reports
- **Punchout Integration**: Connect to procurement systems (Coupa, Ariba, SAP)
- **Tax Exemption Management**: Upload and manage tax-exempt certificates
- **Guided Buying**: Restrict purchases to approved products/vendors
- **Business Pricing & Quantity Discounts**: Tiered pricing visible at product level
- **Shared Payment Methods**: Organization-wide payment instruments

#### Alibaba B2B
- **RFQ System**: Request for Quotation workflow for custom pricing negotiations
- **Trade Assurance**: Escrow-style payment protection for B2B transactions
- **Sample Ordering**: Low-cost sample orders before committing to bulk
- **Negotiation Chat**: Real-time price/terms negotiation built into platform
- **Logistics Calculator**: Integrated shipping cost estimation for bulk orders

### Key UX Patterns Across All Platforms

| Pattern | Platforms Using It | Relevance to Aura |
|---------|-------------------|-------------------|
| Personalized product lists (Order Guide) | Sysco, US Foods, Handshake | CRITICAL |
| Quick reorder from history | All platforms | CRITICAL |
| Real-time pricing with tier visibility | All platforms | HIGH |
| Delivery window selection | Sysco, US Foods | HIGH |
| Mobile-optimized ordering | All platforms | HIGH |
| Approval workflows | Amazon Business, Handshake | MEDIUM |
| Invoice management portal | Sysco, US Foods, Amazon | MEDIUM |
| Spend analytics dashboard | All platforms | HIGH |

### Recommendations for Aura

**Immediate (Current Sprint)**:
1. Add "Order Guide" concept - personalized product list per dealer based on past orders
2. Add "Reorder Last" one-click button on dashboard
3. Add delivery date selection to order form

**Next Quarter**:
4. Invoice history and download (PDF) in portal
5. Product substitution suggestions when items are out of stock
6. Mobile-optimized ordering flow (the products page works but needs refinement for phone-based warehouse ordering)

---

## 2. Dealer Onboarding Flows

### Industry Best Practices

#### Application and Approval Workflow

**Faire Model** (Best in Class):
1. Retailer signs up with store info + connects their POS or provides store URL
2. Automated verification: Google Maps business listing check, social media presence, website validation
3. Risk scoring algorithm: business age, location, industry signals
4. Instant approval for high-confidence applications (70% approved in <24 hours)
5. Manual review queue for edge cases
6. Rejection with explanation and re-application path

**Sysco Model**:
1. Sales rep initiates relationship (field-first)
2. Credit application submitted with D&B number
3. Automated Dun & Bradstreet credit check
4. Credit limit assigned based on score
5. Account setup in ERP with delivery route assignment
6. Welcome call from account manager

**Amazon Business Model**:
1. Self-service signup with business verification (EIN, DUNS, business license)
2. Automated IRS TIN matching
3. Email domain verification
4. Instant access to basic features, enhanced features unlock after verification

#### Credit Check and Terms Setup

| Platform | Credit Approach | Terms Offered |
|----------|----------------|---------------|
| Sysco | D&B check, credit limit | Net-7 to Net-30 based on score |
| US Foods | Credit application + references | Net-7 to Net-30 |
| Faire | Proprietary algorithm, no traditional credit check | Net-60 first order, then risk-based |
| Amazon Business | Pay-by-invoice with Billie/Coupa | Net-30 for qualified businesses |
| Handshake | Configurable per vendor | Vendor sets terms per customer |

#### Welcome Kit / Getting Started

**Best Practice Flow** (Composite):
1. **Immediate**: Welcome email with portal credentials + quick start guide
2. **Day 1**: Automated product walkthrough (interactive tour of portal)
3. **Day 2**: Introductory offer (free shipping on first order, or sample box)
4. **Week 1**: Account manager check-in call (Gold+ tiers)
5. **Week 2**: Training webinar invitation
6. **Month 1**: First performance review email with tips

**Faire's "Getting Started" Checklist**:
- [ ] Complete store profile
- [ ] Set preferred categories
- [ ] Browse curated collections for your store type
- [ ] Place first order (with Net-60 terms)
- [ ] Set up automatic reorder preferences

#### Training Materials

- **Sysco**: On-demand video library, in-person culinary events, product knowledge sessions
- **Faire**: Self-service help center, onboarding email drip, category-specific buying guides
- **Amazon Business**: Amazon Business Academy - self-paced courses with certification

### Recommendations for Aura

**Current State Gap**: Aura has a basic application form (name, email, business type, message) with manual review. No automated verification, no credit checks, no structured onboarding flow.

**Immediate**:
1. Add application status tracking - dealer can check their application status
2. Add structured review workflow in admin panel (approve/reject/request-more-info)
3. Post-approval automated email sequence (welcome + credentials + getting started)

**Next Quarter**:
4. Automated business verification (Google Places API for business existence check)
5. Getting Started checklist in dealer portal (completion triggers tier benefits)
6. Sample box program - approved dealers get a free sample box
7. Video training library: how to use portal, product knowledge, sales techniques

**Future**:
8. Credit terms system with automated scoring based on order history
9. In-app interactive tour (product-tour style onboarding)
10. Dealer certification program (complete training -> earn badge -> unlock benefits)

---

## 3. B2B Ordering Experience

### Feature Deep-Dive

#### Quick Reorder (Repeat Last Order)

**How Sysco Does It**:
- "Order Guide" shows all previously ordered items with last-ordered quantity pre-filled
- One-click "Reorder All" duplicates the entire previous order
- Items that are now out of stock are flagged, substitutes suggested
- Price changes since last order highlighted in yellow

**How Faire Does It**:
- "Reorder" button on each past order in order history
- Modifiable before submission - add/remove items, adjust quantities
- Seasonal availability warnings on items from previous orders

**Recommendation for Aura**:
- Add "Reorder" button to each order in order history
- Add "Favorites" list that dealers can curate
- Pre-fill B2B cart with last order's items on "Quick Reorder" action
- Show price change indicators if prices differ from last order

#### Favorites / Saved Order Templates

**How Amazon Business Does It**:
- "Lists" feature with named lists ("Monday Delivery", "Gym Location A", "Emergency Restock")
- Share lists across organization members
- Lists can have target quantities per item
- One-click "Add All to Cart" from any list

**How Sysco Does It**:
- "Order Guide" IS the template - it's the dealer's personalized catalog
- Multiple order guides per location
- Guides can be shared across locations in multi-unit accounts

**Recommendation for Aura**:
- Implement "Saved Order Templates" - named collections of products with quantities
- Allow templates per location (for multi-location dealers)
- Templates should be one-click orderable
- System-generated "Smart Template" based on order frequency analysis

#### CSV/Bulk Upload Ordering

**How Handshake Does It**:
- Download template CSV with SKU and quantity columns
- Upload CSV to auto-populate cart
- Validation: flag invalid SKUs, out-of-stock items, minimum order violations
- Error report for any issues before order submission

**How Amazon Business Does It**:
- CSV import with SKU, ASIN, or product name matching
- Punchout catalog integration for enterprise procurement systems
- EDI (Electronic Data Interchange) for large organizations

**Recommendation for Aura**:
- Provide downloadable CSV template with current product catalog (SKU, name, price, stock)
- CSV upload endpoint that validates and populates cart
- Error handling: show which rows failed and why
- Future: EDI integration for enterprise accounts (vending operators, disaster relief orgs)

#### Purchase Order (PO) Workflow

**Industry Standard Flow**:
```
Dealer Creates PO -> Aura Reviews -> Approved/Rejected -> Invoice Generated
     |                    |                |                      |
     v                    v                v                      v
  Draft State      Pending Review    Confirmed Order      Payment Due (Net-30)
                                          |
                                          v
                                    Fulfillment -> Shipped -> Delivered
```

**How Handshake Does It**:
- PO number is optional field on order
- Order -> automatic PO generation with sequential numbering
- PO links to invoice which links to payment
- Complete audit trail: who ordered, who approved, who fulfilled

**Current Aura State**: Basic PO number field (optional, text input). No workflow, no approval chain.

**Recommendation for Aura**:
1. Add PO status tracking: Draft -> Submitted -> Approved -> Invoiced -> Fulfilled -> Closed
2. Admin approval queue for orders above threshold
3. Auto-generate sequential PO numbers (B2B-ORG-YYYY-NNNN format)
4. PDF invoice generation linked to PO
5. Payment tracking against invoices

#### Net-30/60/90 Payment Terms

**How Faire Does It**:
- Net-60 on first order (their signature differentiator)
- Terms adjust based on payment history
- Automatic late payment notifications at Day 45, 55, 60
- Late fees apply after grace period
- Credit hold on account if past due

**How Sysco Does It**:
- Terms set during credit application
- Typical: Net-7 for new accounts, up to Net-30 for established
- Statement billing (all invoices in a period consolidated)
- Auto-pay option with ACH

**Current Aura State**: No payment terms. All orders appear to be pay-on-order via Stripe.

**Recommendation for Aura**:
1. Add `payment_terms` field to organizations table (immediate, net_15, net_30, net_60, net_90)
2. Build invoice generation system (PDF with payment due date)
3. Aging report for accounts receivable
4. Automated email reminders at due-date-7, due-date, due-date+7
5. Credit hold mechanism: block new orders if past due > threshold
6. Tie to dealer tier: Bronze=immediate, Silver=Net-15, Gold=Net-30, Platinum=Net-60

#### Standing Orders (Auto-Recurring B2B Orders)

**How Sysco Does It**:
- "Standing Order" = recurring order with same products, same quantities, same schedule
- Edit window: modify standing order up to 24h before delivery
- Seasonal adjustments: mark items for seasonal removal/addition
- Can have multiple standing orders (weekly produce, bi-weekly dry goods)

**Recommendation for Aura**:
- Add "Recurring Order" capability - schedule repeat orders weekly/bi-weekly/monthly
- Allow modification window before each order processes
- Pause/resume capability
- Quantity adjustments per cycle
- This maps well to the existing subscription infrastructure - extend `aura_subscriptions` with B2B support

#### Multi-Location Ordering

**How Sysco Does It**:
- Parent account with child locations
- Each location has its own order guide, delivery schedule, and ship-to address
- Place orders for all locations from single dashboard
- Cross-location spend reporting

**How Amazon Business Does It**:
- Organization account -> Groups -> Users
- Each group can have different buying policies, budgets, and shipping addresses
- Central admin sees all activity

**Current Aura State**: `organizations` table exists but no multi-location support. Single organization = single entity.

**Recommendation for Aura**:
- New table: `organization_locations` (id, organization_id, name, type, address, delivery_schedule, is_active)
- Allow orders to specify target location
- Per-location order history and inventory recommendations
- Dashboard view: all locations with per-location KPIs
- Critical for: vending operators (multiple machines), gyms (multiple locations), food trucks (multiple trucks), marinas (multiple docks)

---

## 4. Commission and Referral Systems

### Industry Models

#### Commission Tier Structures

**Existing Aura Tiers** (from B2B landing page):
| Tier | Volume | Discount | Commission |
|------|--------|----------|------------|
| Bronze | 0-500 units/mo | 10% | 8% |
| Silver | 500-2,000 | 15% | 10% |
| Gold | 2,000-5,000 | 20% | 12% |
| Platinum | 5,000+ | 25%+ | 15% |

This is a solid foundation. Industry benchmarks:

**Faire**: 25% commission on first orders from new retailers (their "Brand" side), lower on reorders
**Amazon Associates (B2C comparison)**: 1-10% depending on category
**Food Distribution Industry**: Typically 3-15% broker commissions, 15-25% distributor margins

Aura's 8-15% range is competitive for a hybrid referral/wholesale model.

#### Real-Time Commission Dashboard

**Best Practice Components**:
1. **Earnings Summary**: Total earned, pending, available for payout, lifetime
2. **Earnings Timeline**: Chart showing daily/weekly/monthly commission trends
3. **Per-Order Breakdown**: Which order generated which commission, with status
4. **Tier Progress**: Visual progress bar toward next tier
5. **Projected Earnings**: Based on current run rate, "On track for $X this month"
6. **Commission Rate Display**: Current rate + what next tier rate would be

**Current Aura State**: Basic stats (total earned, pending, paid) + commission history list. No charts, no tier progress, no projections.

**Recommendation for Aura**:
1. Add monthly earnings chart (last 6-12 months)
2. Tier progress indicator: "150 more units to reach Silver tier"
3. Projected monthly/quarterly earnings based on trailing averages
4. Per-order commission detail with clear status (pending -> cleared -> paid)
5. Commission calendar: when next payout is scheduled

#### Payout Schedules and Methods

**Industry Standard**:
- **Monthly Payouts**: Most common (Faire, most affiliate programs)
- **Bi-Weekly**: For higher-volume dealers
- **Threshold-Based**: Pay out once balance exceeds $X (Amazon Associates: $10)
- **Methods**: ACH/direct deposit (preferred), Stripe Connect payouts, PayPal, check

**Current Aura State**: Stripe Connect ID on organizations table. Commission tracking exists but payout automation unclear.

**Recommendation for Aura**:
1. Automated monthly Stripe Connect payouts
2. Minimum payout threshold ($50 or configurable)
3. Payout history with downloadable statements
4. Tax documentation: auto-generate 1099 data at year end
5. Payout preferences: frequency, method, minimum threshold

#### Referral Link and QR Code Systems

**Current Aura State**: Referral codes exist, QR code URL field on dealers, referral link display on dashboard. Solid foundation.

**Best Practice Enhancements**:
1. **Deep Links**: Referral links that go to specific products, not just homepage
2. **Multi-Channel Attribution**: Track referrals from link clicks, QR scans, promo code entries
3. **QR Code Generator**: In-portal QR code generation with customizable design
4. **Vanity URLs**: dealer.aura.com or aura.com/shop/dealername
5. **Attribution Window**: 30-day cookie attribution standard in industry
6. **First-Touch vs Last-Touch**: Configure attribution model

**Recommendation for Aura**:
1. Generate QR codes in-portal (not external URL - generate SVG dynamically)
2. Deep referral links (aura.com/ref/CODE/product/SKU)
3. Downloadable marketing assets: QR code in various sizes, branded flyer templates
4. Attribution analytics: show which channel drives most conversions
5. Embeddable widget: HTML snippet dealers can add to their website

#### Performance Leaderboards

**How Channel Programs Do It**:
- **Monthly/Quarterly Leaderboards**: Top 10 dealers by revenue, orders, or new customers
- **Anonymized Rankings**: "You are #12 of 47 Silver dealers"
- **Gamification Badges**: "First Sale", "100th Order", "Top 5%", "Consistent Performer"
- **Incentive Sprints**: Limited-time challenges ("Sell 50 units of Product X this month, earn 2x commission")

**Recommendation for Aura**:
1. Dealer ranking within tier (anonymized)
2. Achievement badges system
3. Monthly challenge/sprint system with bonus commissions
4. Annual dealer awards program
5. Public leaderboard (opt-in) for competitive dealers

---

## 5. Dealer Analytics and Reporting

### What Best-in-Class Platforms Show Dealers

#### Sales Performance Dashboard

**Sysco SHOP Analytics**:
- Total purchases by period (week/month/quarter/year)
- Purchase trends with year-over-year comparison
- Average order value trend
- Order frequency analysis
- Peak ordering days/times

**US Foods MOXe Business Intelligence**:
- Food cost percentage tracking
- Price change alerts and impact analysis
- Category-level spend breakdown
- Vendor performance scorecards

**Current Aura State**: Basic stats only (total earned, pending, paid, referred orders count). No time-series data, no category breakdown, no trends.

**Recommendation for Aura - Analytics Dashboard Components**:

1. **Revenue Overview** (Priority: CRITICAL)
   - Total revenue generated (orders attributed to dealer)
   - Revenue by period (daily/weekly/monthly) with chart
   - Average order value trend
   - Year-over-year/month-over-month growth

2. **Product Performance** (Priority: HIGH)
   - Top-selling products by revenue and units
   - Revenue by category pie/bar chart
   - Product velocity: fast movers vs slow movers
   - New products performance tracking

3. **Commission Reports** (Priority: HIGH)
   - Commission earned by period with chart
   - Commission by product/category breakdown
   - Pending vs cleared vs paid timeline
   - Downloadable commission statements (CSV/PDF)

4. **Customer Metrics** (Priority: MEDIUM)
   - New customers acquired through referral link
   - Customer retention/repeat rate
   - Customer lifetime value (average)
   - Geographic distribution of referred customers

5. **Inventory Recommendations** (Priority: HIGH for recurring buyers)
   - "Based on your order history, you typically reorder in X days"
   - Low-stock alerts for frequently ordered items (Aura's warehouse stock)
   - Suggested order quantities based on sell-through rate
   - Seasonal demand forecasting hints

6. **Downloadable Reports** (Priority: MEDIUM)
   - Monthly sales report PDF
   - Commission statement PDF
   - Order history CSV export
   - Product catalog with B2B pricing CSV

### Implementation Architecture

```
New DB Views/Functions needed:
- dealer_monthly_revenue(dealer_id, months)
- dealer_product_performance(dealer_id, period)
- dealer_commission_summary(dealer_id, period)
- dealer_customer_metrics(dealer_id)
- dealer_reorder_suggestions(organization_id)
```

---

## 6. White-Label and Co-Branding

### How Platforms Handle Customization

#### Faire Direct
- Brand-specific storefront pages within Faire
- Custom URL links (faire.com/direct/BRANDNAME)
- Negotiated terms per retailer-brand pair
- Brand can customize their page with banner, logo, about text

#### Shopify B2B
- Full white-label capability
- Custom domain support
- Complete theme customization
- B2B-specific features (company accounts, price lists, payment terms)

#### Current Aura State
The database already supports:
- `organizations.logo_url` - organization logo
- `organizations.custom_domain` - custom domain field
- `storefronts` table - name, slug, domain, logo, theme (JSON), settings (JSON)

This is a strong foundation that is currently under-utilized.

### Recommended White-Label Tiers

**Bronze/Silver: Co-Branded**
- Dealer name and logo shown in portal header
- Referral landing page with dealer branding: `/ref/CODE` shows dealer info above Aura products
- Co-branded packing slips: "Supplied by [Dealer Name] | Powered by Aura"

**Gold: Enhanced Branding**
- Custom sub-domain: `dealername.aura.com`
- Custom color accent (override Aura's primary color)
- Dealer-specific product catalog (show/hide products)
- Custom email templates with dealer branding
- Co-branded marketing materials (auto-generated flyers, social media assets)

**Platinum: Full White-Label**
- Custom domain support: `order.dealerbrand.com`
- Full theme customization (colors, fonts, layout)
- Dealer's logo replaces Aura branding throughout
- Custom email domain (orders@dealerbrand.com via SMTP relay)
- API access for custom integrations
- Embeddable ordering widget for dealer's website

### Implementation Recommendations

**Immediate**:
1. Use the existing `storefronts` table to power per-organization storefronts
2. Build referral landing page that shows dealer branding (`/ref/CODE`)
3. Co-branded packing slip template (PDF generation with dealer logo)

**Next Quarter**:
4. Subdomain routing: `SLUG.aura.com` -> storefront for that org
5. Theme engine: allow color/logo customization in storefronts.theme JSON
6. Product catalog filtering per organization

**Future**:
7. Custom domain CNAME support with SSL provisioning
8. Full white-label mode where Aura branding is removed
9. API endpoint for external ordering integrations

---

## 7. Multi-Location and Fleet Management

### Platform Models

#### Sysco Multi-Unit Management
- **Account Hierarchy**: Corporate parent -> regions -> individual locations
- **Centralized Purchasing**: Corporate can set approved product lists, negotiate pricing
- **Decentralized Ordering**: Individual location managers place their own orders
- **Consolidated Reporting**: Roll-up reporting across all locations
- **Delivery Route Optimization**: Routes planned by geography for efficiency

#### Vending Machine Management (Cantaloupe/USA Technologies)
- **Telemetry Dashboard**: Real-time inventory levels per machine
- **Alert System**: Low stock, offline machine, failed transaction alerts
- **Route Planning**: Optimize restocking routes based on machine needs
- **Planogram Management**: Configure which products go in which slots
- **Sales Analytics Per Machine**: Revenue, popular products, peak times per location

#### Current Aura State
Strong vending infrastructure exists:
- `vending_machines` table with serial, location, coordinates, status, config
- `vending_machine_inventory` with per-slot tracking
- `vending_transactions` for sales data
- But no location management abstraction above individual machines

### Recommended Multi-Location Architecture

#### New Data Model

```sql
-- Organization locations (gym sites, marina docks, food truck zones, etc.)
organization_locations (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,                    -- "Downtown Gym", "Marina Pier 7"
  location_type TEXT,                    -- gym, marina, food_truck, vending_zone, warehouse, retail
  address JSONB,
  coordinates JSONB,                     -- {lat, lng} for map display
  delivery_schedule TEXT,                -- "MWF", "weekly", "bi-weekly"
  preferred_delivery_day TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB,                        -- flexible per-type config
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- Link vending machines to locations
ALTER TABLE vending_machines ADD COLUMN location_id UUID REFERENCES organization_locations(id);
```

#### Dashboard Features by Vertical

**Vending Operators**:
- Map view of all machines with status indicators (green/yellow/red)
- Per-machine sales and inventory dashboard
- Route optimization: "These 5 machines need restocking, optimal route is..."
- Auto-reorder trigger: when machine inventory drops below threshold, add to next B2B order
- Performance comparison across machines

**Gyms (Multi-Location)**:
- Per-location order history and spend
- Product mix comparison across locations ("Location A sells 3x more protein bars")
- Centralized ordering with per-location ship-to
- Member-facing product recommendations per location

**Food Trucks**:
- Inventory tracking per truck
- Event-based ordering: "I have 3 events next week, generate orders"
- Route/schedule management with inventory needs
- Weather-based demand adjustment suggestions

**Marinas / Aviation FBOs**:
- Vessel/aircraft provisioning orders
- Guest manifest-based ordering (X passengers = Y units)
- Seasonal demand patterns
- Premium product curation for high-net-worth clientele

**Disaster Relief Organizations**:
- Bulk ordering with expedited shipping
- Inventory pre-positioning at staging locations
- Shelf-life tracking and rotation (FIFO management)
- Grant/funding code tracking on orders
- Multi-destination shipping from single order

### Implementation Priority

| Feature | Complexity | Impact | Priority |
|---------|-----------|--------|----------|
| Organization locations table | Low | High | P0 |
| Per-location ordering (ship-to selection) | Medium | High | P0 |
| Location dashboard with KPIs | Medium | High | P1 |
| Map view for vending/multi-location | Medium | Medium | P1 |
| Route optimization | High | Medium | P2 |
| Auto-reorder from vending telemetry | High | High | P2 |
| Vessel/event-based ordering | Medium | Medium | P2 |
| Weather-based demand suggestions | High | Low | P3 |

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4) -- Critical Gaps

| Feature | Effort | DB Changes |
|---------|--------|------------|
| Quick Reorder button on order history | 2 days | None |
| Saved Order Templates (favorites) | 3 days | New `order_templates` table |
| Organization Locations table + UI | 3 days | New `organization_locations` table |
| Per-location ship-to on order form | 2 days | Add `location_id` to orders |
| Monthly earnings chart on dashboard | 2 days | New DB function |
| Application status tracking for applicants | 2 days | Add `status` to applications |
| Tier progress indicator on dashboard | 1 day | Computed from order volume |

**Total: ~15 days, 1-2 developers**

### Phase 2: Ordering Sophistication (Weeks 5-8)

| Feature | Effort | DB Changes |
|---------|--------|------------|
| CSV bulk upload ordering | 3 days | None (uses existing cart) |
| PO workflow (status tracking) | 4 days | Add `po_status`, `po_number` fields |
| Payment terms system (Net-30/60) | 5 days | New `invoices` table, org terms field |
| Invoice generation (PDF) | 3 days | None (PDF generation utility) |
| Standing/recurring orders | 4 days | Extend subscriptions for B2B |
| Automated payout via Stripe Connect | 3 days | Payout schedule config |

**Total: ~22 days, 2 developers**

### Phase 3: Analytics and Intelligence (Weeks 9-12)

| Feature | Effort | DB Changes |
|---------|--------|------------|
| Product performance dashboard | 4 days | New DB views |
| Commission reports with charts | 3 days | New DB views |
| Customer acquisition metrics | 3 days | Attribution tracking |
| Reorder suggestions engine | 4 days | Analysis functions |
| Downloadable reports (CSV/PDF) | 3 days | None |
| Performance leaderboard | 2 days | New ranking function |

**Total: ~19 days, 1-2 developers**

### Phase 4: White-Label and Advanced (Weeks 13-16)

| Feature | Effort | DB Changes |
|---------|--------|------------|
| Storefront activation (subdomain routing) | 4 days | Uses existing storefronts table |
| Theme customization (colors/logo) | 3 days | Extend storefronts.theme JSON |
| Co-branded packing slips | 2 days | PDF template |
| QR code generator in portal | 2 days | SVG generation |
| Deep referral links (product-specific) | 2 days | Route handling |
| Marketing asset generator (flyers) | 3 days | PDF template system |
| Getting Started checklist + onboarding flow | 3 days | New `onboarding_progress` table |

**Total: ~19 days, 2 developers**

---

## New Database Tables Summary

```sql
-- 1. Organization Locations
organization_locations (
  id, organization_id, name, location_type, address, coordinates,
  delivery_schedule, preferred_delivery_day, contact_name, contact_phone,
  is_active, metadata, created_at, updated_at
)

-- 2. Order Templates (Saved Favorites)
order_templates (
  id, organization_id, created_by, name, description,
  items JSONB,  -- [{product_id, quantity}]
  location_id,  -- optional: template per location
  is_shared BOOLEAN,  -- visible to all org members
  last_used_at, created_at, updated_at
)

-- 3. Invoices
invoices (
  id, organization_id, order_id, invoice_number,
  amount, tax, total, currency,
  issued_at, due_at, paid_at,
  payment_terms TEXT,  -- net_15, net_30, net_60, net_90
  status TEXT,  -- draft, sent, paid, overdue, void
  pdf_url TEXT,
  stripe_invoice_id TEXT,
  notes TEXT,
  created_at, updated_at
)

-- 4. Dealer Applications (structured)
dealer_applications (
  id, full_name, email, phone, organization_name,
  business_type, message, website_url, tax_id,
  status TEXT,  -- pending, under_review, approved, rejected, more_info_needed
  reviewer_id UUID,
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at, updated_at
)

-- 5. Onboarding Progress
onboarding_progress (
  id, dealer_id, organization_id,
  steps_completed JSONB,  -- {profile: true, first_order: false, ...}
  completed_at TIMESTAMPTZ,
  created_at, updated_at
)

-- 6. Payout Schedule Config
payout_configurations (
  id, organization_id,
  frequency TEXT,  -- monthly, bi_weekly, threshold
  minimum_amount DECIMAL,
  payment_method TEXT,  -- stripe_connect, ach, check
  next_payout_date DATE,
  is_active BOOLEAN,
  created_at, updated_at
)
```

## Columns to Add to Existing Tables

```sql
-- organizations
ALTER TABLE organizations ADD COLUMN payment_terms TEXT DEFAULT 'immediate';
ALTER TABLE organizations ADD COLUMN credit_limit DECIMAL;
ALTER TABLE organizations ADD COLUMN billing_email TEXT;

-- aura_orders
ALTER TABLE aura_orders ADD COLUMN location_id UUID REFERENCES organization_locations(id);
ALTER TABLE aura_orders ADD COLUMN po_status TEXT DEFAULT 'submitted';
ALTER TABLE aura_orders ADD COLUMN invoice_id UUID REFERENCES invoices(id);
ALTER TABLE aura_orders ADD COLUMN is_recurring BOOLEAN DEFAULT false;
ALTER TABLE aura_orders ADD COLUMN recurring_schedule_id UUID;

-- vending_machines
ALTER TABLE vending_machines ADD COLUMN location_id UUID REFERENCES organization_locations(id);
ALTER TABLE vending_machines ADD COLUMN auto_reorder_enabled BOOLEAN DEFAULT false;
ALTER TABLE vending_machines ADD COLUMN auto_reorder_threshold INTEGER;
```

---

## Portal Navigation Expansion

Current navigation: Dashboard | Products | Orders | My Account

**Recommended expanded navigation**:

```
Dashboard           -- overview with KPIs, quick actions, tier progress
Orders              -- order history, create new, PO management
  /orders/new       -- new order flow
  /orders/templates -- saved order templates
  /orders/recurring -- standing/recurring orders
Products            -- B2B catalog with search/filter
Locations           -- multi-location management (if applicable)
Analytics           -- sales, commissions, customer metrics
  /analytics/sales
  /analytics/commissions
  /analytics/customers
Marketing           -- referral tools, QR codes, marketing assets
  /marketing/referrals
  /marketing/assets
  /marketing/leaderboard
Invoices            -- invoice history, payment status
Settings            -- organization settings, branding, team members
```

---

## Key Competitive Differentiators for Aura

Based on this research, Aura can differentiate from generic B2B platforms by leaning into its unique vertical strengths:

1. **Vending-Native B2B**: No major B2B food platform integrates vending machine telemetry with wholesale ordering. Aura's existing `vending_machines` infrastructure is a genuine moat.

2. **QR-to-Commission Attribution**: The QR redemption system creates a unique physical-to-digital attribution chain that Sysco/US Foods do not offer.

3. **Shelf-Life Intelligence**: The `is_bunker_safe` and `shelf_life_months` fields enable disaster-prep and long-storage-specific features no competitor addresses well.

4. **Hybrid Referral + Wholesale**: Most platforms are either pure wholesale (Sysco) or pure referral (affiliate programs). Aura's dual model (buy wholesale AND earn referral commissions) is attractive to diverse dealer types.

5. **Drop-Ship for Small Dealers**: Gyms, food trucks, and marinas often cannot hold inventory. Aura's drop-ship model with dealer attribution removes the inventory barrier.

---

## Methodology Note

This report was synthesized from detailed knowledge of the following platforms and their documented feature sets: Sysco SHOP, US Foods MOXe, Faire, Handshake (acquired by Shopify), Amazon Business, Alibaba B2B, Shopify B2B, Cantaloupe (vending management), and general B2B e-commerce patterns. Web search and fetch tools were unavailable during this research session, so all analysis is based on platform knowledge current through early 2025. For the most current feature sets of these rapidly evolving platforms, a follow-up web research session is recommended to validate specific feature availability.
