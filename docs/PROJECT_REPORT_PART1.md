# SmartMartX Project Report - Part 1
## Foundation & Design

---

# Cover Page

**Project Title:** SmartMartX - Online Delivery System

**Course:** [Course Name & Code]

**Institution:** [Institution Name]

**Academic Year:** 2024-2025

**Team Members:**
- **Hardik Sharma** - Customer End Development
- **Sai Teja** - Retailer End Development  
- **Yashaswi Gunnala** - Wholesaler End Development

**Submission Date:** [Date]

---

## Executive Summary

SmartMartX is a comprehensive three-tier e-commerce marketplace that connects customers, retailers, and wholesalers in a unified platform. The system addresses the growing need for digital supply chain integration by enabling seamless B2C and B2B transactions with real-time order tracking and inventory management.

The platform leverages modern web technologies including React, TypeScript, and Supabase to deliver a responsive, secure, and scalable solution. Key innovations include real-time delivery tracking with Google Maps integration, automated delivery progress simulation, role-based access control with Row Level Security (RLS), and comprehensive analytics dashboards for business insights.

**Key Metrics:**
- **3 User Types:** Customer, Retailer, Wholesaler
- **15+ Core Features:** Authentication, cart management, order tracking, B2B ordering, analytics
- **Real-time Updates:** Delivery tracking, notifications, stock updates
- **9 Product Categories:** Electronics, clothing, food, home, beauty, sports, books, toys, other
- **5 Payment Methods:** Card, UPI, Net Banking, Cash on Delivery, saved payment methods
- **Secure Architecture:** RLS policies, JWT authentication, encrypted data storage

---

## 1. Project Overview & Objectives

### 1.1 Problem Statement

Traditional retail supply chains lack digital integration, making it difficult for:
- **Customers** to track orders in real-time and browse multiple retailers
- **Retailers** to manage inventory and source products from wholesalers efficiently
- **Wholesalers** to process bulk orders and manage B2B relationships

### 1.2 Solution Approach

SmartMartX provides a unified platform where all stakeholders benefit:
- Customers enjoy seamless shopping with real-time order tracking
- Retailers manage inventory and fulfill both B2C and B2B orders
- Wholesalers process bulk orders with minimum order quantity (MOQ) enforcement

### 1.3 Project Objectives

**Primary Objectives:**
- ✅ Develop a three-tier marketplace connecting customers, retailers, and wholesalers
- ✅ Implement secure authentication with role-based access control
- ✅ Enable real-time order tracking with Google Maps integration
- ✅ Create comprehensive inventory management for retailers and wholesalers
- ✅ Build analytics dashboards for business insights

**Secondary Objectives:**
- ✅ Implement B2B ordering with MOQ validation
- ✅ Enable automated delivery progress simulation
- ✅ Create notification system for order updates
- ✅ Support multiple payment methods
- ✅ Design responsive UI for mobile and desktop

### 1.4 User Hierarchy

```
┌─────────────────────────────────────────────────────┐
│                    CUSTOMER                          │
│  • Browse products from multiple retailers           │
│  • Place orders (B2C)                               │
│  • Track deliveries in real-time                    │
│  • Provide feedback and ratings                     │
└──────────────────────┬──────────────────────────────┘
                       │ Places orders
                       ▼
┌─────────────────────────────────────────────────────┐
│                    RETAILER                          │
│  • Manage inventory and pricing                     │
│  • Fulfill customer orders (B2C)                    │
│  • Order from wholesalers (B2B)                     │
│  • View analytics and reports                       │
└──────────────────────┬──────────────────────────────┘
                       │ Places bulk orders
                       ▼
┌─────────────────────────────────────────────────────┐
│                   WHOLESALER                         │
│  • Manage bulk product catalog                      │
│  • Process retailer orders (B2B)                    │
│  • Set minimum order quantities (MOQ)               │
│  • Approve/reject retailer requests                 │
└─────────────────────────────────────────────────────┘
```

