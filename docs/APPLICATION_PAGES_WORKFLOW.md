# Multi-Tier E-Commerce Platform
## Application Pages & Workflow Documentation

**Purpose**: Complete reference of all pages, routes, and user workflows for presentation

---

## Table of Contents

1. [Public Pages](#1-public-pages)
2. [Authentication Pages](#2-authentication-pages)
3. [Customer Pages](#3-customer-pages)
4. [Retailer Pages](#4-retailer-pages)
5. [Wholesaler Pages](#5-wholesaler-pages)
6. [Shared Components](#6-shared-components)
7. [Page Flow Diagrams](#7-page-flow-diagrams)

---

## 1. Public Pages

### 1.1 Landing Page (`/`)
**Route**: `/`  
**Component**: `src/pages/Index.tsx`  
**Access**: Public (Anyone)

**Purpose**: Main entry point for all users

**Content**:
- Hero section with platform overview
- Value propositions for each user type
- Feature highlights
- Call-to-action buttons (Login/Register)
- Platform statistics
- How it works section

**Navigation**:
- Login → `/login`
- Register → `/register`
- Auto-redirect based on user role if already logged in

---

### 1.2 404 Not Found Page
**Route**: `*` (catch-all)  
**Component**: `src/pages/NotFound.tsx`  
**Access**: Public

**Purpose**: Handle invalid routes

**Content**:
- 404 error message
- Navigation back to home
- Helpful links

---

## 2. Authentication Pages

### 2.1 Login Page
**Route**: `/login`  
**Component**: `src/pages/auth/Login.tsx`  
**Access**: Public (Unauthenticated users only)

**Purpose**: User authentication

**Features**:
- Email/Password login form
- Google OAuth button
- "Remember Me" checkbox
- Forgot password link
- Link to registration page
- Auto-check auth provider before login

**Workflow**:
```
1. User enters email
2. System checks auth provider (Edge Function)
3. If Google: Show Google login only
4. If Email: Show password field
5. After login: Redirect to onboarding or role-specific dashboard
```

**Navigation After Login**:
- If profile incomplete → `/onboarding`
- If customer → `/customer/dashboard`
- If retailer → `/retailer/dashboard`
- If wholesaler → `/wholesaler/dashboard`

---

### 2.2 Registration Page
**Route**: `/register`  
**Component**: `src/pages/auth/Register.tsx`  
**Access**: Public (Unauthenticated users only)

**Purpose**: New user account creation

**Features**:
- Email/Password registration form
- Google OAuth button
- Full name input
- Terms & conditions checkbox
- Link to login page

**Workflow**:
```
1. User enters details
2. Creates auth account
3. Creates profile in database
4. Redirects to onboarding for role selection
```

**Navigation After Registration**:
- Always → `/onboarding`

---

### 2.3 Reset Password Page
**Route**: `/reset-password`  
**Component**: `src/pages/auth/ResetPassword.tsx`  
**Access**: Public

**Purpose**: Password recovery

**Features**:
- Email input for reset link
- Success message
- Back to login link

**Workflow**:
```
1. User enters email
2. System sends reset link via email
3. User clicks link in email
4. User sets new password
5. Redirects to login
```

---

### 2.4 Onboarding Page
**Route**: `/onboarding`  
**Component**: `src/pages/Onboarding.tsx`  
**Access**: Authenticated (Users without role)

**Purpose**: Role selection and business information collection

**Steps**:
1. **Role Selection**
   - Customer (no additional info needed)
   - Retailer (business info required)
   - Wholesaler (business info required)

2. **Business Information** (Retailers & Wholesalers only)
   - Business name
   - Business address (Google Places autocomplete)
   - Phone number
   - Delivery radius (Retailers)
   - Service areas (Wholesalers)
   - Minimum order value (Wholesalers)

**Workflow**:
```
1. User selects role
2. If Customer: Direct to dashboard
3. If Retailer/Wholesaler: Fill business form
4. Create role-specific record in database
5. Redirect to role-specific dashboard
```

---

## 3. Customer Pages

### 3.1 Customer Dashboard
**Route**: `/customer/dashboard`  
**Component**: `src/pages/customer/Dashboard.tsx`  
**Access**: Authenticated (Customer role)

**Purpose**: Customer home page

**Sections**:
- Welcome message with user name
- Quick stats (Total orders, active orders)
- Recent orders list
- Featured products
- Quick actions (Browse retailers, view cart, view orders)
- Category shortcuts

**Navigation**:
- Browse Retailers → `/customer/retailers`
- View Cart → `/customer/cart`
- View Orders → `/customer/orders`
- View Profile → `/customer/profile`

---

### 3.2 Retailers List Page
**Route**: `/customer/retailers`  
**Component**: `src/pages/customer/Retailers.tsx`  
**Access**: Authenticated (Customer role)

**Purpose**: Browse available retailers

**Features**:
- Grid/list view of nearby retailers
- Retailer cards with:
  - Business name
  - Address
  - Distance from user
  - Delivery radius
  - Active status
- Search functionality
- Filter options
- Sort by distance/rating

**Navigation**:
- Click retailer → `/customer/retailers/:retailerId/products`

---

### 3.3 Retailer Products Page
**Route**: `/customer/retailers/:retailerId/products`  
**Component**: `src/pages/customer/RetailerProducts.tsx`  
**Access**: Authenticated (Customer role)

**Purpose**: Browse products from specific retailer

**Features**:
- Category tabs/filters
- Product grid with cards showing:
  - Product image
  - Name, price, description
  - Stock availability
  - Add to cart button
- Search within retailer
- Real-time stock updates
- Category navigation

**Navigation**:
- Click product → `/customer/products/:productId`
- Add to cart → Updates cart count
- View cart → `/customer/cart`

---

### 3.4 Product Detail Page
**Route**: `/customer/products/:productId`  
**Component**: `src/pages/customer/ProductDetail.tsx`  
**Access**: Authenticated (Customer role)

**Purpose**: Detailed product information

**Features**:
- Large product image
- Detailed description
- Price information
- Stock availability
- Quantity selector
- Add to cart button
- Product specifications
- Related products
- Customer reviews (if available)

**Actions**:
- Add to cart
- Buy now (direct to checkout)
- Back to products list

---

### 3.5 Shopping Cart Page
**Route**: `/customer/cart`  
**Component**: `src/pages/customer/Cart.tsx`  
**Access**: Authenticated (Customer role)

**Purpose**: Review and manage cart items

**Features**:
- List of cart items with:
  - Product details
  - Quantity controls (+/-)
  - Remove button
  - Subtotal per item
- Cart summary:
  - Subtotal
  - Tax/fees
  - Total amount
- Empty cart state
- Continue shopping button
- Proceed to checkout button

**Navigation**:
- Continue Shopping → Back to previous page
- Proceed to Checkout → `/customer/checkout`
- Remove item → Updates cart

---

### 3.6 Checkout Page
**Route**: `/customer/checkout`  
**Component**: `src/pages/customer/Checkout.tsx`  
**Access**: Authenticated (Customer role)

**Purpose**: Complete order purchase

**Multi-Step Flow**:

#### Step 1: Delivery Address
- Select from saved addresses
- Add new address form
- Google Maps integration
- Set as default option

#### Step 2: Payment Method
- Select from saved payment methods
- Add new payment method
- Payment options:
  - Credit/Debit Card
  - UPI
  - Net Banking
  - Cash on Delivery

#### Step 3: Order Review
- Order summary
- Selected address
- Selected payment method
- Item list with quantities
- Total amount
- Order notes (optional)
- Place order button

**Workflow**:
```
1. Select/Add delivery address → Next
2. Select/Add payment method → Next
3. Review order details
4. Place order
5. Create order in database
6. Create payment transaction
7. Clear cart
8. Redirect to order tracking
```

**Navigation After Order**:
- Success → `/customer/orders/:orderId/tracking`

---

### 3.7 Orders Page
**Route**: `/customer/orders`  
**Component**: `src/pages/customer/Orders.tsx`  
**Access**: Authenticated (Customer role)

**Purpose**: View order history

**Features**:
- List of all orders (newest first)
- Order cards showing:
  - Order number
  - Date placed
  - Status badge
  - Total amount
  - Number of items
  - Seller information
- Filter by status (Pending, Confirmed, Delivered, etc.)
- Search orders
- Status color coding

**Order Statuses**:
- 🟡 Pending
- 🔵 Confirmed
- 🟠 Processing
- 🟣 Shipped
- 🟢 Delivered
- 🔴 Cancelled

**Navigation**:
- Click order → `/customer/orders/:orderId/tracking`

---

### 3.8 Order Tracking Page
**Route**: `/customer/orders/:orderId/tracking`  
**Component**: `src/pages/customer/OrderTracking.tsx`  
**Access**: Authenticated (Customer role)

**Purpose**: Real-time delivery tracking

**Features**:
- **Current Status Badge**: Large, prominent display
- **Order Summary Card**:
  - Order number
  - Total amount
  - Order status
  
- **Delivery Timeline**:
  - Status history with timestamps
  - Progress indicators
  - Status descriptions
  
- **Live Map View**:
  - Current delivery location
  - Delivery address marker
  - Route visualization
  - Real-time position updates
  
- **Delivery Partner Card**:
  - Partner name
  - Phone number
  - Call button
  
- **Delivery Notes** (if any)
- **Estimated Delivery Time**

**Real-Time Updates**:
- Status changes appear instantly
- Map updates with location changes
- Notifications for status updates

**Navigation**:
- Back to Orders → `/customer/orders`
- Contact Support → (If implemented)

---

### 3.9 Customer Profile Page
**Route**: `/customer/profile`  
**Component**: `src/pages/customer/Profile.tsx`  
**Access**: Authenticated (Customer role)

**Purpose**: Manage customer account

**Sections**:

#### Personal Information
- Full name
- Email (read-only)
- Phone number
- Avatar/profile picture

#### Address Management
- List of saved addresses
- Add new address
- Edit addresses
- Delete addresses
- Set default address

#### Payment Methods
- Saved payment methods
- Add new payment method
- Delete payment methods
- Set default payment method

#### Account Settings
- Change password
- Notification preferences
- Logout button

**Features**:
- Edit profile information
- Upload profile picture
- Manage addresses with Google Places autocomplete
- Secure payment method storage

---

## 4. Retailer Pages

### 4.1 Retailer Dashboard
**Route**: `/retailer/dashboard`  
**Component**: `src/pages/retailer/Dashboard.tsx`  
**Access**: Authenticated (Retailer role)

**Purpose**: Retailer home page and analytics

**Sections**:

#### Summary Cards
- Total Products
- Total Orders
- Pending Orders
- Delivered Orders

#### Quick Actions
- Manage Products → `/retailer/products`
- Order Management → `/retailer/orders`
- View Wholesalers → `/retailer/wholesalers`
- View Profile → `/retailer/profile`

#### Analytics Charts
1. **Order Statistics Chart**
   - Orders over time
   - Status breakdown
   
2. **Revenue Chart**
   - Revenue trends
   - Period comparisons
   
3. **Delivery Performance Chart**
   - Delivery success rate
   - Average delivery time

#### Recent Orders
- Latest 5 orders
- Quick status view

---

### 4.2 Products Management Page
**Route**: `/retailer/products`  
**Component**: `src/pages/retailer/Products.tsx`  
**Access**: Authenticated (Retailer role)

**Purpose**: Manage retailer inventory

**Features**:

#### Product List
- Grid view of all products
- Product cards with:
  - Product image
  - Name, description
  - Price
  - Stock quantity
  - Availability toggle
  - Edit/Delete buttons

#### Actions
- **Add New Product** (Manual or from wholesaler)
- **Edit Product**:
  - Update price
  - Update stock quantity
  - Change availability
  - Modify description
- **Delete Product**
- **Toggle Availability**

#### Filters & Search
- Search by name
- Filter by category
- Filter by availability
- Sort by price/stock

**Navigation**:
- Add from Wholesaler → `/retailer/wholesalers`
- View Pending Products → `/retailer/pending-products`

---

### 4.3 Pending Products Page
**Route**: `/retailer/pending-products`  
**Component**: `src/pages/retailer/PendingProducts.tsx`  
**Access**: Authenticated (Retailer role)

**Purpose**: View products pending approval from B2B orders

**Features**:
- List of products from confirmed B2B orders
- Not yet added to inventory
- Product details from wholesaler
- One-click approval to add to inventory
- Bulk approval option

**Workflow**:
```
1. Retailer places B2B order with wholesaler
2. Wholesaler confirms order
3. Products appear in pending list
4. Retailer clicks "Add to Inventory"
5. Product appears in main products list
6. Retailer can set retail price and stock
```

---

### 4.4 Wholesalers List Page
**Route**: `/retailer/wholesalers`  
**Component**: `src/pages/retailer/Wholesalers.tsx`  
**Access**: Authenticated (Retailer role)

**Purpose**: Browse available wholesalers for B2B ordering

**Features**:
- List of active wholesalers
- Wholesaler cards with:
  - Business name
  - Business address
  - Service areas
  - Minimum order value
  - Active status
- Search functionality
- Filter options

**Navigation**:
- Click wholesaler → `/retailer/wholesalers/:wholesalerId/products`

---

### 4.5 Wholesaler Products Page (B2B)
**Route**: `/retailer/wholesalers/:wholesalerId/products`  
**Component**: `src/pages/retailer/WholesalerProducts.tsx`  
**Access**: Authenticated (Retailer role)

**Purpose**: Browse and order products from wholesaler

**Features**:
- Product grid from selected wholesaler
- Product cards showing:
  - Product details
  - Wholesale price
  - Minimum order quantity (MOQ)
  - Available stock
  - Order quantity input
  - Add to B2B cart button
- Category filters
- Search within wholesaler
- B2B cart summary
- Place bulk order button

**B2B Order Flow**:
```
1. Browse wholesaler products
2. Add items to B2B cart (respecting MOQ)
3. Review B2B cart
4. Place bulk order
5. Order goes to wholesaler for approval
6. After approval: Products appear in pending products
```

**MOQ Validation**:
- Cannot add less than MOQ
- Visual indicator for MOQ
- Error message if MOQ not met

---

### 4.6 Orders Management Page
**Route**: `/retailer/orders`  
**Component**: `src/pages/retailer/Orders.tsx`  
**Access**: Authenticated (Retailer role)

**Purpose**: View and manage customer orders

**Features**:

#### Order Tabs
1. **Pending Orders**: Need action
2. **Confirmed Orders**: Approved, in process
3. **All Orders**: Complete history

#### Order Cards
- Order details:
  - Order number
  - Customer name
  - Order date
  - Total amount
  - Status
- Item list with quantities
- Delivery address
- Customer notes

#### Actions (For Pending Orders)
- **Confirm Order**: Accept and start processing
- **Cancel Order**: Reject with reason
- **View Details**: Full order information

**Navigation**:
- View Details → `/retailer/orders/:orderId`

---

### 4.7 Order Detail Page
**Route**: `/retailer/orders/:orderId`  
**Component**: `src/pages/retailer/OrderDetail.tsx`  
**Access**: Authenticated (Retailer role)

**Purpose**: Detailed view of specific order

**Content**:
- Complete order information
- Customer details
- Item breakdown
- Payment information
- Delivery tracking info
- Order timeline
- Status history

**Actions**:
- Update order status
- Add notes
- Contact customer
- Print invoice
- Back to orders list

---

### 4.8 Retailer Profile Page
**Route**: `/retailer/profile`  
**Component**: `src/pages/retailer/Profile.tsx`  
**Access**: Authenticated (Retailer role)

**Purpose**: Manage retailer account and business info

**Sections**:

#### Personal Information
- Full name
- Email
- Phone number
- Profile picture

#### Business Information
- Business name
- Business address
- Delivery radius
- Operating hours
- Business license info

#### Account Settings
- Change password
- Notification preferences
- Business status (Active/Inactive)
- Logout

**Features**:
- Update business details
- Modify delivery radius
- Change business address
- Toggle business availability

---

## 5. Wholesaler Pages

### 5.1 Wholesaler Dashboard
**Route**: `/wholesaler/dashboard`  
**Component**: `src/pages/wholesaler/Dashboard.tsx`  
**Access**: Authenticated (Wholesaler role)

**Purpose**: Wholesaler home page and analytics

**Sections**:

#### Summary Cards
- Total Products
- Total Revenue
- Active Retailers
- Pending B2B Orders

#### Quick Actions
- Manage Products → `/wholesaler/products`
- View B2B Orders → `/wholesaler/orders`
- Order Management → `/wholesaler/order-management`
- View Profile → `/wholesaler/profile`

#### Analytics Charts
1. **Revenue Trends**
   - Monthly revenue
   - Year-over-year comparison
   
2. **Category Sales**
   - Top-selling categories
   - Sales distribution
   
3. **Retailer Network**
   - Active vs inactive retailers
   - Order frequency

#### Recent B2B Orders
- Latest orders from retailers
- Quick approval/rejection

---

### 5.2 Products Management Page
**Route**: `/wholesaler/products`  
**Component**: `src/pages/wholesaler/Products.tsx`  
**Access**: Authenticated (Wholesaler role)

**Purpose**: Manage wholesale product catalog

**Features**:

#### Product List
- Grid view of all wholesale products
- Product cards with:
  - Product image
  - Name, category
  - Wholesale price
  - Minimum order quantity (MOQ)
  - Stock quantity
  - Availability status
  - Edit/Delete buttons

#### Add New Product Form
- Product name
- Description
- Category selection
- Base price (wholesale price)
- Minimum order quantity
- Initial stock quantity
- Product image upload
- Availability toggle

#### Edit Product
- Update all product details
- Modify pricing
- Adjust MOQ
- Update stock quantities
- Change availability

#### Bulk Actions
- Bulk price updates
- Bulk stock updates
- Bulk availability toggle

**Features**:
- Real-time stock tracking
- Low stock alerts
- Category management
- Image upload

---

### 5.3 B2B Orders Page
**Route**: `/wholesaler/orders`  
**Component**: `src/pages/wholesaler/Orders.tsx`  
**Access**: Authenticated (Wholesaler role)

**Purpose**: View all B2B orders from retailers

**Features**:

#### Order Tabs
1. **Pending Orders**: Need approval
2. **Confirmed Orders**: Approved
3. **All Orders**: Complete history

#### Order Cards
- Order details:
  - Order number
  - Retailer name
  - Order date
  - Total amount
  - Status
- Item list with quantities
- Delivery information

**Navigation**:
- View Details → Order detail modal/page

---

### 5.4 Order Management Page
**Route**: `/wholesaler/order-management`  
**Component**: `src/pages/wholesaler/OrderManagement.tsx`  
**Access**: Authenticated (Wholesaler role)

**Purpose**: Approve/reject pending B2B orders

**Features**:

#### Pending Orders List
- Detailed order cards
- Retailer information
- Order items with quantities
- Total order value
- MOQ validation status

#### Actions Per Order
- **Approve Order**:
  - Confirms order
  - Deducts stock
  - Notifies retailer
  - Moves products to retailer's pending list
  
- **Reject Order**:
  - Cancels order
  - Reason for rejection (optional)
  - Notifies retailer
  - Restores cart items

**Workflow**:
```
1. Retailer places B2B order
2. Order appears in pending list
3. Wholesaler reviews order
4. Approve/Reject decision
5. If approved:
   - Stock deducted
   - Products sent to retailer pending list
   - Notification sent
6. If rejected:
   - Order cancelled
   - Retailer notified with reason
```

**Features**:
- Quick approve/reject buttons
- Bulk actions
- Order filtering
- Search functionality

---

### 5.5 Wholesaler Profile Page
**Route**: `/wholesaler/profile`  
**Component**: `src/pages/wholesaler/Profile.tsx`  
**Access**: Authenticated (Wholesaler role)

**Purpose**: Manage wholesaler account and business info

**Sections**:

#### Personal Information
- Full name
- Email
- Phone number
- Profile picture

#### Business Information
- Business name
- Business address
- Service areas (multiple)
- Minimum order value
- Business license
- Tax information

#### Account Settings
- Change password
- Notification preferences
- Business status (Active/Inactive)
- Logout

**Features**:
- Update business details
- Manage service areas
- Set minimum order value
- Toggle business availability

---

## 6. Shared Components

### 6.1 Navigation Bar (NavBar)
**Component**: `src/components/NavBar.tsx`  
**Usage**: All authenticated pages

**Features**:
- Logo/Brand name
- Role-based navigation links
- Notification bell with badge count
- Cart icon (Customer only)
- User profile dropdown
- Logout button

**Role-Based Links**:

**Customer**:
- Dashboard
- Retailers
- Cart
- Orders
- Profile

**Retailer**:
- Dashboard
- Products
- Orders
- Wholesalers
- Profile

**Wholesaler**:
- Dashboard
- Products
- Orders
- Order Management
- Profile

---

### 6.2 Notifications Dropdown
**Component**: `src/components/NotificationBell.tsx`, `src/components/NotificationsList.tsx`

**Features**:
- Real-time notification count badge
- Dropdown list of recent notifications
- Mark as read functionality
- Mark all as read
- Notification types:
  - Order placed
  - Order confirmed
  - Payment success/failed
  - Order shipped
  - Out for delivery
  - Delivered
  - Order cancelled

---

### 6.3 Mini Cart (Customer)
**Component**: `src/components/customer/MiniCart.tsx`

**Features**:
- Hover/click to view cart summary
- Quick view of cart items
- Cart item count
- Quick remove items
- Go to cart button
- Checkout button

---

## 7. Page Flow Diagrams

### 7.1 Customer User Journey

```
Landing Page (/)
    ↓
Register (/register) → Login (/login)
    ↓                      ↓
Onboarding (/onboarding) ←┘
    ↓
Customer Dashboard (/customer/dashboard)
    ↓
    ├─→ Browse Retailers (/customer/retailers)
    │       ↓
    │   Retailer Products (/customer/retailers/:id/products)
    │       ↓
    │   Product Detail (/customer/products/:id)
    │       ↓
    │   Add to Cart
    │       ↓
    ├─→ Shopping Cart (/customer/cart)
    │       ↓
    │   Checkout (/customer/checkout)
    │       ↓
    │   [3 Steps: Address → Payment → Review]
    │       ↓
    │   Place Order
    │       ↓
    ├─→ Order Tracking (/customer/orders/:id/tracking)
    │   [Real-time updates, Map view]
    │       ↓
    ├─→ Orders History (/customer/orders)
    │
    └─→ Profile (/customer/profile)
        [Edit info, Addresses, Payment methods]
```

---

### 7.2 Retailer User Journey

```
Landing Page (/)
    ↓
Register → Login
    ↓
Onboarding (Select Retailer + Business Info)
    ↓
Retailer Dashboard (/retailer/dashboard)
    ↓
    ├─→ Manage Products (/retailer/products)
    │   [Add, Edit, Delete products]
    │       ↓
    │   Add from Wholesaler
    │       ↓
    ├─→ Browse Wholesalers (/retailer/wholesalers)
    │       ↓
    │   Wholesaler Products (/retailer/wholesalers/:id/products)
    │   [MOQ validation]
    │       ↓
    │   Place B2B Order
    │       ↓
    │   [Wait for wholesaler approval]
    │       ↓
    ├─→ Pending Products (/retailer/pending-products)
    │   [Approve to add to inventory]
    │       ↓
    ├─→ Manage Products (Updated inventory)
    │
    ├─→ Order Management (/retailer/orders)
    │   [Pending, Confirmed, All tabs]
    │       ↓
    │   Confirm/Cancel Orders
    │       ↓
    │   Order Detail (/retailer/orders/:id)
    │
    └─→ Profile (/retailer/profile)
        [Business info, Settings]
```

---

### 7.3 Wholesaler User Journey

```
Landing Page (/)
    ↓
Register → Login
    ↓
Onboarding (Select Wholesaler + Business Info)
    ↓
Wholesaler Dashboard (/wholesaler/dashboard)
    ↓
    ├─→ Manage Products (/wholesaler/products)
    │   [Add, Edit, Delete wholesale products]
    │   [Set MOQ, Pricing, Stock]
    │
    ├─→ B2B Orders (/wholesaler/orders)
    │   [View all retailer orders]
    │       ↓
    │   Order Management (/wholesaler/order-management)
    │   [Pending orders needing approval]
    │       ↓
    │   Approve/Reject Orders
    │       ↓
    │   [If approved: Stock deducted, retailer notified]
    │   [If rejected: Order cancelled, retailer notified]
    │
    └─→ Profile (/wholesaler/profile)
        [Business info, Service areas, Settings]
```

---

### 7.4 Order Status Progression

```
Customer Places Order
    ↓
Order Status: PENDING
    ↓
Retailer Confirms Order
    ↓
Order Status: CONFIRMED
    ↓
[Delivery tracking created automatically]
    ↓
Delivery Status: CONFIRMED
    ↓ [2 min delay]
Delivery Status: PACKED
    ↓ [3 min delay]
Delivery Status: PICKED_UP
    ↓ [5 min delay]
Delivery Status: IN_TRANSIT
    ↓ [10 min delay]
Delivery Status: OUT_FOR_DELIVERY
    ↓ [5 min delay]
Delivery Status: DELIVERED
    ↓
Order Status: DELIVERED
    ↓
[Customer can provide feedback]
```

---

### 7.5 B2B Order Flow (Retailer → Wholesaler)

```
Retailer: Browse Wholesalers
    ↓
Retailer: View Wholesaler Products
    ↓
Retailer: Add to B2B Cart (MOQ check)
    ↓
Retailer: Place B2B Order
    ↓
Order Status: PENDING
    ↓
Wholesaler: View in Order Management
    ↓
Wholesaler: Approve or Reject
    ↓
    ├─ If APPROVED:
    │      ↓
    │  Order Status: CONFIRMED
    │      ↓
    │  Stock deducted from wholesaler
    │      ↓
    │  Products → Retailer Pending Products
    │      ↓
    │  Notification sent to retailer
    │      ↓
    │  Retailer: View Pending Products
    │      ↓
    │  Retailer: Approve to add to inventory
    │      ↓
    │  Products → Retailer Inventory
    │
    └─ If REJECTED:
           ↓
       Order Status: CANCELLED
           ↓
       Notification sent to retailer
```

---

## 8. Route Summary Table

| Route | Component | Access | User Type | Purpose |
|-------|-----------|--------|-----------|---------|
| `/` | Index | Public | All | Landing page |
| `/login` | Login | Public | Unauthenticated | User login |
| `/register` | Register | Public | Unauthenticated | User registration |
| `/reset-password` | ResetPassword | Public | All | Password recovery |
| `/onboarding` | Onboarding | Auth | No role | Role selection |
| `/customer/dashboard` | Customer Dashboard | Auth | Customer | Customer home |
| `/customer/retailers` | Retailers | Auth | Customer | Browse retailers |
| `/customer/retailers/:id/products` | RetailerProducts | Auth | Customer | Retailer's products |
| `/customer/products/:id` | ProductDetail | Auth | Customer | Product details |
| `/customer/cart` | Cart | Auth | Customer | Shopping cart |
| `/customer/checkout` | Checkout | Auth | Customer | Order checkout |
| `/customer/orders` | Orders | Auth | Customer | Order history |
| `/customer/orders/:id/tracking` | OrderTracking | Auth | Customer | Live tracking |
| `/customer/profile` | Profile | Auth | Customer | Account settings |
| `/retailer/dashboard` | Retailer Dashboard | Auth | Retailer | Retailer home |
| `/retailer/products` | Products | Auth | Retailer | Inventory management |
| `/retailer/pending-products` | PendingProducts | Auth | Retailer | Approve B2B products |
| `/retailer/wholesalers` | Wholesalers | Auth | Retailer | Browse wholesalers |
| `/retailer/wholesalers/:id/products` | WholesalerProducts | Auth | Retailer | B2B ordering |
| `/retailer/orders` | Orders | Auth | Retailer | Customer orders |
| `/retailer/orders/:id` | OrderDetail | Auth | Retailer | Order details |
| `/retailer/profile` | Profile | Auth | Retailer | Business settings |
| `/wholesaler/dashboard` | Wholesaler Dashboard | Auth | Wholesaler | Wholesaler home |
| `/wholesaler/products` | Products | Auth | Wholesaler | Product catalog |
| `/wholesaler/orders` | Orders | Auth | Wholesaler | B2B order history |
| `/wholesaler/order-management` | OrderManagement | Auth | Wholesaler | Approve B2B orders |
| `/wholesaler/profile` | Profile | Auth | Wholesaler | Business settings |
| `*` | NotFound | Public | All | 404 page |

---

## 9. Key Features by Page

### Real-Time Features
- **Order Tracking**: Live delivery location updates via WebSocket
- **Notifications**: Instant notifications for order status changes
- **Stock Updates**: Real-time inventory synchronization
- **Cart Sync**: Cart updates across devices

### Security Features
- **Protected Routes**: Role-based access control
- **RLS Policies**: Database-level security
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Client and server-side validation

### User Experience Features
- **Responsive Design**: Mobile-first, works on all devices
- **Loading States**: Skeleton screens and spinners
- **Error Handling**: User-friendly error messages
- **Toast Notifications**: Instant feedback
- **Search & Filters**: Easy product discovery
- **Google Maps Integration**: Address selection and delivery tracking

---

## 10. Presentation Flow Recommendation

### Suggested Presentation Order:

1. **Introduction** (Landing Page)
   - Show the value proposition
   - Explain the three-tier model

2. **Authentication Flow** (Register → Login → Onboarding)
   - Demonstrate Google OAuth
   - Show role selection

3. **Customer Journey** (Dashboard → Browse → Cart → Checkout → Tracking)
   - Full purchase flow
   - Real-time tracking demo

4. **Retailer Journey** (Dashboard → Products → B2B Order → Orders)
   - Inventory management
   - B2B ordering process
   - Order fulfillment

5. **Wholesaler Journey** (Dashboard → Products → Order Management)
   - Product catalog
   - B2B order approval
   - Analytics

6. **Real-Time Features Demo**
   - Show notifications in action
   - Demonstrate live delivery tracking
   - Stock updates synchronization

7. **Technical Highlights**
   - Architecture overview
   - Security features
   - Performance optimizations

---

**End of Application Pages & Workflow Documentation**