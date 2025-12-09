# Product Requirements Document (PRD)

**Project Name:** Aura
**Type:** Premium Shelf-Stable Food Subscription Platform
**Architecture:** AI-Assisted Custom Build (Supabase + Next.js + Stripe + AI)
**Version:** 1.0
**Date:** December 9, 2025

---

## 1. Executive Summary & Vision

Aura is a vertically integrated e-commerce platform redefining shelf-stable food. We are moving away from "survival mush" to premium, chef-curated natural meals that require no refrigeration.

**The Core Value:** "Energy, Anywhere." Gourmet food that lives in a pantry, boat galley, or bunker for years but tastes like it was cooked today.

**The Tech Advantage:** A "Build-a-Box" subscription engine powered by AI, backed by a "Virtual Distributor" network that allows B2B partners to sell without holding inventory.

---

## 2. User Personas

| Persona | Description | Primary Use Case | Pain Point |
|---------|-------------|------------------|------------|
| **The Nomad (B2C)** | Boat owners, RVers, Van-lifers. | Provisioning for long trips without power. | Limited fridge space; hates reliance on ice/generators. |
| **The Guardian (B2C)** | Preppers, Disaster Zone residents. | Long-term security stock (Bunker). | Traditional "prep" food is unhealthy and tastes bad. |
| **The Operator (B2B)** | Vending owners, Gyms, Marinas. | Earning commissions via QR codes. | Spoilage costs; machine maintenance; inventory risk. |
| **The Reseller (B2B)** | Outdoor retail shops, Dealers. | Buying bulk pallets for retail. | Needs wholesale pricing and white-label options. |

---

## 3. Functional Requirements

### 3.1 Core Feature: "Aura Build-a-Box" Engine

**User Story:** As a customer, I want to fill a box with exactly the meals I want, not a random assortment.

**Logic:**

| Component | Description |
|-----------|-------------|
| **Box Sizes** | Starter (8 slots), Voyager (12 slots), Bunker (24 slots) |
| **Slot System** | The UI displays empty circles/slots. Users drag-and-drop or click + on meals to fill slots. |
| **Validation** | Checkout is disabled until `slots_filled == box_capacity`. |
| **"Aura Fill"** | A button that uses AI to auto-fill remaining slots based on the user's past taste profile or bestsellers. |

---

### 3.2 Feature: "Ask Aura" Omnibot (Voice & Chat)

**User Story:** As a user driving or cooking, I want to check my order or add items using just my voice.

**Tech:** Vapi.ai (Voice) + OpenAI (Intelligence) + n8n (Action).

**Capabilities:**

| Capability | Example |
|------------|---------|
| **Contextual Ordering** | "Aura, send me the same box as last month but swap the chili for the stew." |
| **Logistics Query** | "Where is my package?" (Bot checks tracking via webhook). |
| **Inventory Check** | "Do you have the spicy beef in stock?" (Bot queries Supabase real-time DB). |

---

### 3.3 Feature: Supply Chain Integration (Suzazon <-> El Paso)

**User Story:** As the Ops Manager, I need the system to auto-order from Mexico when US stock gets low.

**Flow:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SUPPLY CHAIN FLOW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐       │
│  │   MANUFACTURING  │    │   WAREHOUSING    │    │  SMART REORDER   │       │
│  │  (Suzazon MX)    │───>│   (El Paso)      │───>│    (n8n)         │       │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘       │
│                                                                              │
│  Supplier logs            Pallets scanned,       SKU < Safety Stock         │
│  finished batches         aura_inventory         triggers auto PDF PO       │
│  into supplier_portal     updated in Supabase    sent to Suzazon            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

1. **Manufacturing (Suzazon Mexico):** Supplier logs finished batches into the `supplier_portal`.
2. **Warehousing (El Paso):** Upon arrival, pallets are scanned. `aura_inventory` is updated in Supabase.
3. **Smart Reorder:** When a SKU hits "Safety Stock" (e.g., <500 units), n8n triggers an automated PDF Purchase Order sent to Suzazon.

---

### 3.4 Feature: B2B "Virtual Distributor"

**User Story:** As a Vending Machine owner, I want to sell Aura meals without stocking them.

**The Mechanism:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      VIRTUAL DISTRIBUTOR FLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. System generates unique QR Code flyer for Partner                        │
│     Example: aura.com/v/gym_la_1                                             │
│                                                                              │
│  2. Customer scans QR code                                                   │
│     └──> Redirects to co-branded "Build-a-Box" mobile page                   │
│                                                                              │
│  3. Commission: Partner gets X% recurring commission via Stripe Connect      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Technical Architecture Specifications

### 4.1 The Stack

| Layer | Technology | Deployment |
|-------|------------|------------|
| **Frontend** | Next.js (React) + Tailwind CSS | Vercel |
| **Backend / DB** | Supabase (PostgreSQL, Auth, Edge Functions) | Supabase Cloud |
| **Orchestration** | n8n | Self-hosted on AWS or Cloud |
| **Payments** | Stripe (Billing, Connect, Radar) | Stripe Cloud |
| **AI (Coding)** | Claude 3.5 Sonnet | - |
| **AI (Bot Logic)** | OpenAI | OpenAI Cloud |

