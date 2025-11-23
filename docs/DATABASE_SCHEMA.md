# Database Schema Documentation

## Overview

SmartMartX uses **PostgreSQL** (via Supabase) as the primary database. The schema is designed to support a three-tier marketplace connecting customers, retailers, and wholesalers with comprehensive order management, inventory tracking, and real-time delivery updates.

## Schema Diagram

```
┌─────────────┐
│   profiles  │──┐
└─────────────┘  │
                 │
┌─────────────┐  │
│ user_roles  │──┤
└─────────────┘  │
                 │
        ┌────────┴────────┬──────────┐
        │                 │          │
   ┌────▼─────┐    ┌─────▼──┐  ┌───▼──────┐
   │ retailers│    │customers│  │wholesalers│
   └────┬─────┘    └────┬────┘  └────┬─────┘
        │               │            │
        │         ┌─────▼──────┐    │
        │         │   orders   │◄───┘
        │         └─────┬──────┘
        │               │
   ┌────▼────────┐  ┌──▼───────┐
   │retailer_    │  │order_    │
   │ products    │  │ items    │
   └──────┬──────┘  └──────────┘
          │
   ┌──────▼──────┐
   │wholesaler_  │
   │ products    │
   └─────────────┘
```

## Core Tables

### 1. profiles
Stores user profile information for all user types.

**Columns:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, FK → auth.users | User identifier (from Supabase Auth) |
| full_name | TEXT | NOT NULL | User's full name |
| email_verified | BOOLEAN | DEFAULT false | Email verification status |
| auth_provider | ENUM | email/google/facebook | Authentication method used |
| avatar_url | TEXT | NULLABLE | Profile picture URL |
| phone | TEXT | NULLABLE | Contact phone number |
| default_address | TEXT | NULLABLE | Default delivery address |
| default_latitude | NUMERIC | NULLABLE | Default location latitude |
| default_longitude | NUMERIC | NULLABLE | Default location longitude |
| city | TEXT | NULLABLE | City |
| state | TEXT | NULLABLE | State/Province |
| country | TEXT | NULLABLE | Country |
| postal_code | TEXT | NULLABLE | Postal/ZIP code |
| created_at | TIMESTAMP | DEFAULT now() | Record creation time |
| updated_at | TIMESTAMP | DEFAULT now() | Last update time |

**Triggers:**
- `handle_new_user`: Automatically creates profile on user registration
- `update_updated_at_column`: Updates timestamp on modifications

**RLS Policies:**
- Users can view, insert, and update their own profile
- No delete permissions (soft delete pattern)

---

### 2. user_roles
Defines user roles in the system (customer/retailer/wholesaler).

**Columns:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Role assignment identifier |
| user_id | UUID | NOT NULL, UNIQUE | User reference |
| role | ENUM | NOT NULL | customer/retailer/wholesaler |
| created_at | TIMESTAMP | DEFAULT now() | Role assignment time |

**Business Rules:**
- One role per user (enforced via UNIQUE constraint)
- Role cannot be changed after creation
- Set during registration/onboarding

**RLS Policies:**
- Users can view their own role
- Users can insert their role during registration (one-time only)
- Service role can manage all roles

**Database Function:**
```sql
has_role(_user_id UUID, _role app_role) RETURNS BOOLEAN
-- Checks if a user has a specific role
```

---

### 3. retailers
Extended information for users with retailer role.

**Columns:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Retailer identifier |
| user_id | UUID | FK → profiles, UNIQUE | User reference |
| business_name | TEXT | NOT NULL | Business/shop name |
| business_address | TEXT | NOT NULL | Physical business address |
| latitude | NUMERIC | NULLABLE | Business location latitude |
| longitude | NUMERIC | NULLABLE | Business location longitude |
| delivery_radius_km | NUMERIC | DEFAULT 5.0 | Delivery coverage radius |
| is_active | BOOLEAN | DEFAULT true | Business operational status |
| created_at | TIMESTAMP | DEFAULT now() | Record creation time |
| updated_at | TIMESTAMP | DEFAULT now() | Last update time |

**RLS Policies:**
- Retailers can manage their own data
- Customers can view active retailers
- Public can view active retailers

---

### 4. wholesalers
Extended information for users with wholesaler role.

