# Business Requirements Document (BRD)

**Document ID:** BRD-OMNI-2025-V2
**Project:** "Aura" - AI-Native Omni-Commerce Food Platform
**Status:** DRAFT (Expanded)

---

## 1.1 Project Overview

This document defines the business requirements for "Aura," a next-generation, direct-to-consumer (D2C) and business-to-business (B2B) e-commerce platform.

### 1.1.1 Business Problem

The current food subscription market is dominated by services reliant on expensive, complex, cold-chain logistics. This model is operationally fragile, costly, and inflexible. Furthermore, existing e-commerce platforms (like Shopify) are ill-equipped to handle complex, customizable "build-a-box" subscription logic, forcing businesses into fragile, expensive "app-stacking". B2B/Dealer models are an afterthought, poorly integrated and managed separately.

### 1.1.2 Business Solution

Aura will leverage a core, proprietary competitive advantage: a "one-of-a-kind" all-natural, non-refrigerated food product. This eliminates the primary cost and complexity barrier (cold-chain logistics).

To capitalize on this, we will build a custom, AI-native platform. This platform is not just a website but a scalable, multi-tenant "central nervous system" for the entire business. It will manage B2C subscriptions, B2B dealer portals, white-label reseller storefronts, high-value logistics channels (e.g., aviation, marine), and even a network of unattended retail (smart vending) points.

The architecture will be API-first, built on **Supabase** (Postgres, Auth), **Stripe** (Payments), and an **n8n** automation hub. AI-assisted development (Claude) will be used to accelerate the build.

---

## 1.2 Business Objectives

The primary objectives for this project are:

| ID | Objective | Description |
|----|-----------|-------------|
| **BO-1** | Establish Market Leadership (B2C) | Launch and scale a premium, "build-a-box" subscription service. Leverage the product's unique (non-refrigerated) qualities to capture a significant share of the health-conscious consumer market. |
| **BO-2** | Activate New Revenue Channels (B2B) | Develop and launch a multi-tenant B2B/Dealer portal to enable a new, scalable revenue stream from partners (gyms, wellness centers, retailers, food trucks). |
| **BO-3** | Achieve Logistical Superiority | Create a fully automated order-to-fulfillment pipeline by deeply integrating the platform with a third-party Warehouse Management System (WMS) and shipping carriers, orchestrated by n8n. |
| **BO-4** | Create a Defensible AI "Moat" | Move beyond simple e-commerce by developing proprietary, AI-driven intellectual property. This includes an AI ordering agent, predictive demand forecasting, and churn-prediction models. |
| **BO-5** | Deliver World-Class Customer Service | Implement an embedded, omnichannel CRM that provides a 360-degree view of the customer, consolidating all interactions (voice, SMS, email, AI-bot) into a single record. |
| **BO-6** | Penetrate High-Value Niche Verticals | Leverage the product's non-refrigerated, premium nature to capture high-margin, logistically-complex markets, including: |

### BO-6 Sub-Categories:
- **Luxury & Logistics:** Private aviation (FBO catering) and marine (yacht provisioning).
- **Preparedness & Recreation:** Disaster/humanitarian relief (B2G/B2N), consumer preparedness (bunkers/preppers), and outdoor/camping.
- **Unattended Retail:** A "virtual distributor" model for a fleet of smart vending machines.

---

## 1.3 Project Scope

### 1.3.1 In-Scope

| Area | Description |
|------|-------------|
| **Core Platform** | Custom backend (Supabase), payment integration (Stripe), automation layer (n8n). |
| **Multi-Tenancy** | Architecture to support multiple B2C storefronts and isolated B2B/Dealer portals from a single database. |
| **Commerce Engine** | B2C subscription logic ("build-a-box"), B2B purchase order/invoicing, promotions, and gift card system. |
| **AI Agent** | Conversational ordering bot (voice/text) with "tool-calling" capabilities. |
| **Logistics** | API-based integration with an external WMS and shipping providers (e.g., Shippo, EasyPost). |
| **Embedded CRM** | Internal dashboard for viewing all customer interactions and orders. |
| **AI Analytics** | Internal dashboards and models for churn prediction, CLV forecasting, and inventory demand forecasting. |
| **B2B Portal White-Labeling** | Functionality for B2B dealers to use a custom domain and upload their own logo for their portal. |
| **Unattended Retail (VMS)** | A new platform module to act as a Vending Management System (VMS) for a fleet of smart vending machines, including real-time inventory and remote management. |
| **Vertical-Specific Portals** | Configuration for specialized B2B portals targeting luxury logistics (Aviation/Marine) and B2G (Humanitarian/Disaster Relief) procurement. |