---

## 2. System Design & Architecture

### 2.1 High-Level Architecture

SmartMartX follows a modern client-server architecture with serverless backend capabilities:

```
┌──────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                         │
│  React 18 + TypeScript + Vite + Tailwind CSS            │
│  • Component-based UI with custom hooks                  │
│  • React Router for navigation                           │
│  • React Query for server state management               │
│  • Context API for global state (auth, cart)            │
└────────────────────────┬─────────────────────────────────┘
                         │ REST API / Real-time Subscriptions
                         ▼
┌──────────────────────────────────────────────────────────┐
│                    BACKEND LAYER                          │
│  Supabase (PostgreSQL + Edge Functions + Auth)           │
│  • Auto-generated REST API                               │
│  • Row Level Security (RLS) policies                     │
│  • Real-time subscriptions                               │
│  • Edge Functions (Deno) for custom logic                │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                       │
│  • Google Maps API (geocoding, places, maps)             │
│  • OAuth Providers (Google authentication)               │
│  • Cron Jobs (pg_cron for delivery automation)          │
└──────────────────────────────────────────────────────────┘
```

### 2.2 Component Architecture

| Layer | Components | Responsibility |
|-------|-----------|----------------|
| **Pages** | Dashboard, Orders, Products, Profile | Top-level routes and page layouts |
| **Feature Components** | CartItem, ProductCard, OrderCard | Domain-specific UI elements |
| **Shared Components** | Button, Input, Dialog, Toast | Reusable UI primitives (shadcn/ui) |
| **Hooks** | useCart, useOrders, useAuth | Data fetching and state management |
| **Contexts** | AuthContext | Global state management |
| **Utils** | API clients, formatters, validators | Helper functions |

### 2.3 Key Design Patterns

**1. Custom Hooks Pattern**
- Encapsulates data fetching logic (e.g., `useCart`, `useProducts`, `useOrders`)
- Uses React Query for caching, loading states, and error handling
- Improves code reusability and testing

**2. Context Provider Pattern**
- `AuthContext` manages user authentication state globally
- Provides user profile, roles, and auth methods throughout the app
- Eliminates prop drilling

**3. Compound Components Pattern**
- Used in UI components like Dialog, Dropdown, Accordion
- Provides flexible, composable component APIs

**4. Container/Presentational Pattern**
- Smart components (containers) handle data and logic
- Presentational components focus on UI rendering
- Clear separation of concerns

### 2.4 Data Flow

```
User Action (UI) 
    ↓
Custom Hook (useCart, useOrders)
    ↓
React Query (cache check)
    ↓
Supabase Client API
    ↓
Row Level Security Check
    ↓
PostgreSQL Database
    ↓
Response with data
    ↓
React Query (cache update)
    ↓
UI Update (re-render)
```

### 2.5 Security Architecture

- **Authentication:** Supabase Auth with JWT tokens
- **Authorization:** Row Level Security (RLS) policies on all tables
- **API Security:** CORS policies, rate limiting, input validation
- **Data Protection:** Encrypted storage, HTTPS-only communication
- **Role-Based Access:** `has_role()` function enforces user permissions

---

## 3. Technology Stack

### 3.1 Frontend Technologies

| Technology | Version | Purpose | Justification |
|-----------|---------|---------|---------------|
| **React** | 18.3.1 | UI Framework | Component-based architecture, large ecosystem, excellent performance |
| **TypeScript** | 5.x | Language | Type safety, better IDE support, reduced runtime errors |
| **Vite** | 5.x | Build Tool | Fast HMR, optimized builds, modern dev experience |
| **Tailwind CSS** | 3.x | Styling | Utility-first, rapid development, consistent design system |
| **shadcn/ui** | Latest | Component Library | Accessible, customizable, modern design patterns |
| **React Router** | 6.30.1 | Routing | Client-side navigation, nested routes, protected routes |
| **React Query** | 5.83.0 | Data Fetching | Caching, optimistic updates, loading/error states |
| **React Hook Form** | 7.61.1 | Form Management | Performance, validation, developer experience |
| **Zod** | 3.25.76 | Schema Validation | Type-safe validation, runtime checks |
| **Lucide React** | 0.462.0 | Icons | Modern icons, tree-shakeable, consistent style |
| **Recharts** | 2.15.4 | Data Visualization | Composable charts, React-friendly API |