**Columns:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Wholesaler identifier |
| user_id | UUID | FK → profiles, UNIQUE | User reference |
| business_name | TEXT | NOT NULL | Business name |
| business_address | TEXT | NOT NULL | Business address |
| latitude | NUMERIC | NULLABLE | Location latitude |
| longitude | NUMERIC | NULLABLE | Location longitude |
| service_areas | TEXT[] | DEFAULT '{}' | Geographic service areas |
| minimum_order_value | NUMERIC | DEFAULT 0 | Minimum B2B order amount |
| is_active | BOOLEAN | DEFAULT true | Business operational status |
| created_at | TIMESTAMP | DEFAULT now() | Record creation time |
| updated_at | TIMESTAMP | DEFAULT now() | Last update time |

**RLS Policies:**
- Wholesalers can manage their own data
- Retailers can view active wholesalers
- Public cannot view wholesaler data

---

## Product Management

### 5. products
Base product catalog (shared across platform).

**Columns:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Product identifier |
| name | TEXT | NOT NULL | Product name |
| description | TEXT | NULLABLE | Product description |
| category | ENUM | NOT NULL | electronics/clothing/food/home/beauty/sports/books/toys/other |
| base_price | NUMERIC | NOT NULL | Reference price |
| image_url | TEXT | NULLABLE | Product image URL |
| created_at | TIMESTAMP | DEFAULT now() | Product added time |
| updated_at | TIMESTAMP | DEFAULT now() | Last update time |

**RLS Policies:**
- Public and authenticated users can view all products
- Retailers and wholesalers can create products

---

### 6. retailer_products
Retailer-specific product listings and inventory.

**Columns:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Listing identifier |
| retailer_id | UUID | FK → retailers | Retailer reference |
| product_id | UUID | FK → products | Product reference |
| price | NUMERIC | NOT NULL | Retail price |
| stock_quantity | INTEGER | DEFAULT 0 | Available quantity |
| is_available | BOOLEAN | DEFAULT true | Product availability |
| created_at | TIMESTAMP | DEFAULT now() | Listing creation time |
| updated_at | TIMESTAMP | DEFAULT now() | Last update time |

**Unique Constraint:** (retailer_id, product_id)

**RLS Policies:**
- Retailers can manage their own products
- Customers can view available products
- Public can view available products

**Triggers:**
- `handle_customer_order_confirmation`: Reduces stock on order confirmation

---

### 7. wholesaler_products
Wholesaler product catalog and bulk inventory.

**Columns:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Listing identifier |
| wholesaler_id | UUID | FK → wholesalers | Wholesaler reference |
| product_id | UUID | FK → products | Product reference |
| price | NUMERIC | NOT NULL | Wholesale price |
| stock_quantity | INTEGER | DEFAULT 0 | Bulk quantity |
| minimum_order_quantity | INTEGER | DEFAULT 1 | Minimum order qty (MOQ) |
| is_available | BOOLEAN | DEFAULT true | Product availability |
| created_at | TIMESTAMP | DEFAULT now() | Listing creation time |
| updated_at | TIMESTAMP | DEFAULT now() | Last update time |

**Unique Constraint:** (wholesaler_id, product_id)

**RLS Policies:**
- Wholesalers can manage their own products
- Retailers can view available products
- Public cannot view wholesaler products

**Triggers:**
- `handle_b2b_order_confirmation`: Updates stock and creates retailer products

---

## Order Management

### 8. orders
Master order table for all order types.

**Columns:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Order identifier |
| order_number | TEXT | UNIQUE, DEFAULT generate_order_number() | Human-readable order ID |
| order_type | ENUM | NOT NULL | customer_to_retailer / retailer_to_wholesaler |
| buyer_id | UUID | FK → profiles | Buyer reference |
| seller_id | UUID | FK → profiles | Seller reference |
| status | ENUM | DEFAULT 'pending' | pending/confirmed/processing/shipped/delivered/cancelled |
| total_amount | NUMERIC | NOT NULL | Order total |
| delivery_address | TEXT | NOT NULL | Delivery location |
| delivery_latitude | NUMERIC | NULLABLE | Delivery latitude |
| delivery_longitude | NUMERIC | NULLABLE | Delivery longitude |
| notes | TEXT | NULLABLE | Order notes/instructions |
| created_at | TIMESTAMP | DEFAULT now() | Order placement time |
| updated_at | TIMESTAMP | DEFAULT now() | Last update time |