---

### 4.2 Database Schema (Critical Tables)

#### `aura_products`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Product name |
| `sku` | TEXT | Stock keeping unit |
| `stock_level` | INTEGER | Current inventory count |
| `is_bunker_safe` | BOOLEAN | Long-term storage safe |
| `nutritional_info` | JSONB | Nutrition data |

#### `profiles`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Linked to Supabase Auth |
| `role` | TEXT | 'customer', 'dealer', 'admin' |
| `credits` | INTEGER | Account credits |

#### `aura_subscriptions`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to profiles |
| `stripe_sub_id` | TEXT | Stripe subscription ID |
| `box_config` | JSONB | Array of product IDs |

#### `aura_orders`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `tracking_number` | TEXT | Shipping tracking |
| `status` | TEXT | 'processing', 'shipped', 'delivered' |
| `dealer_attribution_id` | UUID | FK to dealers (nullable) |

#### `dealers`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `profile_id` | UUID | FK to profiles |
| `qr_code_url` | TEXT | Unique QR code URL |
| `commission_rate` | DECIMAL | Commission percentage |

---

### 4.3 Offline Capabilities

**PWA Mode:** The web app must cache the "My Manuals" section so users in disaster zones or at sea can read nutritional info and preparation instructions without internet.

| Feature | Implementation |
|---------|----------------|
| Service Worker | Cache nutritional data, prep instructions |
| IndexedDB | Store user's current box configuration |
| Offline Indicator | Visual badge when offline |

---

## 5. Development Roadmap

### Phase 1: MVP (Weeks 1-4)

**Deliverable:** Functional Web Store

| Scope Item | Description |
|------------|-------------|
| User Auth | Supabase Auth with email/password |
| Product Catalog | Display products from `aura_products` |
| "Build-a-Box" Logic | Slot-based selection UI |
| Stripe Checkout | Process payments |

**Goal:** Process the first real credit card transaction.

---

### Phase 2: Automation (Weeks 5-8)

**Deliverable:** Backend Logistics

| Scope Item | Description |
|------------|-------------|
| Inventory Decrement | Auto-reduce stock on order |
| "Low Stock" Alerts | n8n workflow for reorder triggers |
| Basic B2B Portal | Dealer signup and dashboard |

**Goal:** Automate the flow from "Order Placed" to "Warehouse Notification."

---

### Phase 3: AI & Expansion (Weeks 9-12)

**Deliverable:** "Ask Aura" & Mobile App Features

| Scope Item | Description |
|------------|-------------|
| Vapi Voice Integration | Voice ordering via "Ask Aura" |
| Advanced Dealer QR | Dynamic QR generation with tracking |
| Mobile PWA Offline Mode | Cache manuals and prep instructions |

**Goal:** Launch the "Virtual Distributor" program.

---

## 6. Developer Prompts (For Claude/Cursor)

Copy these prompts into your AI coding tool to generate the actual code.

### Prompt 1: Database Setup

```
Act as a Supabase Architect. Create the SQL schema for project 'Aura'.

Create table aura_products with columns for SKU, name, image, and stock_count.

Create table aura_subscriptions that stores a box_config JSON array (list of selected product IDs).

Create a Row Level Security (RLS) policy that allows anyone to read products, but only authenticated users to create subscriptions.
```

### Prompt 2: Box Builder UI

```
Act as a React Expert. Build the AuraBoxBuilder component.

It takes a boxSize prop (e.g., 12).

It renders a grid of aura_products.

User clicks '+' to add to a local array.

Visuals: Display a progress bar '8/12 Items Selected'.

Disable the 'Checkout' button if the box is not full.
```

### Prompt 3: Stripe Integration

```
Act as a Backend Developer. Write a Supabase Edge Function checkout-session.

Receive box_config and user_id.

Create a Stripe Subscription Session.

Pass the box_config into the Stripe Metadata so we can retrieve it later in the webhook.
```

### Prompt 4: AI Voice Handler

```
Act as a Python Developer. Write a FastAPI endpoint for the 'Aura Voice Bot'.

Receive a webhook from Vapi.ai containing the user's spoken transcript.

Send transcript to OpenAI. System Prompt: 'You are Aura, a helpful logistics assistant.'

If the user says 'reorder', trigger a function that duplicates their last order from the Supabase aura_orders table.
```

---

## 7. Acceptance Criteria Summary

| Feature | Acceptance Criteria |
|---------|---------------------|
| Build-a-Box | User can select exactly N items for their box size |
| Checkout | Payment processes successfully via Stripe |
| Inventory | Stock decrements automatically on order |
| B2B Portal | Dealers can sign up and view their unique QR code |
| Voice Bot | "Ask Aura" can answer basic order status questions |
| PWA | Manuals accessible offline after first load |