### 3.2 Backend Technologies

| Technology | Purpose | Features Used |
|-----------|---------|---------------|
| **Supabase** | Backend Platform | Auth, Database, Real-time, Storage, Edge Functions |
| **PostgreSQL** | Database | JSONB support, full-text search, triggers, functions |
| **Deno Runtime** | Edge Functions | TypeScript-first, secure by default, modern APIs |
| **pg_cron** | Task Scheduling | Automated delivery progress updates |
| **Row Level Security** | Authorization | Table-level access control, policy-based security |

### 3.3 Key Integrations

| Service | Purpose | API Used |
|---------|---------|----------|
| **Google Maps Platform** | Location Services | Places API, Geocoding API, Maps JavaScript API |
| **Google OAuth** | Social Login | OAuth 2.0 authentication flow |
| **Supabase Auth** | User Management | Email/password, OAuth providers, JWT tokens |

### 3.4 Development Tools

- **npm/bun** - Package management
- **ESLint** - Code linting
- **Git** - Version control
- **Vercel** - Frontend hosting and deployment
- **Supabase Cloud** - Backend infrastructure

### 3.5 Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| **React over Angular/Vue** | Larger ecosystem, better hiring pool, component flexibility |
| **TypeScript over JavaScript** | Type safety reduces bugs, better maintainability |
| **Supabase over Custom Backend** | Faster development, built-in auth/real-time, managed infrastructure |
| **React Query over Redux** | Better for server state, less boilerplate, automatic caching |
| **Tailwind over CSS-in-JS** | Faster development, consistent design, better performance |
| **Vite over Create React App** | Faster builds, modern tooling, better dev experience |

---

## 4. Database Schema

### 4.1 Entity-Relationship Diagram

**[PLACEHOLDER: Insert ER Diagram from Supabase Dashboard]**

*To generate the ER diagram:*
1. Navigate to Supabase Dashboard → Database → Schema Visualizer
2. Select all tables in the `public` schema
3. Export as image (PNG/SVG)
4. Insert here

### 4.2 Core Tables Overview

| Table | Purpose | Key Columns | Relationships |
|-------|---------|-------------|---------------|
| **profiles** | User information | id, full_name, email, auth_provider | 1:1 with auth.users |
| **user_roles** | Role assignment | user_id, role | N:1 with profiles |
| **retailers** | Retailer business info | user_id, business_name, location | 1:1 with profiles |
| **wholesalers** | Wholesaler business info | user_id, business_name, MOV | 1:1 with profiles |
| **products** | Base product catalog | name, category, base_price | Referenced by specific products |
| **retailer_products** | Retailer inventory | retailer_id, product_id, price, stock | N:1 with retailers, products |
| **wholesaler_products** | Wholesaler inventory | wholesaler_id, product_id, MOQ | N:1 with wholesalers, products |
| **cart_items** | Shopping cart | user_id, product_id, quantity | N:1 with profiles, products |
| **orders** | Master orders | buyer_id, seller_id, order_type, status | N:1 with profiles |
| **order_items** | Order line items | order_id, product_id, quantity | N:1 with orders, products |
| **delivery_tracking** | Delivery info | order_id, tracking_number, status | 1:1 with orders |
| **delivery_status_history** | Status timeline | tracking_id, status, timestamp | N:1 with delivery_tracking |
| **payment_methods** | Saved payment info | user_id, method_type, is_default | N:1 with profiles |
| **payment_transactions** | Payment records | order_id, amount, status | N:1 with orders |
| **customer_addresses** | Delivery addresses | user_id, address, is_default | N:1 with profiles |
| **notifications** | System notifications | user_id, type, message, is_read | N:1 with profiles |
| **feedback** | Ratings and reviews | reviewer_id, product_id, rating | N:1 with profiles, products |