### 1.3.2 Out-of-Scope (for V1.0)

| Area | Rationale |
|------|-----------|
| **Building a WMS** | The project will integrate with an existing WMS, not build one. |
| **Physical Logistics** | The platform's scope ends at sending the order to the WMS and receiving tracking data back. All physical warehousing, packing, and shipping are managed by the 3PL/WMS. |
| **Internationalization (I18n)** | V1.0 will focus on a single country and currency (USD) to simplify tax and shipping logic. |
| **Building a Custom BI Tool** | Analytics will be displayed in the platform's admin dashboard. A separate, dedicated BI tool (like Tableau) is out of scope. |
| **Vending Machine Hardware** | The platform will provide the software (VMS) to manage smart vending machines; it will not manufacture or finance the hardware itself. |

---

## 1.4 Success Metrics (KPIs)

The success of the platform will be measured by its ability to drive key business outcomes:

| Category | KPI | Description |
|----------|-----|-------------|
| **Retention** | Customer Churn Rate (Monthly) | The percentage of subscribers who cancel. |
| **Value** | Customer Lifetime Value (CLV) | The total predicted revenue from a single customer. |
| **Revenue** | B2B vs. B2C Revenue Ratio | Tracking the growth of the new B2B channel. |
| **Revenue** | B2B Vertical Penetration | Monthly Recurring Revenue (MRR) from new verticals (Aviation, Marine, Vending, etc.). |
| **Efficiency** | Order-to-Ship Time | Time from `order.status = 'paid'` to WMS "shipment_confirmed" webhook. |
| **Efficiency** | Inventory Accuracy | Discrepancy between platform stock and WMS stock (powered by AI forecasting). |
| **Engagement** | AI-Assisted Conversion Rate | % of Vapi/Twilio bot interactions that result in a completed order. |
| **Efficiency** | Vending Machine Uptime | % of smart vending machines that are online and operational, as reported to the VMS. |

---

# Product Requirements Document (PRD)

**Document ID:** PRD-OMNI-2025-V2
**Project:** "Aura" - AI-Native Omni-Commerce Food Platform
**Status:** DRAFT (Expanded)

---

## 2.1 Overview & Vision

This document details the functional and non-functional requirements for the Aura platform. The vision is a headless, API-first system that gives the business maximum flexibility and a defensible, AI-powered competitive advantage. The user-facing "head" (website/app) will be completely decoupled from the backend (Supabase/n8n), allowing for rapid iteration.

---

## 2.2 User Personas

| Persona | Role | Primary Goal |
|---------|------|--------------|
| **Sarah (B2C)** | The Subscriber | "I want a convenient, healthy food subscription that I can easily customize (build-a-box) to fit my tastes each week." |
| **David (B2B)** | The Dealer (Gym/Retail) | "I want to easily place bulk purchase orders for my gym at my pre-negotiated wholesale price and pay via invoice." |
| **Frank (B2B)** | Food Truck Owner | "I need to place a recurring weekly order for 200 units of shelf-stable bases. My route changes, but my inventory needs are consistent." |
| **Chef Michael (B2B)** | Luxury Yacht Chef | "I'm provisioning for a 3-week charter. I need 50 units of premium, non-refrigerated items delivered to the marina in Fort Lauderdale by Tuesday, 0800 sharp." |
| **Maria (B2B)** | FBO Manager | "A client's charter plane takes off in 3 hours. I need to order high-quality, pre-packaged premium food that doesn't require onboard heating, and I need it delivered directly to the FBO." |
| **Victor (B2B)** | Vending Operator | "I need a dashboard to see which of my 50 vending machines are running low on 'Product A' so I can optimize my restocking route." |
| **Sam (B2G/NGO)** | NGO Procurement | "I'm procuring for a disaster response. I need to purchase 10,000 long-shelf-life, nutrient-dense food units via a PO and have it ready for freight pickup." |
| **Alex (Internal)** | Ops Manager | "I need to see all orders, manage WMS fulfillment exceptions, and view a customer's entire history (orders, support tickets, all comms) in one place." |

---

## 2.3 Functional Requirements (Epics & User Stories)

### EPIC 1: Multi-Tenant Core Architecture