**Order Number Format:** `ORD` + 6 random alphanumeric characters (e.g., ORD4F8A2C)

**Status Flow:**
```
pending → confirmed → processing → shipped → delivered
   ↓
cancelled (from any status)
```

**RLS Policies:**
- Buyers can create and view their orders
- Sellers can view and update their orders
- Retailers can create B2B orders
- Wholesalers can manage B2B orders

**Triggers:**
- `handle_customer_order_confirmation`: Processes B2C orders
- `handle_b2b_order_confirmation`: Processes B2B orders

---

### 9. order_items
Line items for each order.

**Columns:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Line item identifier |
| order_id | UUID | FK → orders | Order reference |
| product_id | UUID | FK → products | Product reference |
| quantity | INTEGER | NOT NULL | Ordered quantity |
| unit_price | NUMERIC | NOT NULL | Price per unit |
| subtotal | NUMERIC | NOT NULL | Line total (qty × price) |
| created_at | TIMESTAMP | DEFAULT now() | Item added time |

**RLS Policies:**
- Buyers can create order items
- Buyers and sellers can view order items

---

## Delivery Tracking

### 10. delivery_tracking
Real-time delivery tracking information.

**Columns:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Tracking identifier |
| order_id | UUID | FK → orders, UNIQUE | Order reference |
| tracking_number | TEXT | UNIQUE, DEFAULT generate_tracking_number() | Tracking ID |
| current_status | ENUM | DEFAULT 'pending' | pending/confirmed/packed/picked_up/in_transit/out_for_delivery/delivered/cancelled |
| delivery_partner_name | TEXT | NOT NULL | Courier name |
| delivery_partner_phone | TEXT | NOT NULL | Contact number |
| estimated_delivery_time | TIMESTAMP | NOT NULL | ETA |
| actual_delivery_time | TIMESTAMP | NULLABLE | Actual delivery time |
| current_latitude | NUMERIC | NULLABLE | Current location latitude |
| current_longitude | NUMERIC | NULLABLE | Current location longitude |
| delivery_notes | TEXT | NULLABLE | Special instructions |
| created_at | TIMESTAMP | DEFAULT now() | Tracking creation time |
| updated_at | TIMESTAMP | DEFAULT now() | Last update time |

**Tracking Number Format:** `TRK` + 6 random alphanumeric characters

**Status Progression:**
```
pending (0.5 min) → confirmed (1 min) → packed (1 min) → 
picked_up (2 min) → in_transit (2 min) → out_for_delivery (3 min) → 
delivered
```

**RLS Policies:**
- Buyers can view their delivery tracking
- Sellers can view and manage delivery tracking

**Triggers:**
- `create_delivery_status_history`: Logs every status change

---

### 11. delivery_status_history
Historical log of delivery status changes.

**Columns:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | History entry identifier |
| delivery_tracking_id | UUID | FK → delivery_tracking | Tracking reference |
| status | ENUM | NOT NULL | Status at this point |
| timestamp | TIMESTAMP | DEFAULT now() | Status change time |
| location | TEXT | NULLABLE | Location description |
| latitude | NUMERIC | NULLABLE | Location latitude |
| longitude | NUMERIC | NULLABLE | Location longitude |
| notes | TEXT | NULLABLE | Status notes |
| created_at | TIMESTAMP | DEFAULT now() | Record creation time |

**RLS Policies:**
- Buyers and sellers can view status history
- Sellers can insert status updates

---

## Shopping & Cart

### 12. cart_items
Temporary cart storage for customers.

**Columns:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Cart item identifier |
| user_id | UUID | FK → profiles | Customer reference |
| seller_id | UUID | FK → profiles | Retailer reference |
| product_id | UUID | FK → products | Product reference |
| quantity | INTEGER | DEFAULT 1 | Item quantity |
| created_at | TIMESTAMP | DEFAULT now() | Added to cart time |
| updated_at | TIMESTAMP | DEFAULT now() | Last update time |

**Unique Constraint:** (user_id, product_id, seller_id)

**RLS Policies:**
- Users can manage their own cart items

---

### 13. customer_addresses
Saved delivery addresses for customers.