### 4.3 Database Enums

| Enum Type | Values |
|-----------|--------|
| **app_role** | customer, retailer, wholesaler |
| **order_type** | customer_to_retailer, retailer_to_wholesaler |
| **order_status** | pending, confirmed, processing, shipped, delivered, cancelled |
| **delivery_status** | pending, confirmed, packed, picked_up, in_transit, out_for_delivery, delivered, cancelled |
| **payment_status** | pending, processing, completed, failed, refunded |
| **payment_method_type** | card, upi, netbanking, cod |
| **notification_type** | order_placed, payment_success, order_confirmed, order_shipped, delivered, order_cancelled |
| **product_category** | electronics, clothing, food, home, beauty, sports, books, toys, other |
| **auth_provider** | email, google, facebook |

### 4.4 Key Database Functions

| Function | Purpose |
|----------|---------|
| `generate_order_number()` | Creates unique order IDs (ORD + 6 chars) |
| `generate_tracking_number()` | Creates tracking IDs (TRK + 6 chars) |
| `generate_transaction_id()` | Creates payment IDs (TXN + 12 chars) |
| `has_role(user_id, role)` | Checks if user has specific role |
| `validate_order_status_transition()` | Ensures valid status changes |
| `handle_new_user()` | Creates profile on user registration |
| `handle_b2b_order_confirmation()` | Updates stock on B2B order approval |
| `handle_customer_order_confirmation()` | Decreases retailer stock on B2C order |
| `update_updated_at_column()` | Automatically updates timestamps |
| `create_delivery_status_history()` | Logs delivery status changes |

### 4.5 Row Level Security (RLS) Policies

**Key Security Principles:**
- ✅ All tables have RLS enabled
- ✅ Users can only access their own data (own orders, cart, addresses)
- ✅ Role-based policies (customers see retailers, retailers see wholesalers)
- ✅ Sellers can manage their orders and products
- ✅ Public data (products) available to all authenticated users

**Example Policies:**
- `cart_items`: Users manage their own cart
- `orders`: Buyers/sellers see their respective orders
- `retailer_products`: Customers see available products only
- `wholesaler_products`: Only retailers can view
- `user_roles`: Users can insert role once during registration

### 4.6 Database Triggers

| Trigger | Function | Purpose |
|---------|----------|---------|
| `on_auth_user_created` | `handle_new_user()` | Auto-create profile on signup |
| `update_*_updated_at` | `update_updated_at_column()` | Auto-update timestamps |
| `on_delivery_status_change` | `create_delivery_status_history()` | Log status changes |
| `on_b2b_order_confirmed` | `handle_b2b_order_confirmation()` | Update stocks on B2B approval |
| `on_customer_order_confirmed` | `handle_customer_order_confirmation()` | Update stocks on B2C confirmation |

### 4.7 Data Integrity

- **Foreign Keys:** Enforce referential integrity between tables
- **Check Constraints:** Validate data ranges (e.g., quantity > 0, rating 1-5)
- **Unique Constraints:** Prevent duplicate entries (e.g., one role per user)
- **Not Null Constraints:** Ensure required fields are populated
- **Default Values:** Sensible defaults (timestamps, status enums, boolean flags)

---

## Summary

Part 1 establishes the foundation of SmartMartX, covering the project scope, system architecture, technology choices, and database design. The platform leverages modern web technologies and follows industry best practices for security, scalability, and maintainability.

**Next:** Part 2 will detail the implementation of user registration, customer/retailer/wholesaler modules, and real-time features.

---

*End of Part 1*