**FR 1.1 (Multi-Tenant DB):** The platform SHALL use a single Supabase Postgres database. All tenant-specific data (B2C store, B2B Dealer) SHALL be isolated using a shared-table model with Postgres Row Level Security (RLS).

**FR 1.2 (Tenant Identification):** A `storefronts` table will define B2C stores. An `organizations` table will define B2B/Dealer tenants. The `user_profiles` table will have a foreign key to `organization_id` (nullable) to distinguish B2B users from B2C users.

**FR 1.3 (B2B White-Labeling):** The B2B portal must support white-labeling for premium dealers/resellers.
- **FR 1.3.1:** The platform SHALL integrate with Supabase's Custom Domains feature. An admin (Alex) can map a dealer's custom domain (e.g., `orders.dealername.com`) to their `organization_id`.
- **FR 1.3.2:** The `organizations` table SHALL have a column for `logo_url` (nullable).
- **FR 1.3.3:** When a B2B user (David) logs in from their custom domain, the portal frontend MUST dynamically fetch and display the `logo_url` associated with their `organization_id`.

> **User Story (Alex):** "As an admin, I want to create a new 'Dealer' organization, assign it a 'Gold' pricing tier, and invite a new user ('David') to be that organization's admin."

---

### EPIC 2: Commerce & Subscription Engine

**FR 2.1 (B2C "Build-a-Box" Subscription):**

> **User Story (Sarah):** "As a subscriber, I want to log in 5 days before my renewal, see the 20 available (non-refrigerated) food items for the week, and pick the 10 specific items I want in my box."

**Data Model:** This will be enabled by a `user_subscription_selections` table that links a `user_id` and `subscription_id` to a list of `product_skus` for an upcoming `delivery_date`.

**FR 2.2 (B2B Purchase Order (PO) Flow):**

> **User Story (David):** "As a B2B dealer, I want to add 500 items to my cart, see my 'Gold' tier price (not the B2C price), and check out by submitting a PO (status: 'Pending Approval') without entering a credit card."

> **User Story (Chef Michael):** "As a yacht chef, I need to place a one-time PO, specify a unique delivery address (e.g., 'Pier 66, Slip 42') and a hard delivery-by date/time, and pay via invoice."

**FR 2.3 (B2B Pricing Engine):** The system must support B2B-specific pricing. This SHALL be implemented with a `organization_price_rules` bridge table that maps an `organization_id` to a `product_sku` with a specific price.