**Columns:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Address identifier |
| user_id | UUID | FK → profiles | Customer reference |
| label | TEXT | NOT NULL | Address nickname (Home/Work) |
| address_line1 | TEXT | NOT NULL | Primary address |
| address_line2 | TEXT | NULLABLE | Secondary address |
| city | TEXT | NOT NULL | City |
| state | TEXT | NOT NULL | State/Province |
| postal_code | TEXT | NOT NULL | Postal code |
| country | TEXT | DEFAULT 'India' | Country |
| latitude | NUMERIC | NULLABLE | Location latitude |
| longitude | NUMERIC | NULLABLE | Location longitude |
| is_default | BOOLEAN | DEFAULT false | Default address flag |
| created_at | TIMESTAMP | DEFAULT now() | Address added time |
| updated_at | TIMESTAMP | DEFAULT now() | Last update time |

**RLS Policies:**
- Customers can manage their own addresses

---

## Payment Management

### 14. payment_methods
Saved payment methods for customers.

**Columns:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Payment method identifier |
| user_id | UUID | FK → profiles | Customer reference |
| method_type | ENUM | NOT NULL | card/upi/netbanking/cod |
| card_brand | TEXT | NULLABLE | Card brand (Visa/MC/etc) |
| card_last_four | TEXT | NULLABLE | Last 4 digits |
| upi_id | TEXT | NULLABLE | UPI ID |
| is_default | BOOLEAN | DEFAULT false | Default method flag |
| created_at | TIMESTAMP | DEFAULT now() | Method added time |
| updated_at | TIMESTAMP | DEFAULT now() | Last update time |

**RLS Policies:**
- Users can manage their own payment methods

---

### 15. payment_transactions
Payment transaction records.

**Columns:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Transaction identifier |
| transaction_id | TEXT | UNIQUE | External transaction ID |
| order_id | UUID | FK → orders | Order reference |
| user_id | UUID | FK → profiles | Customer reference |
| payment_method_id | UUID | FK → payment_methods | Payment method used |
| payment_method_type | ENUM | NOT NULL | Payment type |
| amount | NUMERIC | NOT NULL | Transaction amount |
| status | ENUM | DEFAULT 'pending' | pending/processing/completed/failed/refunded |
| gateway_response | JSONB | NULLABLE | Gateway response data |
| failure_reason | TEXT | NULLABLE | Failure description |
| completed_at | TIMESTAMP | NULLABLE | Completion time |
| created_at | TIMESTAMP | DEFAULT now() | Transaction start time |
| updated_at | TIMESTAMP | DEFAULT now() | Last update time |

**Transaction ID Format:** `TXN` + 12 random alphanumeric characters

**RLS Policies:**
- Users can create and view their transactions
- Sellers can view transactions for their orders

---

## Feedback & Ratings

### 16. feedback
Product and seller feedback/ratings.

**Columns:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Feedback identifier |
| order_id | UUID | FK → orders | Order reference |
| reviewer_id | UUID | FK → profiles | Reviewer reference |
| reviewee_id | UUID | FK → profiles | Reviewed party reference |
| product_id | UUID | FK → products, NULLABLE | Product reference (if product review) |
| rating | INTEGER | NOT NULL, 1-5 | Star rating |
| comment | TEXT | NULLABLE | Review comment |
| created_at | TIMESTAMP | DEFAULT now() | Review submission time |

**Business Rules:**
- Only for delivered orders
- One review per order-product combination
- Ratings: 1 (worst) to 5 (best)

**RLS Policies:**
- Users can create feedback for completed orders
- Anyone can view product feedback
- Users can view feedback they gave or received

---

## Notifications

### 17. notifications
System notifications for users.

**Columns:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Notification identifier |
| user_id | UUID | FK → profiles | Recipient reference |
| type | ENUM | NOT NULL | order_placed/payment_success/payment_failed/order_confirmed/order_packed/order_shipped/out_for_delivery/delivered/order_cancelled |
| title | TEXT | NOT NULL | Notification title |
| message | TEXT | NOT NULL | Notification content |
| is_read | BOOLEAN | DEFAULT false | Read status |
| related_order_id | UUID | FK → orders, NULLABLE | Related order |
| related_transaction_id | UUID | FK → payment_transactions, NULLABLE | Related transaction |
| created_at | TIMESTAMP | DEFAULT now() | Notification time |

**RLS Policies:**
- Users can view and update their own notifications
- System creates notifications (no user insert)

