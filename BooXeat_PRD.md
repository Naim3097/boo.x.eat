# BooXeat - Product Requirements Document (PRD)

**Version:** 1.0  
**Last Updated:** January 30, 2025  
**Author:** Product Team  
**Status:** Draft

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Overview](#2-product-overview)
3. [Target Market](#3-target-market)
4. [User Personas](#4-user-personas)
5. [System Architecture](#5-system-architecture)
6. [Feature Specifications](#6-feature-specifications)
7. [Subscription Tiers](#7-subscription-tiers)
8. [User Interfaces](#8-user-interfaces)
9. [Database Schema](#9-database-schema)
10. [API Specifications](#10-api-specifications)
11. [Technical Requirements](#11-technical-requirements)
12. [Security Requirements](#12-security-requirements)
13. [Phased Delivery Plan](#13-phased-delivery-plan)
14. [Success Metrics](#14-success-metrics)
15. [Risks & Mitigations](#15-risks--mitigations)
16. [Appendix](#16-appendix)

---

## 1. Executive Summary

### 1.1 Product Vision

BooXeat is a cloud-based Point of Sale (POS) system designed specifically for the Malaysian F&B industry. Unlike traditional POS systems that require expensive hardware installations, BooXeat operates entirely on existing devices (tablets, phones, laptops) through a web browser, making it accessible and affordable for businesses of all sizes.

### 1.2 Problem Statement

Malaysian F&B businesses face several challenges:
- High upfront costs for traditional POS hardware
- Complex setup and maintenance requirements
- Lack of integrated QR ordering solutions
- Difficulty managing multiple outlets
- Limited affordable options for small businesses

### 1.3 Solution

BooXeat provides:
- 100% cloud-based POS accessible via any web browser
- Zero hardware requirements (BYOD - Bring Your Own Device)
- Integrated QR code table ordering for customers
- Flexible payment models (QR ordering or manual entry)
- Scalable tiers from single hawker stalls to multi-outlet chains
- Integration with PayRight.my for seamless payment processing

### 1.4 Key Differentiators

| Feature | Traditional POS | BooXeat |
|---------|----------------|---------|
| Hardware Required | Yes (RM3,000-10,000+) | No (use existing devices) |
| Setup Time | Days/Weeks | Minutes |
| QR Table Ordering | Usually add-on | Built-in |
| Multi-location | Complex setup | Native support |
| Upfront Cost | High | Zero |

---

## 2. Product Overview

### 2.1 Product Name
**BooXeat** (pronounced "Book-Seat")

### 2.2 Tagline
*"Your Restaurant, Digitized."*

### 2.3 Platform Type
Cloud-based SaaS (Software as a Service)

### 2.4 Supported Languages
- English
- Bahasa Malaysia

### 2.5 Currency
Malaysian Ringgit (MYR) only

### 2.6 Target Geography
Malaysia (initial launch)

---

## 3. Target Market

### 3.1 Primary Market Segments

| Segment | Description | Examples | Estimated Size |
|---------|-------------|----------|----------------|
| **Small** | Single-location, 1-5 staff | Hawker stalls, small cafés, food trucks | ~150,000 establishments |
| **Medium** | Growing businesses, 2-5 outlets | Café chains, casual dining | ~20,000 establishments |
| **Large** | Multi-outlet operations, 5+ locations | Restaurant chains, cloud kitchens | ~5,000 establishments |

### 3.2 Business Models Supported

**Model A: QR Menu Ordering**
- Customer scans table QR
- Views digital menu
- Places order directly
- Pays via QR (pay-first or pay-later)
- Best for: Modern cafés, restaurants with fixed menus

**Model B: Manual Entry (Nasi Campur Style)**
- Customer selects/takes food
- Cashier visits table to price items
- Records order on tablet
- Customer pays at cashier
- Best for: Economy rice, buffet-style, mixed rice restaurants

*Note: Restaurant selects ONE model during onboarding*

---

## 4. User Personas

### 4.1 Primary Personas

#### Persona 1: Restaurant Owner (Admin)
**Name:** Ahmad, 42  
**Business:** Owner of 3 "Restoran Selera Kampung" outlets  
**Goals:**
- View consolidated sales across all outlets
- Manage menus centrally
- Monitor business performance
- Control staff access

**Pain Points:**
- Currently uses different systems per outlet
- No unified reporting
- Expensive to scale

**Tech Comfort:** Moderate (uses smartphone daily, basic computer skills)

---

#### Persona 2: Cashier/Staff
**Name:** Siti, 24  
**Role:** Cashier at a café  
**Goals:**
- Process orders quickly
- Handle payments efficiently
- Minimal learning curve

**Pain Points:**
- Complex POS systems slow her down
- Errors during busy periods

**Tech Comfort:** High (digital native, uses apps daily)

---

#### Persona 3: Dine-in Customer
**Name:** Wei Ming, 28  
**Behavior:** Prefers contactless ordering  
**Goals:**
- Order without waiting for server
- Pay conveniently via e-wallet
- Quick, seamless experience

**Pain Points:**
- Waiting for menu/server
- Queuing to pay

**Tech Comfort:** High

---

#### Persona 4: Kitchen Staff
**Name:** Raju, 35  
**Role:** Head cook  
**Goals:**
- See incoming orders clearly
- Track order status
- Minimize errors

**Pain Points:**
- Messy paper tickets
- Missed orders during rush

**Tech Comfort:** Low to Moderate

---

## 5. System Architecture

### 5.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                │
├─────────────────┬─────────────────┬─────────────────┬──────────────┤
│  Customer Web   │  Staff Dashboard │ Admin Dashboard │  Kitchen     │
│  (Mobile-first) │  (Desktop/Tablet)│ (Desktop-first) │  View        │
│                 │                  │                 │  (Tablet)    │
└────────┬────────┴────────┬─────────┴────────┬────────┴──────┬───────┘
         │                 │                  │               │
         └─────────────────┴────────┬─────────┴───────────────┘
                                    │
                          ┌─────────▼─────────┐
                          │    NEXT.JS APP    │
                          │   (App Router)    │
                          │    on Vercel      │
                          └─────────┬─────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         │                          │                          │
┌────────▼────────┐      ┌──────────▼──────────┐    ┌─────────▼─────────┐
│    SUPABASE     │      │     PAYRIGHT.MY     │    │   EXTERNAL APIs   │
│  - PostgreSQL   │      │  Payment Gateway    │    │  (Phase 2)        │
│  - Auth         │      │                     │    │  - GrabFood       │
│  - Realtime     │      │                     │    │  - FoodPanda      │
│  - Storage      │      │                     │    │  - WhatsApp API   │
└─────────────────┘      └─────────────────────┘    └───────────────────┘
```

### 5.2 Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 14 (App Router) | React framework with SSR |
| **Language** | TypeScript | Type safety |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **UI Components** | shadcn/ui | Accessible, customizable components |
| **State Management** | Jotai | Atomic state management |
| **Backend** | Supabase | Database, Auth, Realtime, Storage |
| **Database** | PostgreSQL (via Supabase) | Relational database |
| **Payments** | PayRight.my | Payment processing |
| **Deployment** | Vercel | Hosting & CI/CD |
| **Realtime** | Supabase Realtime | Live order updates |

### 5.3 Multi-Tenant Architecture

- Single database with Row Level Security (RLS)
- Each restaurant has unique `store_id`
- All queries filtered by `store_id` via RLS policies
- Data isolation guaranteed at database level

---

## 6. Feature Specifications

### 6.1 Core Features (All Tiers)

#### 6.1.1 Menu Management

**Description:** Create and manage restaurant menu items

**Requirements:**
| ID | Requirement | Priority |
|----|-------------|----------|
| MENU-01 | Create menu items with name, description, price, image | Must |
| MENU-02 | Organize items into categories (e.g., Drinks, Mains, Desserts) | Must |
| MENU-03 | Mark items as "Out of Stock" (toggle availability) | Must |
| MENU-04 | Support menu item variants (e.g., Size: S/M/L, Add-ons) | Must |
| MENU-05 | Set variant pricing (e.g., Large +RM2) | Must |
| MENU-06 | Bulk edit menu items | Should |
| MENU-07 | Duplicate menu items | Should |
| MENU-08 | Menu item images stored in Supabase Storage | Must |

**User Flow:**
```
Admin → Menu Management → Add Item → Enter Details → Upload Image → Set Variants → Save
```

---

#### 6.1.2 Table Management

**Description:** Configure and manage restaurant tables

**Requirements:**
| ID | Requirement | Priority |
|----|-------------|----------|
| TBL-01 | Set total number of tables during onboarding | Must |
| TBL-02 | Add/remove tables anytime | Must |
| TBL-03 | Generate unique QR code per table | Must |
| TBL-04 | Download/print QR codes | Must |
| TBL-05 | Table statuses: Available, Occupied, Reserved, Needs Cleaning | Must |
| TBL-06 | Visual table layout/map | Could |
| TBL-07 | Table capacity (number of seats) | Should |

**Table Status Flow:**
```
Available → [Customer sits] → Occupied → [Payment complete] → Needs Cleaning → [Staff clears] → Available
```

---

#### 6.1.3 Order Management

**Description:** Handle incoming orders from QR or manual entry

**Requirements:**
| ID | Requirement | Priority |
|----|-------------|----------|
| ORD-01 | Receive orders in real-time via Supabase Realtime | Must |
| ORD-02 | Order types: Dine-in, Takeaway, Delivery | Must |
| ORD-03 | Order statuses: Pending, Confirmed, Preparing, Ready, Completed, Cancelled | Must |
| ORD-04 | Assign orders to tables (dine-in) | Must |
| ORD-05 | Multiple orders per table (add items to existing bill) | Must |
| ORD-06 | Order notes/special instructions | Must |
| ORD-07 | Sound notification for new orders | Must |
| ORD-08 | Browser push notification for new orders | Must |
| ORD-09 | Order history with filters (date, status, type) | Must |
| ORD-10 | Cancel order with reason | Must |
| ORD-11 | Refund processing | Must |

**Order Flow (QR Ordering Model):**
```
Customer scans QR → Views Menu → Adds to Cart → Places Order → 
Staff receives notification → Confirms Order → Kitchen prepares → 
Mark Ready → Customer eats → Request Bill → Generate Payment QR → 
Customer pays → Payment confirmed → Receipt sent → Order Complete
```

**Order Flow (Manual Entry Model):**
```
Customer takes food → Cashier visits table → Enters items/prices → 
Saves order to table → Customer goes to cashier → 
Generate Payment QR → Customer pays → Receipt sent → Order Complete
```

---

#### 6.1.4 Payment Processing

**Description:** Handle payments via PayRight.my integration

**Requirements:**
| ID | Requirement | Priority |
|----|-------------|----------|
| PAY-01 | Generate payment QR code linked to PayRight.my | Must |
| PAY-02 | Support payment methods: Cash, E-wallet, Card | Must |
| PAY-03 | Real-time payment status updates | Must |
| PAY-04 | Payment confirmation notification | Must |
| PAY-05 | Record payment method used | Must |
| PAY-06 | Support pay-first model (pay before eating) | Must |
| PAY-07 | Support pay-later model (pay after eating) | Must |
| PAY-08 | Split bill functionality | Could |
| PAY-09 | Manual cash payment recording | Must |

**Payment Flow:**
```
Generate Bill → Display Payment QR → Customer scans → 
Redirected to PayRight → Payment processed → 
Webhook confirms payment → Update order status → Send receipt
```

---

#### 6.1.5 Reporting & Analytics

**Description:** Sales reports and business insights

**Requirements:**
| ID | Requirement | Priority |
|----|-------------|----------|
| RPT-01 | Daily sales summary (total revenue, order count, average order value) | Must |
| RPT-02 | Sales by menu item (quantity sold, revenue per item) | Must |
| RPT-03 | Sales by category | Should |
| RPT-04 | Sales by order type (dine-in, takeaway, delivery) | Should |
| RPT-05 | Date range filtering | Must |
| RPT-06 | Export reports to CSV | Should |
| RPT-07 | Visual charts (bar, line, pie) | Should |
| RPT-08 | Comparison with previous period | Could |

---

#### 6.1.6 Staff Management

**Description:** Manage staff accounts and permissions

**Requirements:**
| ID | Requirement | Priority |
|----|-------------|----------|
| STF-01 | Create staff accounts with name and role | Must |
| STF-02 | Roles: Owner, Cashier | Must |
| STF-03 | PIN code login for staff (4-6 digits) | Must |
| STF-04 | Owner: Full access to all features | Must |
| STF-05 | Cashier: Orders, payments, refunds, reports only | Must |
| STF-06 | Deactivate staff accounts | Must |
| STF-07 | Staff activity log | Could |

**Permission Matrix:**

| Feature | Owner | Cashier |
|---------|-------|---------|
| View Orders | ✅ | ✅ |
| Manage Orders | ✅ | ✅ |
| Process Payments | ✅ | ✅ |
| Process Refunds | ✅ | ✅ |
| View Reports | ✅ | ✅ |
| Manage Menu | ✅ | ❌ |
| Manage Tables | ✅ | ❌ |
| Manage Staff | ✅ | ❌ |
| Store Settings | ✅ | ❌ |
| Billing/Subscription | ✅ | ❌ |

---

### 6.2 Tier-Specific Features

#### 6.2.1 Tier 1: QuickServe (Starter)

| Feature | Included |
|---------|----------|
| Cloud POS | ✅ |
| Menu Management (basic) | ✅ |
| Table Management | ✅ |
| QR Table Ordering | ✅ |
| Order Management | ✅ |
| Payment Processing | ✅ |
| Daily Sales Report | ✅ |
| Sales by Item Report | ✅ |
| Staff Accounts | 1-2 |
| Outlets | 1 |
| Out of Stock Toggle | ✅ |

---

#### 6.2.2 Tier 2: Bistro (Growth)

*Everything in Tier 1, plus:*

| Feature | Included |
|---------|----------|
| Multi-location support | Up to 5 outlets |
| Menu variants (sizes, add-ons) | ✅ |
| Inventory tracking (stock levels, low-stock alerts) | ✅ |
| Advanced reporting (trends, peak hours) | ✅ |
| Accounting export (CSV for QuickBooks/Xero) | ✅ |
| Staff Accounts | 5-10 |
| Shared menu across outlets | ✅ (optional) |
| Per-outlet menu customization | ✅ |
| Consolidated multi-outlet dashboard | ✅ |

---

#### 6.2.3 Tier 3: Gourmet (Enterprise)

*Everything in Tier 2, plus:*

| Feature | Included |
|---------|----------|
| Unlimited outlets | ✅ |
| Ingredient-level inventory | ✅ |
| Auto-deduct stock per sale | ✅ |
| Full consolidated reporting | ✅ |
| Customer database with order history | ✅ |
| API access for custom integrations | ✅ |
| Staff Accounts | Unlimited |
| Priority support | ✅ |

---

### 6.3 Customer-Facing Features (QR Ordering)

**Description:** Features for customers ordering via table QR

**Requirements:**
| ID | Requirement | Priority |
|----|-------------|----------|
| CUS-01 | Scan QR to access table-specific menu | Must |
| CUS-02 | Browse menu by category | Must |
| CUS-03 | View item details (description, image, price) | Must |
| CUS-04 | Select variants/add-ons | Must |
| CUS-05 | Add special instructions per item | Must |
| CUS-06 | Add items to cart | Must |
| CUS-07 | View cart and modify quantities | Must |
| CUS-08 | Place order (submit to kitchen) | Must |
| CUS-09 | View order status | Must |
| CUS-10 | Add more items to existing bill | Must |
| CUS-11 | Request bill | Must |
| CUS-12 | Pay via PayRight QR | Must |
| CUS-13 | Guest checkout (no registration required) | Must |
| CUS-14 | Optional login (for Phase 2 loyalty) | Must |
| CUS-15 | Language toggle (EN/BM) | Must |
| CUS-16 | Mobile-responsive design | Must |

**Customer Journey:**
```
1. Scan table QR code
2. Land on restaurant menu (auto-detected table number)
3. Browse categories
4. Select items, choose variants
5. Add to cart
6. Review cart
7. Place order
8. See "Order Received" confirmation
9. Track order status (Preparing → Ready)
10. (Optional) Add more items
11. Request bill when done
12. Scan payment QR
13. Complete payment
14. Receive WhatsApp receipt (Phase 2)
```

---

## 7. Subscription Tiers

### 7.1 Pricing Structure

| Tier | Name | Price (MYR/month) | Target |
|------|------|-------------------|--------|
| 1 | QuickServe | RM99 - RM150 | Small cafés, hawker stalls |
| 2 | Bistro | RM350 - RM550 | Growing restaurants, 2-5 outlets |
| 3 | Gourmet | RM900 - RM1,500 | Large chains, 5+ outlets |

### 7.2 Feature Comparison

| Feature | QuickServe | Bistro | Gourmet |
|---------|------------|--------|---------|
| **Pricing** | RM99-150/mo | RM350-550/mo | RM900-1,500/mo |
| Cloud POS | ✅ | ✅ | ✅ |
| QR Table Ordering | ✅ | ✅ | ✅ |
| Menu Management | Basic | Variants | Full |
| Table Management | ✅ | ✅ | ✅ |
| Order Management | ✅ | ✅ | ✅ |
| Payment Integration | ✅ | ✅ | ✅ |
| Reporting | Basic | Advanced | Consolidated |
| Inventory | Out of stock only | Stock tracking | Ingredient-level |
| Multi-location | ❌ | Up to 5 | Unlimited |
| Staff Accounts | 1-2 | 5-10 | Unlimited |
| API Access | ❌ | ❌ | ✅ |
| Support | Standard | Priority | Priority + Dedicated |

### 7.3 Tier Enforcement

- Features locked based on subscription tier
- Upgrade prompts shown when accessing locked features
- Downgrade requires confirmation (may lose data access)
- Grace period of 7 days for failed payments

---

## 8. User Interfaces

### 8.1 Interface Overview

| Interface | Users | Device | Priority |
|-----------|-------|--------|----------|
| Customer Ordering | Diners | Mobile (phone) | Mobile-first |
| Staff Dashboard | Cashiers, Kitchen | Tablet, Desktop | Desktop/Tablet-first |
| Admin Dashboard | Owners | Desktop, Tablet | Desktop-first |

### 8.2 Customer Ordering Interface

**Purpose:** Allow customers to browse menu, order, and pay via QR

**Key Screens:**

1. **Menu Screen**
   - Restaurant logo/name
   - Category tabs (horizontal scroll)
   - Menu items grid/list
   - Search bar
   - Cart icon with item count
   - Language toggle (EN/BM)

2. **Item Detail Modal**
   - Item image
   - Name, description, price
   - Variant selectors (size, add-ons)
   - Quantity selector
   - Special instructions text field
   - "Add to Cart" button

3. **Cart Screen**
   - List of items with quantities
   - Edit/remove items
   - Subtotal
   - "Place Order" button
   - "Continue Browsing" link

4. **Order Status Screen**
   - Order number
   - Status indicator (Pending → Confirmed → Preparing → Ready)
   - List of items ordered
   - "Add More Items" button
   - "Request Bill" button

5. **Payment Screen**
   - Bill summary
   - Payment QR code (PayRight)
   - "Pay with Cash" option (notifies staff)
   - Payment status

6. **Confirmation Screen**
   - "Payment Successful" message
   - Receipt summary
   - "Thank you" message

---

### 8.3 Staff Dashboard

**Purpose:** Manage incoming orders, process payments, view reports

**Key Screens:**

1. **Orders Screen (Default)**
   - Real-time order list
   - Filter tabs: All, Pending, Preparing, Ready
   - Order cards showing: Table #, items, time, status
   - Quick actions: Confirm, Mark Preparing, Mark Ready, Complete
   - New order notification (sound + visual)

2. **Tables Screen**
   - Visual grid of tables
   - Status indicators (color-coded)
   - Click to view table's current orders
   - Quick actions: Clear table, View bill

3. **Manual Entry Screen** (for Nasi Campur model)
   - Table selector
   - Quick item buttons (preset prices)
   - Custom item entry (name + price)
   - Running total
   - "Save to Table" button

4. **Payment Screen**
   - Select table/order
   - Display bill total
   - Generate payment QR
   - Record cash payment
   - Process refund

5. **Reports Screen** (limited for Cashier role)
   - Daily summary
   - Sales by item

---

### 8.4 Admin Dashboard

**Purpose:** Full restaurant management for owners

**Key Screens:**

1. **Overview/Dashboard**
   - Today's sales summary
   - Order count
   - Active tables
   - Quick stats widgets
   - Recent orders feed

2. **Menu Management**
   - Category list (add/edit/delete/reorder)
   - Item list with search/filter
   - Add/edit item form
   - Variant management
   - Image upload
   - Availability toggle

3. **Table Management**
   - Table list/grid
   - Add/remove tables
   - Generate QR codes
   - Download/print QR codes
   - Table status overview

4. **Staff Management**
   - Staff list
   - Add new staff
   - Set role (Owner/Cashier)
   - Set PIN code
   - Activate/deactivate

5. **Reports & Analytics**
   - Date range selector
   - Sales summary charts
   - Sales by item table
   - Sales by category
   - Sales by order type
   - Export to CSV

6. **Settings**
   - Store profile (name, logo, address)
   - Business model selection (QR Order / Manual Entry)
   - Operating hours
   - Tax settings (if applicable)
   - Payment gateway settings
   - Language preferences

7. **Billing & Subscription**
   - Current plan
   - Usage statistics
   - Upgrade/downgrade options
   - Payment history
   - Invoice download

8. **Multi-location** (Tier 2+)
   - Outlet switcher
   - Add new outlet
   - Per-outlet settings
   - Consolidated reporting toggle

---

### 8.5 Notifications

| Event | Sound | Visual | Where |
|-------|-------|--------|-------|
| New order received | ✅ Chime | ✅ Toast + badge | Staff Dashboard |
| Order status changed | ❌ | ✅ Toast | Customer interface |
| Payment received | ✅ Cash register | ✅ Toast | Staff Dashboard |
| Low stock alert | ❌ | ✅ Badge on menu | Admin Dashboard |

---

## 9. Database Schema

### 9.1 Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   stores    │───┬───│   outlets   │───┬───│   tables    │
└─────────────┘   │   └─────────────┘   │   └─────────────┘
                  │                     │
                  │   ┌─────────────┐   │   ┌─────────────┐
                  ├───│    users    │   └───│   orders    │
                  │   └─────────────┘       └──────┬──────┘
                  │                                │
                  │   ┌─────────────┐       ┌──────▼──────┐
                  ├───│ categories  │       │ order_items │
                  │   └─────────────┘       └─────────────┘
                  │          │
                  │   ┌──────▼──────┐       ┌─────────────┐
                  └───│ menu_items  │───────│  variants   │
                      └─────────────┘       └─────────────┘
```

### 9.2 Table Definitions

#### stores
Primary business entity (restaurant brand)

```sql
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  owner_id UUID REFERENCES auth.users(id),
  subscription_tier VARCHAR(20) DEFAULT 'quickserve', -- quickserve, bistro, gourmet
  subscription_status VARCHAR(20) DEFAULT 'trial', -- trial, active, past_due, cancelled
  business_model VARCHAR(20) NOT NULL, -- qr_ordering, manual_entry
  default_language VARCHAR(5) DEFAULT 'en', -- en, ms
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### outlets
Individual restaurant locations

```sql
CREATE TABLE outlets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  operating_hours JSONB, -- {"mon": {"open": "09:00", "close": "22:00"}, ...}
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### users (staff)
Staff accounts linked to stores

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  outlet_id UUID REFERENCES outlets(id), -- NULL for owners (access all)
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  pin_code VARCHAR(6) NOT NULL, -- hashed
  role VARCHAR(20) NOT NULL, -- owner, cashier
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### categories
Menu categories

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  outlet_id UUID REFERENCES outlets(id), -- NULL for shared across outlets
  name_en VARCHAR(255) NOT NULL,
  name_ms VARCHAR(255),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### menu_items
Individual menu items

```sql
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  outlet_id UUID REFERENCES outlets(id), -- NULL for shared
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name_en VARCHAR(255) NOT NULL,
  name_ms VARCHAR(255),
  description_en TEXT,
  description_ms TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### variants
Menu item variants (size, add-ons)

```sql
CREATE TABLE variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  group_name VARCHAR(100) NOT NULL, -- e.g., "Size", "Add-ons"
  name_en VARCHAR(255) NOT NULL,
  name_ms VARCHAR(255),
  price_adjustment DECIMAL(10,2) DEFAULT 0, -- +2.00 or -1.00
  is_default BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### tables
Restaurant tables

```sql
CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id UUID REFERENCES outlets(id) ON DELETE CASCADE,
  table_number VARCHAR(20) NOT NULL,
  capacity INT DEFAULT 4,
  qr_code_url TEXT,
  status VARCHAR(20) DEFAULT 'available', -- available, occupied, reserved, needs_cleaning
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(outlet_id, table_number)
);
```

#### orders
Customer orders

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id UUID REFERENCES outlets(id) ON DELETE CASCADE,
  table_id UUID REFERENCES tables(id),
  order_number VARCHAR(20) NOT NULL, -- e.g., "ORD-001"
  order_type VARCHAR(20) NOT NULL, -- dine_in, takeaway, delivery
  status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, preparing, ready, completed, cancelled
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'unpaid', -- unpaid, paid, refunded
  payment_method VARCHAR(20), -- cash, ewallet, card
  payment_reference VARCHAR(255), -- PayRight transaction ID
  notes TEXT,
  customer_phone VARCHAR(20), -- for receipt
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### order_items
Individual items within an order

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id),
  item_name VARCHAR(255) NOT NULL, -- denormalized for history
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  variants_json JSONB, -- selected variants
  special_instructions TEXT,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### inventory (Tier 2+)
Stock tracking

```sql
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id UUID REFERENCES outlets(id) ON DELETE CASCADE,
  item_name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50), -- pcs, kg, liters
  low_stock_threshold DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### customers (Phase 2 - Loyalty)
Customer accounts for loyalty program

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  points_balance INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 9.3 Row Level Security (RLS) Policies

All tables must have RLS enabled with policies ensuring:
- Users can only access data belonging to their `store_id`
- Owners can access all outlets within their store
- Cashiers can only access their assigned outlet
- Customers can only view menu and submit orders (no admin access)

Example policy for `menu_items`:

```sql
-- Enable RLS
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users (staff)
CREATE POLICY "Staff can view own store menu items" ON menu_items
  FOR SELECT USING (
    store_id IN (
      SELECT store_id FROM users WHERE id = auth.uid()
    )
  );

-- Policy for anonymous users (customers ordering)
CREATE POLICY "Customers can view active menu items" ON menu_items
  FOR SELECT USING (is_available = true);
```

---

## 10. API Specifications

### 10.1 API Architecture

- **Internal APIs:** Next.js API Routes (Server Actions preferred)
- **External APIs:** PayRight.my webhook endpoints
- **Realtime:** Supabase Realtime subscriptions

### 10.2 Key API Endpoints

#### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Staff PIN login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |

#### Menu

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/menu` | Get all menu items (with categories) |
| GET | `/api/menu/:id` | Get single item with variants |
| POST | `/api/menu` | Create menu item (Admin) |
| PUT | `/api/menu/:id` | Update menu item (Admin) |
| DELETE | `/api/menu/:id` | Delete menu item (Admin) |
| PATCH | `/api/menu/:id/availability` | Toggle availability |

#### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | Get orders (with filters) |
| GET | `/api/orders/:id` | Get single order |
| POST | `/api/orders` | Create new order (Customer) |
| PATCH | `/api/orders/:id/status` | Update order status (Staff) |
| POST | `/api/orders/:id/items` | Add items to existing order |

#### Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/generate-qr` | Generate PayRight payment QR |
| POST | `/api/payments/webhook` | PayRight payment confirmation |
| POST | `/api/payments/cash` | Record cash payment |
| POST | `/api/payments/refund` | Process refund |

#### Tables

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tables` | Get all tables |
| POST | `/api/tables` | Create table |
| PATCH | `/api/tables/:id/status` | Update table status |
| GET | `/api/tables/:id/qr` | Get/generate QR code |

#### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/daily` | Daily sales summary |
| GET | `/api/reports/items` | Sales by item |
| GET | `/api/reports/export` | Export to CSV |

### 10.3 PayRight.my Integration

**Payment Flow:**

1. **Generate Payment Request**
```typescript
// POST to PayRight API
{
  "merchant_id": "BOOXEAT_MERCHANT_ID",
  "amount": 45.90,
  "currency": "MYR",
  "reference": "ORD-001-TABLE-5",
  "callback_url": "https://app.booxeat.com/api/payments/webhook",
  "redirect_url": "https://app.booxeat.com/order/success"
}
```

2. **Receive Webhook Confirmation**
```typescript
// POST from PayRight to our webhook
{
  "transaction_id": "PR_TXN_123456",
  "reference": "ORD-001-TABLE-5",
  "status": "SUCCESS",
  "amount": 45.90,
  "payment_method": "ewallet_tng",
  "timestamp": "2025-01-30T14:30:00Z"
}
```

3. **Update Order Status**
- Mark order as `paid`
- Update `payment_reference` with transaction ID
- Trigger receipt generation (Phase 2)
- Send notification to staff dashboard

---

## 11. Technical Requirements

### 11.1 Performance Requirements

| Metric | Target |
|--------|--------|
| Page Load Time | < 2 seconds |
| Time to Interactive | < 3 seconds |
| API Response Time | < 500ms (95th percentile) |
| Realtime Latency | < 1 second |
| Uptime | 99.5% |

### 11.2 Scalability Requirements

| Metric | MVP Target | Scale Target |
|--------|------------|--------------|
| Concurrent Users | 100 | 10,000 |
| Orders per Day | 1,000 | 100,000 |
| Database Size | 1 GB | 100 GB |
| File Storage | 5 GB | 500 GB |

### 11.3 Browser Support

| Browser | Version |
|---------|---------|
| Chrome | Last 2 versions |
| Safari | Last 2 versions |
| Firefox | Last 2 versions |
| Edge | Last 2 versions |
| Mobile Safari (iOS) | iOS 14+ |
| Chrome Mobile (Android) | Android 10+ |

### 11.4 Device Requirements

| Interface | Minimum Screen Size |
|-----------|---------------------|
| Customer Ordering | 320px width (mobile) |
| Staff Dashboard | 768px width (tablet) |
| Admin Dashboard | 1024px width (desktop) |

### 11.5 Offline Capability

- **MVP:** Not required (online-only)
- **Future:** Consider service worker for order queue

---

## 12. Security Requirements

### 12.1 Authentication & Authorization

| Requirement | Implementation |
|-------------|----------------|
| Staff Authentication | PIN code + Supabase Auth |
| Owner Authentication | Email/password + Supabase Auth |
| Customer Authentication | Optional (guest checkout default) |
| Session Management | Supabase session tokens |
| Role-based Access | RLS policies + middleware checks |

### 12.2 Data Protection

| Requirement | Implementation |
|-------------|----------------|
| Data Encryption | TLS 1.3 in transit, AES-256 at rest (Supabase default) |
| PIN Storage | Hashed with bcrypt |
| PII Handling | Minimal collection, no storage of payment cards |
| Data Backup | Supabase automatic backups |

### 12.3 API Security

| Requirement | Implementation |
|-------------|----------------|
| Rate Limiting | Vercel Edge + Supabase limits |
| Input Validation | Zod schemas on all endpoints |
| CORS | Restrict to known domains |
| Webhook Verification | PayRight signature validation |

### 12.4 Compliance

- **PDPA (Malaysia):** Personal data handling compliance
- **PCI-DSS:** Not applicable (payments handled by PayRight)

---

## 13. Phased Delivery Plan

### 13.1 Phase Overview

| Phase | Duration | Focus |
|-------|----------|-------|
| Phase 1 (MVP) | 20 days | Core POS functionality, Tier 1 |
| Phase 2 | 30 days | Multi-location, Tier 2 features |
| Phase 3 | 30 days | Enterprise features, Tier 3, Integrations |
| Phase 4 | Ongoing | Enhancements, new integrations |

---

### 13.2 Phase 1: MVP (Days 1-20)

**Goal:** Launch functional Tier 1 (QuickServe) for single-location restaurants

#### Week 1 (Days 1-7): Foundation

| Day | Tasks |
|-----|-------|
| 1-2 | Project setup (Next.js, Supabase, Tailwind, shadcn/ui) |
| 2-3 | Database schema setup, RLS policies |
| 3-4 | Authentication (Owner signup, Staff PIN login) |
| 5-6 | Store & Outlet onboarding flow |
| 7 | Basic Admin Dashboard layout |

**Deliverables:**
- [ ] Project repository with CI/CD
- [ ] Database schema deployed
- [ ] Authentication working
- [ ] Onboarding flow complete

#### Week 2 (Days 8-14): Core Features

| Day | Tasks |
|-----|-------|
| 8-9 | Menu Management (CRUD, categories, images) |
| 10-11 | Table Management (CRUD, QR generation) |
| 12-13 | Customer QR Ordering interface (menu, cart, order) |
| 14 | Realtime order notifications (Supabase Realtime) |

**Deliverables:**
- [ ] Menu management functional
- [ ] Table management with QR codes
- [ ] Customer can place orders via QR
- [ ] Staff receives real-time notifications

#### Week 3 (Days 15-20): Payments & Polish

| Day | Tasks |
|-----|-------|
| 15-16 | Staff Order Dashboard (view, status updates) |
| 17 | PayRight integration (payment QR, webhook) |
| 18 | Basic reporting (daily sales, sales by item) |
| 19 | Testing, bug fixes |
| 20 | Deployment, soft launch |

**Deliverables:**
- [ ] Complete order lifecycle working
- [ ] Payments processing via PayRight
- [ ] Basic reports available
- [ ] Production deployment live

#### MVP Feature Checklist

| Feature | Status |
|---------|--------|
| Owner signup & login | 🔲 |
| Staff PIN login | 🔲 |
| Store onboarding (name, model selection) | 🔲 |
| Menu management (items, categories) | 🔲 |
| Out of stock toggle | 🔲 |
| Table management | 🔲 |
| QR code generation | 🔲 |
| Customer QR ordering (mobile) | 🔲 |
| Order management (staff dashboard) | 🔲 |
| Order status updates | 🔲 |
| Real-time notifications (sound + visual) | 🔲 |
| PayRight payment integration | 🔲 |
| Cash payment recording | 🔲 |
| Daily sales report | 🔲 |
| Sales by item report | 🔲 |
| Bilingual support (EN/BM) | 🔲 |
| Responsive design | 🔲 |

---

### 13.3 Phase 2 (Days 21-50)

**Goal:** Multi-location support, Tier 2 features, enhanced UX

#### Features

| Feature | Priority |
|---------|----------|
| Multi-outlet support (up to 5) | Must |
| Menu variants (sizes, add-ons) | Must |
| Outlet-specific menus | Must |
| Shared menu option | Must |
| Inventory tracking (stock levels) | Must |
| Low stock alerts | Must |
| Advanced reporting (trends, charts) | Should |
| CSV export for accounting | Should |
| Manual Entry mode (Nasi Campur) | Must |
| Refund processing | Must |
| GrabFood integration (read orders) | Could |
| FoodPanda integration (read orders) | Could |
| WhatsApp receipt via API | Could |

---

### 13.4 Phase 3 (Days 51-80)

**Goal:** Enterprise features, Tier 3, loyalty program

#### Features

| Feature | Priority |
|---------|----------|
| Unlimited outlets | Must |
| Ingredient-level inventory | Must |
| Auto-deduct stock per sale | Must |
| Customer database | Must |
| Order history per customer | Must |
| Loyalty program (points) | Should |
| Reward redemption | Should |
| Full GrabFood/FoodPanda sync | Should |
| API access for integrations | Should |
| Predictive analytics | Could |

---

### 13.5 Phase 4 (Ongoing)

**Goal:** Continuous improvement based on user feedback

#### Potential Features

- AI-powered menu recommendations
- Advanced kitchen display system
- Table reservation system
- Customer mobile app
- Franchise management tools
- Additional payment gateways
- Multi-currency support
- Expansion to other SE Asian markets

---

## 14. Success Metrics

### 14.1 Business Metrics

| Metric | MVP Target (3 months) | Year 1 Target |
|--------|----------------------|---------------|
| Registered Stores | 50 | 500 |
| Paying Customers | 20 | 200 |
| Monthly Recurring Revenue | RM5,000 | RM50,000 |
| Churn Rate | < 10% | < 5% |

### 14.2 Product Metrics

| Metric | Target |
|--------|--------|
| Orders Processed Daily | 1,000+ |
| Average Session Duration | > 5 minutes |
| Feature Adoption Rate | > 60% |
| Customer Order Completion Rate | > 80% |
| Payment Success Rate | > 95% |

### 14.3 Technical Metrics

| Metric | Target |
|--------|--------|
| Uptime | 99.5% |
| P95 Response Time | < 500ms |
| Error Rate | < 0.1% |
| Crash-free Sessions | > 99% |

### 14.4 User Satisfaction

| Metric | Target |
|--------|--------|
| NPS Score | > 40 |
| Support Ticket Resolution | < 24 hours |
| App Store Rating | > 4.0 |

---

## 15. Risks & Mitigations

### 15.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Supabase outage | Low | High | Implement retry logic, status monitoring |
| PayRight integration issues | Medium | High | Early integration testing, fallback to cash |
| Realtime latency | Medium | Medium | Optimize subscriptions, polling fallback |
| Scale limitations (free tier) | Medium | Medium | Plan upgrade path, monitor usage |

### 15.2 Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Low adoption | Medium | High | Focus on UX, competitive pricing, referral program |
| Competition (StoreHub, FeedMe) | High | Medium | Differentiate on price and simplicity |
| Churn | Medium | High | Onboarding support, feature education |

### 15.3 Operational Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Solo developer burnout | High | High | Prioritize ruthlessly, MVP mindset |
| Scope creep | High | Medium | Strict phase boundaries |
| Support overhead | Medium | Medium | Build help docs, FAQ, chatbot |

---

## 16. Appendix

### 16.1 Glossary

| Term | Definition |
|------|------------|
| **POS** | Point of Sale - system for processing transactions |
| **BYOD** | Bring Your Own Device - use existing hardware |
| **RLS** | Row Level Security - database access control |
| **QR Ordering** | Customers scan QR code to view menu and order |
| **Manual Entry** | Cashier manually enters items and prices |
| **Outlet** | Individual restaurant location |
| **Store** | Parent business entity (brand) |

### 16.2 References

- Supabase Documentation: https://supabase.com/docs
- Next.js Documentation: https://nextjs.org/docs
- shadcn/ui Components: https://ui.shadcn.com
- Jotai Documentation: https://jotai.org
- PayRight.my API: [To be provided]

### 16.3 Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-30 | Product Team | Initial PRD |

---

## Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| Technical Lead | | | |
| Stakeholder | | | |

---

*End of Document*