**FR 2.4 (Promotions Engine):**
- **FR 2.4.1 (Stripe Coupons):** The system SHALL support simple discount codes by integrating with the Stripe Promotions API.
- **FR 2.4.2 (Gift Cards):** The system SHALL support a closed-loop gift card program (since Stripe's API is for open-loop). This requires a `gift_cards` table (with `code`, `current_balance`) and an immutable `gift_card_transactions` ledger in Supabase.

**FR 2.5 (Payment Integration):**
- **B2C:** Handled via Stripe Checkout / Stripe Subscriptions. A webhook from Stripe (`checkout.session.completed`) will trigger the n8n fulfillment workflow.
- **B2B:** Handled via Stripe Invoicing. An "approved" PO will trigger an n8n workflow to create and email a Stripe Invoice.

---

### EPIC 3: Automation Hub (n8n)

**FR 3.1 (Central Logic):** All asynchronous, event-driven business logic SHALL be orchestrated in n8n.

**FR 3.2 (WMS Order Fulfillment):**
- **Trigger:** A Supabase database webhook (or n8n listener) fires when an `order.status` is set to `paid`.
- **Action:** The n8n workflow queries the Supabase DB for order details, formats a JSON payload (per the WMS's API spec), and POSTs it to the WMS "Create Order" API endpoint.
- **State Change:** On success, n8n updates the `order.status` in Supabase to `sent_to_wms`.

**FR 3.3 (Shipment & Delivery Tracking):**
- **Trigger:** The system SHALL expose a secure n8n webhook URL for the WMS/shipping API (e.g., Shippo) to send "Shipment Confirmation" events.
- **Action:** n8n receives the webhook, parses the `tracking_number`, and updates the `order.status` in Supabase to `shipped`.

**FR 3.4 (Automated Communications):** n8n cron jobs SHALL trigger workflows for:
- "Select Your Meals" reminder (7 days pre-renewal) via Twilio.
- "Shipment Confirmation" SMS (with tracking link) via Twilio.
- "Delivery Confirmation" SMS (triggered by shipping API webhook).
- "Abandoned Cart" reminder.

---

### EPIC 4: AI Conversational Agent

**FR 4.1 (Agent Architecture):** The "AI Ordering Bot" SHALL be an "Agentic RAG" (Retrieval-Augmented Generation) system. It will use an LLM to reason and decide which "tools" to use to answer questions or perform actions.

**FR 4.2 (Secure Tools):** The Agent's "tools" SHALL be a discrete set of secure Supabase Edge Functions. The agent SHALL NOT have direct database access.

| Tool | Description |
|------|-------------|
| `tool_check_inventory(sku)` | Returns stock level for a product. |
| `tool_get_product_details(product_name)` | Returns price, description, etc. |
| `tool_add_to_cart(sku, quantity)` | Adds an item to the authenticated user's cart. |
| `tool_get_order_status(order_id)` | Returns the current status of an order. |

**FR 4.3 (Security):** All tool-calling Edge Functions MUST be called with the user's Supabase Auth JWT. This enforces RLS at the database level, ensuring the AI agent can only see or act on data owned by that user.

**FR 4.4 (Omnichannel Input):** The Agent SHALL be accessible via:
- **Voice:** A Vapi API integration, which calls our agent endpoint.
- **Text:** A Twilio integration, which triggers an n8n workflow that routes the message to the agent.

---

### EPIC 5: Embedded CRM & AI Analytics

**FR 5.1 (Embedded CRM):** A "Customer View" dashboard SHALL be built for internal admins.

**FR 5.2 (Support Ticketing):** The dashboard will include a simple support ticketing system, built on `tickets` and `ticket_comments` tables in Supabase.

**FR 5.3 (Omnichannel Log):** This is the key innovation. A central `omni_interaction_log` table SHALL be created. All communications (Vapi call transcripts, Twilio SMS logs, AI bot chats, support emails) MUST be written to this table, linked by `user_id`.

> **User Story (Alex):** "When a call comes in, I want to see the customer's profile, their last 5 orders, and the full transcript of their AI bot chat from yesterday, all on one screen."

**FR 5.4 (AI Churn Prediction):** An external Python service (e.g., on AWS Lambda) SHALL run a daily task to:
1. Read customer data from Supabase (using `supabase-py`).
2. Execute a churn prediction model (e.g., Logistic Regression).
3. Write a `churn_risk_score` (0.0-1.0) back to the `user_profiles` table.

**FR 5.5 (AI Demand Forecasting):** A similar AI service SHALL analyze historical `order_items` data to predict SKU-level demand, helping to optimize inventory for the non-refrigerated goods.

**FR 5.6 (AI Personalization):** The platform SHALL use Supabase's built-in `pgvector` extension. Product embeddings will be stored to power a "Customers Also Bought" and "Recommended For You" personalization engine.

---

### EPIC 6: Unattended Retail (Virtual Distributor VMS)

**FR 6.1 (Platform as VMS):** The Aura platform (Supabase) SHALL function as the central Vending Management System (VMS) for B2B Vending Operators.

**FR 6.2 (Smart Vending IoT Integration):**
- **Data Model:** A `vending_machines` table will be created, linked to an `organization_id` (Victor). A `vending_machine_inventory` table will track `sku` and `quantity` for each machine.
- **API:** The platform SHALL expose a secure API endpoint (e.g., Supabase Edge Function) for smart vending machines to "check in" and report their status and sales data.
- **n8n Workflow:** When a machine reports a sale, an n8n workflow SHALL:
  1. Verify the machine's identity.
  2. Decrement the `vending_machine_inventory`.
  3. Log the transaction.

**FR 6.3 (Real-Time Inventory & Routing):**

> **User Story (Victor):** "As a Vending Operator, I want to log into my B2B portal and see a dashboard showing the real-time inventory levels of all my 50 machines, flagged by 'low stock,' so I can plan my restocking route."

**FR 6.4 (Offline-to-Online 'O2O' Commerce):**

> **User Story (Sarah):** "As a B2C user, I want to buy a product in the app and be given a QR code. I want to scan that QR code at a smart vending machine in my gym to collect my product immediately."

---

## 2.4 Non-Functional Requirements (NFRs)

| ID | Category | Requirement |
|----|----------|-------------|
| **NFR-1** | Security (PCI) | The platform must be PCI-DSS compliant. This is achieved by using Stripe Elements/Checkout, which isolates all cardholder data in a Stripe-hosted iframe. No sensitive card data will ever touch our servers, reducing our compliance scope to the simplest Self-Assessment Questionnaire (SAQ A). |
| **NFR-2** | Security (Data) | All user data MUST be isolated. This is enforced at the database level using Supabase's Row Level Security (RLS) policies, which are tied to the user's authentication JWT. |
| **NFR-3** | Scalability | The platform must be able to handle 50,000+ simultaneous users without performance degradation. The serverless, Postgres-centric architecture of Supabase is designed for this. |
| **NFR-4** | Performance | All customer-facing pages and API endpoints must have a response time under 3 seconds. |
| **NFR-5** | Architecture | The platform MUST be built as a decoupled, API-first system (Headless Commerce). |
| **NFR-6** | Tech Stack | See Tech Stack section below. |

### Tech Stack (NFR-6)

| Component | Technology |
|-----------|------------|
| Backend/DB | Supabase (Cloud Hosted) |
| Automation | n8n (Cloud or Self-Hosted on AWS) |
| Payments | Stripe API |
| Comms | Vapi, Twilio |
| AI Development | Claude-Assisted |
| AI Hosting | AWS (e.g., Bedrock, Lambda) |
| Storage | AWS S3 for product images, linked to Supabase Storage |

---

# Go-to-Market (GTM) & Business Strategy

**Document ID:** GTM-OMNI-2025-V2
**Project:** "Aura"
**Status:** DRAFT (Expanded)

---

## 3.1 Mission & Vision

**Vision:** To build the world's most intelligent and flexible food provisioning platform.

**Mission:** To leverage our unique, non-perishable product and a superior, AI-native technology platform to deliver personalized, healthy food to all channels—consumers (B2C), businesses (B2B), and high-value verticals (B2G)—with maximum convenience and operational efficiency.

---

## 3.2 Core Competitive Advantage (USP)

Our strategy is built on a three-pronged, defensible "moat":

1. **Product Moat:** The food is "one-of-a-kind," all-natural, and non-refrigerated. This is a critical differentiator from competitors like HelloFresh or meal-prep services.

2. **Technology Moat:** We are building, not buying. While competitors are "renting" inflexible Shopify templates and paying "app-stacking" fees, we will own our platform. This allows us to build proprietary, value-driving features (AI agents, B2B portals, VMS integration) that are impossible on a SaaS platform.

3. **Logistical Versatility:** The combination of (1) and (2) unlocks our ultimate advantage. The non-refrigerated product removes the barrier (cold chain), and the custom platform provides the access (B2B portals). This allows us to profitably service complex, high-value markets that competitors cannot, such as private aviation (where cold-chain is a known problem), marine provisioning, and disaster relief.

---

## 3.3 Target Market & Segmentation

### 3.3.1 Primary Market: B2C Subscribers ("The Health-Conscious Consumer")

- **Profile:** Busy professionals, fitness enthusiasts, and families who value health, convenience, and high-quality, natural ingredients.
- **Positioning:** "The smart, flexible subscription for healthy food that fits your life. Customize your box, or let our AI build one for you."
- **Channels:** Content marketing (nutrition, lifestyle), social media (Instagram, TikTok), and partnerships with wellness/fitness influencers.

### 3.3.2 Secondary Market: B2B Dealers ("The Channel Partner")

**Profile:** Businesses that serve our B2C audience.
- **Wellness:** Gyms, yoga studios, wellness centers.
- **Corporate:** Offices looking for healthy, shelf-stable snacks for employees.
- **Niche Retail:** Outdoor/adventure retailers (capitalizing on the non-refrigerated USP), health food stores.
- **Mobile Retail:** Gourmet food trucks requiring high-quality, shelf-stable base ingredients.

**Positioning:** "A turnkey, premium retail product. Offer your clients the natural food they love with zero-hassle ordering and invoicing."

**Channels:** Direct B2B outreach, targeted LinkedIn campaigns, presence at fitness/wellness industry trade shows.

### 3.3.3 Tertiary Markets (High-Value Verticals)

This segment leverages our unique logistical advantage. The GTM is not mass marketing, but high-touch B2B/B2G sales enabled by our platform's B2B portal.

#### Market 1: Luxury & Logistics (Aviation/Marine)

- **Profile:** Private jet charter companies, FBOs (Fixed Base Operators), and luxury yacht provisioning companies.
- **Positioning:** "Premium, shelf-stable catering for aviation and marine. Eliminate cold-chain complexity and guarantee quality. Order via our dedicated FBO/Provisioning Portal for delivery direct to the FBO or marina."
- **Channels:** Direct sales teams targeting FBOs and major yacht provisioning hubs (e.g., Ft. Lauderdale, Antibes).

#### Market 2: Preparedness & Recreation (B2C/B2B)

- **Profile:** Outdoor enthusiasts (campers, hikers) and the "prepper" market (bunker owners, long-term preparedness).
- **Positioning:** "The 'Aura Prepared' line. Premium, nutrient-dense, long-shelf-life food for any adventure or emergency. Available in lightweight pouches for camping or 30-day supply kits for bunkers."
- **Channels:** Launch a dedicated B2C "storefront" (using our multi-tenant feature). B2B sales to specialty retail (e.g., outdoor/camping stores).

#### Market 3: Humanitarian & Government (B2G)

- **Profile:** NGOs (World Food Programme, Red Cross) and government agencies (FEMA, DLA).
- **Positioning:** "A reliable US-based supplier of nutrient-dense, long-shelf-life emergency food. Our platform provides transparent procurement, invoicing, and WMS integration for large-scale disaster response."
- **Channels:** This is a procurement-based model. The GTM is to get on preferred supplier lists and establish framework agreements (FAs) before a disaster strikes.

#### Market 4: Unattended Retail (Virtual Distribution / PaaS)

- **Profile:** "Virtual Distributors"—entrepreneurs who want to own a fleet of smart vending machines but lack the technology.
- **Positioning:** "Launch your own smart vending business, powered by Aura. We provide the product and the platform (VMS) to manage your fleet, all for a monthly fee. You just handle the operations."
- **Channels:** B2B marketing targeting vending operators and "business-in-a-box" entrepreneurs. We sell them the platform as a service, and they become a new B2B product channel.

---

## 3.4 Pricing Strategy (Hybrid Model)

| Segment | Strategy |
|---------|----------|
| **B2C** | Tiered Subscriptions (e.g., "Small Box - 10 items", "Medium Box - 15 items"). The per-item price decreases as the box size increases. One-time purchases are available at the highest per-item price. |
| **B2B** | Multi-Tiered Dealer Pricing. B2B organizations in Supabase are assigned a `dealer_tier` (e.g., 'Bronze', 'Silver', 'Gold'). This tier assignment, managed by admins, unlocks different pricing rules via the B2B pricing engine (FR 2.3). |
| **B2B - Luxury** | Value-Based Pricing. The Aviation & Marine channels are less price-sensitive and more service-oriented. Pricing will be significantly higher, reflecting the high-touch service and logistical precision required. |
| **PaaS - Vending** | A monthly Platform-as-a-Service (PaaS) fee per active vending machine, plus the wholesale (B2B) cost of the food products to stock it. |

---

## 3.5 Phased Go-to-Market (GTM) Plan

This plan is designed to sequence our build and spending, using revenue from earlier phases to fund the development of more complex features.

### Phase 1: Launch & Validate (Months 0-6)

**Goal:** Validate product-market fit with the core B2C audience.

**Tech Focus:** Build the MVP. This includes:
- Core Supabase/Stripe stack (NFR-6).
- B2C "Build-a-Box" flow (FR 2.1).
- The "New Order Fulfillment" n8n workflow to the WMS (FR 3.2).
- Basic shipment tracking (FR 3.3).

**Marketing Focus:** 100% focused on B2C acquisition. Heavy content and social media marketing.

**Metric:** Target 1,000 active B2C subscribers by end of Month 6.

---

### Phase 2: Scale & Expand (Months 7-18)

**Goal:** Activate the B2B channel and begin AI-driven optimization.

**Tech Focus:**
- Launch the B2B/Dealer Portal (FR 1.2, FR 2.2, FR 2.3) for general dealers (gyms, food trucks).
- Deploy the V1 AI Analytics: Churn Prediction (FR 5.4) and Demand Forecasting (FR 5.5).
- Launch the AI Ordering Agent (Vapi/Twilio) as a "beta" feature (FR 4.1-4.4).
- Implement B2B White-Labeling (FR 1.3).

**Marketing Focus:** Onboard the first 50 B2B dealers. Begin A/B testing the AI agent as a new conversion funnel. Use churn scores to proactively target at-risk subscribers with offers.

**Metric:** Achieve a 70/30 (B2C/B2B) revenue split.

---

### Phase 3: Innovate & Dominate (Months 18-30)

**Goal:** Use technology to capture high-value niche verticals.

**Tech Focus:**
- Launch the full Embedded CRM & Omnichannel Log (FR 5.1, FR 5.3).
- Launch the pgvector-powered Personalization Engine (FR 5.6).
- Expand to multi-storefronts (FR 1.1) to launch the "Aura Prepared" storefront (Market 2).
- Build the specialized portals for Luxury/Logistics (Market 1: Aviation/Marine).

**Marketing Focus:** High-touch B2B sales into the aviation and marine provisioning markets. Launch targeted B2C campaigns for the "Aura Prepared" (camping/prepper) brand.

**Metric:** Secure the first 10 major Aviation/Marine provisioning accounts.

---

### Phase 4: Platform as a Service (PaaS) (Months 30+)

**Goal:** Evolve from a product company to a technology platform.

**Tech Focus:**
- Launch the Unattended Retail / VMS module (EPIC 6).
- Develop the procurement portal and API for B2G/NGO integration (Market 3).

**Marketing Focus:**
- Recruit "Virtual Distributors" to build their own vending businesses on our platform (Market 4).
- Begin the B2G/NGO procurement process to become a registered supplier for disaster relief.

**Metric:** Onboard the first 100 active vending machines onto the VMS. Secure first B2G framework agreement.

---

## References

1. Shopify Pricing in 2025: How Much Does It Really Cost? - 2Hats Logic
2. Supabase | The Postgres Development Platform
3. Architecture | Supabase Docs
4. Design and Build PostgreSQL Database for E-commerce | The Table - Medium
5. Supabase delivers its backend-as-a-service to 150 countries with Stripe
6. Let's vibe code recurring payments with Stripe, Supabase, and Cursor AI - YouTube
7. Automate E-commerce Order Processing with Email Notifications & Webhooks - N8N
8. Supabase integrations | Workflow automation with n8n
9. Advanced AI Workflow Automation Software & Tools - n8n
10. AI Agent integrations | Workflow automation with n8n
11. Automation REST API Documentation - Ongoing WMS
12. WMS Orders API RESTful v2 / Ship orders - Shipedge API Documentation
13. Oracle Warehouse Management Cloud REST API Guide
14. Oracle Warehouse Management Cloud
15. Multi-carrier Tracking API - Shippo
16. E-commerce Shipping API for Marketplaces - Shippo
17. Ecommerce Shipping API and Integration Solution - EasyPost
18. The Complete Guide to AI Demand Planning for Food Businesses - OrderGrid
19. AI Supply Chain & Inventory Optimization - Optiwiser
20. Fast-Food Giants Are Using AI to Fix Their Supply Chain Problems - Trax Technologies
21. AI for optimizing food - Supply Chain Management Review
22. Predicting Customer Churn in E-commerce Subscription Services using RNN with Attention Mechanisms - IEEE Xplore
23. Customer Churn Prediction Using Machine Learning | by Allan Ouko - Medium
24. Churn prediction explained - Stripe
25. Predicting Customer Churn in a Subscription-Based E-Commerce Platform Using Machine Learning Techniques - Dalarna University
26. Customer Churn Prediction: AI, Analytics & Retention Tips
27. How to Build a Customer Churn Prediction Model in Python? - 365 Data Science
28. Predicting Customer Churn with Accurate and Explainable AI Models - YouTube
29. Simplifying back-end complexity with Supabase Data APIs
30. Database | Supabase Docs
31. REST API | Supabase Docs
32. Connect to your database | Supabase Docs
33. Visual Schema Designer | Supabase Features
34. Chat schema for PostgreSQL and MongoDB - Database Administrators Stack Exchange
35. Designing Your Postgres Database for Multi-tenancy | Crunchy Data Blog
36. performance - PostgreSQL's schemas for multi-tenant applications - Stack Overflow
37. VapiAI/example-server-serverless-supabase - GitHub
38. Build a RAG agent with LangChain - Docs by LangChain
39. Agentic RAG With LlamaIndex
40. Build an Agentic RAG Chatbot with LangChain and Supabase - YouTube
41. Build a Personalized AI Assistant with Postgres - Supabase
42. Connecting Your Custom LLM to Vapi: A Comprehensive Guide
43. Build a Complete AI Agent with Lovable and Supabase (Full Tutorial) - YouTube
44. Complete Beginner Struggling with n8n + Vapi for AI Voice Agent – Any Guidance?
45. (PDF) Predictive Analytics for Customer Lifetime Value (CLV)
46. Customer Lifetime Value Modeling for E-commerce Platforms Using Machine Learning
47. (PDF) Predictive Analytics for Customer Lifetime Value in Subscription-Based Digital Service Platforms
48. Build vs. Buy: Navigating the Software Decision for Your Business
49. Authorization via Row Level Security | Supabase Features
50. Row Level Security | Supabase Docs
51. How to Manage Row-Level Security Policies Effectively in Supabase - Medium
52. Is Row Level Security appropriate (or useful) when users are part of organizations? - Reddit
53. Multiple Schemas in Supabase - Gal Schlezinger
54. B2B ecommerce customer special price database design - Stack Overflow
55. Add discounts - Stripe Documentation
56. Coupons and promotion codes | Stripe Documentation
57. Manage stripe subscriptions with trials and promotion codes - Stack Overflow
58. How to accept gift cards as payment | Stripe
59. How to build Gift Cards in an ecommerce site (using Stripe) - Stack Overflow
60. Card issuing APIs 101: A detailed guide for businesses - Stripe
61. Supabase with Stripe - Reddit
62. Implementing Stripe Subscriptions with Supabase, Next.js, and FastAPI - Medium
63. Supabase delivers its backend-as-a-service to 150 countries with Stripe
64. Stripe-To-Postgres Sync Engine as standalone Library - Supabase
65. Best starting point for learning AI agents & workflow automation - Reddit
66. Best Freelance Supabase Developers For Hire - Codementor
67. Supabase and Twilio: Automate Workflows with n8n
68. Twilio integrations | Workflow automation with n8n
69. Flow and Twilio: Automate Workflows with n8n
70. Agentic RAG with Llamaindex and LLM | by Gazala - Medium
71. How To Create A Subscription Website In 2026 - Subbly
72. How to Build a Trouble Ticketing System - Budibase
73. Setting up your Supabase Database - Schema and Migrations - Makerkit
74. Modeling business logic flows in serverless applications | AWS Compute Blog
75. Supabase for large eccommerce project - Reddit
76. AWS Lambda and Supabase: Automate Workflows with n8n
77. Is it possible to integrate custom AWS services with the ones provided by Supabase? - Reddit
78. Recommendation for business logic - using supabase - WeWeb Community
79. Python data loading with Supabase
80. Supabase Crash Course For Python Developers - YouTube
81. How to Customize Subscriptions for WooCommerce with AI - BrandWell
82. White Label AI-Based Subscription Box Management Tool - Rapid Dev
83. Amazon Bedrock | Supabase Docs
84. An AI-based nutrition recommendation system - PMC
85. Suggest what user could buy if he already has something in the cart - Stack Overflow
86. AI Image Search with Amazon Bedrock and Supabase Vector in Python - YouTube
87. Personalized Recommendation Systems | by Sertis - Medium
88. How to Build an AI Product Recommendation System for Retail - MobiDev
89. A User Preference-Based Food Recommender System using Artificial Intelligence
90. AI Subscription Management Guide 2025 - Rapid Innovation
91. Here's how AI can build the perfect personalized meal plan - YouTube
92. PCI DSS E-commerce Guidelines
93. PCI Compliance Overview - Discover Global Network
94. What is PCI DSS compliance? | Stripe
95. PCI DSS checklist for businesses - Stripe
96. Integration security guide | Stripe Documentation
97. Stripe Terminal payments and PCI compliance
98. What is Product Requirements Document and Its Role in PRD - Simplilearn.com
99. What is the Difference Between Functional and Non-Functional Requirements? - Medium
100. Non-Functional Requirements: Tips, Tools, and Examples - Perforce Software
101. AWS Marketplace: Supabase: Tools for Web and Mobile Development
102. Supabase: Open Source Firebase Alternative with Hosted Postgres Backend - Amazon AWS
103. AWS Marketplace: Supabase
104. Supabase on the AWS Marketplace
105. AWS vs Azure vs GCP vs Supabase: Postgres Managed Services Showdown - RisingWave
106. AWS Marketplace: Supabase
107. AWS S3 | Supabase Docs
108. S3 Compatibility | Supabase Docs
109. Storage | Store any digital content - Supabase
110. Supabase Storage: now supports the S3 protocol
111. Supabase and AWS S3 - Reddit
112. HelloFresh Shopify Food Subscription Box Strategy - Appstle
113. How To Start A Meal Prep Business Using Subscriptions - Subbly
114. Build vs Buy Software: The Definitive Framework for 2025 - HatchWorks
115. Shopify vs Custom Website: Founder's Guide for 2025 - Codeft Digital