**Real-time Subscription:**
- Frontend subscribes to new notifications
- Toast notifications on new entries

---

## Database Functions

### 1. generate_order_number()
```sql
RETURNS TEXT
-- Generates unique order numbers: ORD + 6 random chars
-- Example: ORD4F8A2C
```

### 2. generate_tracking_number()
```sql
RETURNS TEXT
-- Generates unique tracking numbers: TRK + 6 random chars
-- Example: TRKB3E9F1
```

### 3. generate_transaction_id()
```sql
RETURNS TEXT
-- Generates unique transaction IDs: TXN + 12 random chars
-- Example: TXNA4F8B2E9C1D5F
```

### 4. has_role(_user_id UUID, _role app_role)
```sql
RETURNS BOOLEAN
-- Checks if a user has a specific role
-- Used in RLS policies
```

### 5. validate_order_status_transition(current_status, new_status)
```sql
RETURNS BOOLEAN
-- Validates delivery status transitions
-- Ensures proper order progression
```

### 6. update_updated_at_column()
```sql
RETURNS TRIGGER
-- Automatically updates updated_at timestamp
```

### 7. handle_new_user()
```sql
RETURNS TRIGGER
-- Creates profile on user registration
-- Extracts data from Supabase Auth metadata
```

### 8. create_delivery_status_history()
```sql
RETURNS TRIGGER
-- Logs delivery status changes
-- Creates history entries automatically
```

### 9. handle_customer_order_confirmation()
```sql
RETURNS TRIGGER
-- Processes B2C order confirmations
-- Reduces retailer stock
-- Validates stock availability
```

### 10. handle_b2b_order_confirmation()
```sql
RETURNS TRIGGER
-- Processes B2B order confirmations
-- Reduces wholesaler stock
-- Creates/updates retailer products
-- Applies 20% markup for retail pricing
-- Sends notifications
```

---

## Enums

### app_role
```sql
'customer' | 'retailer' | 'wholesaler'
```

### auth_provider
```sql
'email' | 'google' | 'facebook'
```

### order_type
```sql
'customer_to_retailer' | 'retailer_to_wholesaler'
```

### order_status
```sql
'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
```

### delivery_status
```sql
'pending' | 'confirmed' | 'packed' | 'picked_up' | 'in_transit' | 
'out_for_delivery' | 'delivered' | 'cancelled'
```

### payment_method_type
```sql
'card' | 'upi' | 'netbanking' | 'cod'
```

### payment_status
```sql
'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
```

### notification_type
```sql
'order_placed' | 'payment_success' | 'payment_failed' | 'order_confirmed' |
'order_packed' | 'order_shipped' | 'out_for_delivery' | 'delivered' | 'order_cancelled'
```

### product_category
```sql
'electronics' | 'clothing' | 'food' | 'home' | 'beauty' | 
'sports' | 'books' | 'toys' | 'other'
```

---

## Indexes

Automatically created on:
- Primary keys (UUID)
- Foreign keys
- Unique constraints
- order_number, tracking_number, transaction_id

Additional indexes recommended for:
- orders(status, created_at)
- delivery_tracking(current_status)
- retailer_products(is_available)
- wholesaler_products(is_available)

---

## Data Integrity

### Referential Integrity
- All foreign keys have CASCADE rules
- Deleting a user cascades to related records
- Order deletion cascades to order items

### Constraints
- CHECK constraints on ratings (1-5)
- NOT NULL on critical fields
- UNIQUE constraints on identifiers
- DEFAULT values for timestamps and booleans

### Row Level Security
- Every table has RLS enabled
- Policies enforce role-based access
- Users can only access their own data
- Public access for browsing products

---

## Backup & Recovery

- **Automated Backups**: Daily via Supabase
- **Point-in-Time Recovery**: Available
- **Migration History**: Tracked in supabase/migrations
- **Rollback Strategy**: Migration versioning

---

## Performance Considerations

- UUID primary keys for distributed scaling
- Indexes on frequently queried columns
- Efficient RLS policies
- Connection pooling via Pgbouncer
- Query optimization via EXPLAIN ANALYZE

---

## Future Enhancements

- Full-text search on products
- Product inventory snapshots
- Order analytics materialized views
- Geospatial queries for location-based search
- Archive tables for historical data
