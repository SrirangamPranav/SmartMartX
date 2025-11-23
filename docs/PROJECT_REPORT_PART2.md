# SmartMartX Project Report - Part 2
## Implementation & Features

---

## 1. User Registration & Authentication

### 1.1 Authentication Architecture

SmartMartX implements a secure, role-based authentication system using Supabase Auth with support for multiple authentication providers.

**Authentication Flow:**
```
User Registration → Role Selection → Business Info (if applicable) → Profile Creation
                                                                    ↓
                                                            Email Verification
                                                                    ↓
                                                            Login & JWT Token
                                                                    ↓
                                                            Authorized Access
```

### 1.2 Supported Authentication Methods

| Method | Implementation | Features |
|--------|---------------|----------|
| **Email/Password** | Native Supabase Auth | Password hashing (bcrypt), email verification, password reset |
| **Google OAuth** | OAuth 2.0 integration | One-click signin, automatic profile creation, secure token exchange |
| **Session Management** | JWT tokens + Refresh tokens | Auto-refresh, persistent sessions, secure storage |

### 1.3 Registration Flow Implementation

**Step 1: Role Selection**
```typescript
// RoleSelector component allows users to choose their role
const roles = ['customer', 'retailer', 'wholesaler'];
// Visual cards with descriptions for each role
```

**Step 2: User Information Collection**
- Full name, email, password (with validation)
- Phone number (optional)
- Role-specific data collection

**Step 3: Business Information (Retailers/Wholesalers)**
- Business name and address
- Google Places Autocomplete integration for accurate location
- Service area configuration
- Delivery radius (retailers) or minimum order value (wholesalers)

**Step 4: Database Records Creation**
```sql
1. Insert into profiles (triggered by auth.users insert)
2. Insert into user_roles (role assignment)
3. Insert into retailers/wholesalers (if applicable)
```

### 1.4 Authentication Security Features

| Feature | Implementation | Purpose |
|---------|---------------|----------|
| **Password Requirements** | Zod validation | Min 6 characters, complexity rules |
| **Row Level Security** | PostgreSQL RLS | User can only access their own data |
| **JWT Tokens** | Supabase Auth | Secure, stateless authentication |
| **Secure Storage** | httpOnly cookies | Prevents XSS attacks |
| **Email Verification** | Supabase email service | Confirms user identity |
| **Password Reset** | Secure token-based flow | Self-service password recovery |

### 1.5 Protected Routes

```typescript
// useRequireAuth hook ensures user authentication
const { user, loading } = useRequireAuth();

if (loading) return <LoadingSpinner />;
if (!user) navigate('/auth/login');
```

**Route Protection Strategy:**
- All dashboard routes require authentication
- Role-specific routes check user permissions
- Redirect to login if unauthenticated
- Redirect to dashboard if already authenticated

### 1.6 AuthContext Implementation

```typescript
interface AuthContext {
  user: User | null;
  profile: Profile | null;
  roles: Role[];
  signOut: () => Promise<void>;
  loading: boolean;
}
```

**Key Features:**
- ✅ Global authentication state
- ✅ Automatic session refresh
- ✅ Profile data caching
- ✅ Role-based access control
- ✅ Auth state listeners

---

## 2. Customer Module Implementation

### 2.1 Customer Features Overview

| Feature | Description | Key Components |
|---------|-------------|----------------|
| **Product Discovery** | Browse by category, search, filter | ProductCard, CategoryTabs |
| **Retailer Selection** | View nearby retailers, compare prices | RetailerCard, RetailerProducts |
| **Shopping Cart** | Add/remove items, update quantities | CartIcon, MiniCart, CartItem |
| **Checkout** | Multi-step process with validation | AddressStep, PaymentMethodStep, OrderReview |
| **Order Tracking** | Real-time delivery updates | DeliveryMap, DeliveryTimeline |
| **Order History** | View past orders, reorder | CustomerOrderCard |
| **Feedback** | Rate products and retailers | ProductFeedbackDialog |

### 2.2 Product Discovery & Browsing

**Category Navigation:**
- 9 product categories with icon representations
- Tab-based navigation for easy switching
- Product count per category

**Search & Filters:**
```typescript
// Search by product name
const { data: products } = useQuery({
  queryKey: ['products', searchQuery, category],
  queryFn: async () => {
    let query = supabase
      .from('retailer_products')
      .select('*, products(*), retailers(*)')
      .eq('is_available', true);
    
    if (category) query = query.eq('products.category', category);
    if (searchQuery) query = query.ilike('products.name', `%${searchQuery}%`);
    
    return query;
  }
});
```

**Product Display:**
- Grid layout with responsive columns
- Product image, name, price, stock status
- Add to cart button with stock validation
- Retailer information and location

### 2.3 Shopping Cart System

**Cart State Management:**
```typescript
const useCart = () => {
  const { data: cartItems } = useQuery({
    queryKey: ['cart'],
    queryFn: fetchCartItems,
  });
  
  const addToCart = useMutation({
    mutationFn: async (item) => 
      supabase.from('cart_items').insert(item),
    onSuccess: () => queryClient.invalidateQueries(['cart']),
  });
  
  return { cartItems, addToCart, removeFromCart, updateQuantity };
};
```

**Cart Features:**
- ✅ Persistent cart (stored in database)
- ✅ Real-time cart count badge
- ✅ Mini cart preview (hover/click)
- ✅ Stock validation before adding
- ✅ Automatic price calculations
- ✅ Grouped by seller (one order per retailer)

### 2.4 Multi-Step Checkout Process

**Step 1: Delivery Address**
```typescript
// Address selection with Google Places autocomplete
<AddressManagement 
  onAddressSelected={(address) => setDeliveryAddress(address)}
/>
```
- Display saved addresses
- Add new address with autocomplete
- Set default address
- Geocoding for coordinates

**Step 2: Payment Method**
```typescript
// Payment method selection
<PaymentMethodStep
  onMethodSelected={(method) => setPaymentMethod(method)}
/>
```
- Saved payment methods (cards, UPI)
- Add new payment method
- COD option
- Default payment method

**Step 3: Order Review**
```typescript
// Final review before placing order
<OrderReviewStep
  items={cartItems}
  address={deliveryAddress}
  paymentMethod={paymentMethod}
  onPlaceOrder={handlePlaceOrder}
/>
```
- Review all items and quantities
- Verify delivery address
- Confirm payment method
- Display total amount
- Order notes (optional)

**Order Placement:**
```typescript
const handlePlaceOrder = async () => {
  // 1. Create order record
  const { data: order } = await supabase.from('orders').insert({
    buyer_id: user.id,
    seller_id: retailerId,
    order_type: 'customer_to_retailer',
    total_amount: calculateTotal(),
    delivery_address: address.full_address,
    delivery_latitude: address.latitude,
    delivery_longitude: address.longitude,
  });
  
  // 2. Create order items
  await supabase.from('order_items').insert(orderItems);
  
  // 3. Create payment transaction
  await supabase.from('payment_transactions').insert(transaction);
  
  // 4. Clear cart
  await supabase.from('cart_items').delete().eq('user_id', user.id);
  
  // 5. Navigate to order tracking
  navigate(`/customer/orders/${order.id}`);
};
```

### 2.5 Real-Time Order Tracking

**Tracking Components:**
- **DeliveryMap:** Google Maps with delivery route
- **DeliveryTimeline:** Status progression with timestamps
- **DeliveryPartnerCard:** Contact information

**Tracking Data:**
```typescript
const useDeliveryTracking = (orderId) => {
  // Fetch delivery tracking info
  const { data: tracking } = useQuery({
    queryKey: ['delivery-tracking', orderId],
    queryFn: () => supabase
      .from('delivery_tracking')
      .select('*, delivery_status_history(*)')
      .eq('order_id', orderId)
      .single(),
  });
  
  // Real-time subscription for updates
  useEffect(() => {
    const channel = supabase
      .channel('delivery-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'delivery_tracking',
        filter: `order_id=eq.${orderId}`,
      }, (payload) => {
        queryClient.setQueryData(['delivery-tracking', orderId], payload.new);
      })
      .subscribe();
    
    return () => supabase.removeChannel(channel);
  }, [orderId]);
  
  return { tracking };
};
```

**Status Flow:**
```
Pending → Confirmed → Packed → Picked Up → In Transit → Out for Delivery → Delivered
```

### 2.6 Product Feedback System

**Feedback Collection:**
```typescript
// After delivery, customers can rate products
const submitFeedback = async (orderItem) => {
  await supabase.from('feedback').insert({
    reviewer_id: user.id,
    reviewee_id: retailerId,
    product_id: orderItem.product_id,
    order_id: orderId,
    rating: rating, // 1-5 stars
    comment: comment,
  });
};
```

**Display:**
- Star rating (1-5)
- Written review
- Reviewer name and date
- Verified purchase badge

---

## 3. Retailer Module Implementation

### 3.1 Retailer Features Overview

| Feature | Description | Key Components |
|---------|-------------|----------------|
| **Inventory Management** | Add, edit, delete products | ProductForm, StockUpdateIndicator |
| **Product Requests** | Request products from wholesalers | WholesalerProducts, B2BOrderCard |
| **Pending Approvals** | Review wholesaler product additions | PendingProducts |
| **Order Management** | Fulfill customer orders | OrderManagement, OrderDetail |
| **Analytics Dashboard** | Sales, revenue, delivery metrics | RevenueChart, OrderStatsChart |

### 3.2 Inventory Management

**Product Addition Flow:**
```
Select Base Product → Set Price & Stock → Mark as Available → Publish
```

**Implementation:**
```typescript
const addProduct = async (productData) => {
  // Get retailer ID
  const { data: retailer } = await supabase
    .from('retailers')
    .select('id')
    .eq('user_id', user.id)
    .single();
  
  // Create retailer product
  await supabase.from('retailer_products').insert({
    retailer_id: retailer.id,
    product_id: productData.product_id,
    price: productData.price, // Retail price
    stock_quantity: productData.stock,
    is_available: true,
  });
};
```

**Stock Management:**
- Real-time stock updates
- Low stock indicators (<10 items)
- Out of stock badges
- Bulk stock adjustments
- Stock history tracking

### 3.3 B2B Ordering from Wholesalers

**Wholesaler Discovery:**
```typescript
// Find wholesalers with available products
const { data: wholesalers } = useQuery({
  queryKey: ['wholesalers'],
  queryFn: async () => 
    supabase
      .from('wholesalers')
      .select('*, wholesaler_products(count)')
      .eq('is_active', true),
});
```

**B2B Order Process:**
```
Browse Wholesaler Products → Check MOQ → Add to B2B Cart → Place Order → Wait for Approval
```

**MOQ Validation:**
```typescript
// Minimum Order Quantity enforcement
const addToB2BCart = (product, quantity) => {
  if (quantity < product.minimum_order_quantity) {
    toast.error(`Minimum order: ${product.minimum_order_quantity} units`);
    return;
  }
  // Proceed with adding to cart
};
```

**Order Approval Workflow:**
```
1. Retailer places order (status: pending)
2. Wholesaler reviews order
3. Wholesaler confirms/rejects
4. If confirmed:
   - Wholesaler stock decreases
   - Retailer stock increases
   - Products auto-added to retailer inventory
5. Notification sent to retailer
```

### 3.4 Product Approval Workflow

**Pending Products View:**
```typescript
// Products added by wholesalers requiring retailer approval
const { data: pendingProducts } = useQuery({
  queryKey: ['pending-products'],
  queryFn: async () => {
    const { data: retailer } = await getRetailer(user.id);
    
    return supabase
      .from('retailer_products')
      .select('*, products(*)')
      .eq('retailer_id', retailer.id)
      .is('is_available', null); // Pending approval
  },
});
```

**Approval Actions:**
- ✅ Approve: Set `is_available = true`, set retail price
- ❌ Reject: Delete product entry
- 📝 Edit: Modify price before approval

### 3.5 Order Fulfillment

**Order Management Dashboard:**
```typescript
// Retailer views incoming customer orders
const { data: orders } = useQuery({
  queryKey: ['retailer-orders'],
  queryFn: async () => {
    const { data: retailer } = await getRetailer(user.id);
    
    return supabase
      .from('orders')
      .select('*, order_items(*, products(*)), profiles(*)')
      .eq('seller_id', user.id)
      .eq('order_type', 'customer_to_retailer')
      .order('created_at', { ascending: false });
  },
});
```

**Order Processing Steps:**
```
Pending → Confirm Order → Update Status (Packed) → Assign Delivery → Track Progress
```

**Status Updates:**
```typescript
const updateOrderStatus = async (orderId, newStatus) => {
  // Update order status
  await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId);
  
  // If status is 'confirmed', trigger stock deduction
  // (handled by database trigger)
  
  // Create notification
  await supabase.from('notifications').insert({
    user_id: order.buyer_id,
    type: `order_${newStatus}`,
    title: `Order ${newStatus}`,
    message: `Your order #${order.order_number} is ${newStatus}`,
    related_order_id: orderId,
  });
};
```

### 3.6 Analytics Dashboard

**Metrics Displayed:**

| Metric | Visualization | Data Source |
|--------|--------------|-------------|
| **Revenue Over Time** | Line chart | `payment_transactions` (completed) |
| **Order Statistics** | Bar chart | `orders` grouped by status |
| **Category Sales** | Pie chart | `order_items` joined with `products` |
| **Delivery Performance** | Timeline | `delivery_status_history` |

**Revenue Analytics:**
```typescript
const useRevenueAnalytics = (timeRange) => {
  return useQuery({
    queryKey: ['revenue', timeRange],
    queryFn: async () => {
      const { data: retailer } = await getRetailer(user.id);
      
      return supabase
        .from('payment_transactions')
        .select('amount, completed_at, orders!inner(seller_id)')
        .eq('status', 'completed')
        .eq('orders.seller_id', user.id)
        .gte('completed_at', timeRange.start)
        .lte('completed_at', timeRange.end);
    },
  });
};
```

---

## 4. Wholesaler Module Implementation

### 4.1 Wholesaler Features Overview

| Feature | Description | Key Components |
|---------|-------------|----------------|
| **Bulk Product Management** | Manage wholesale catalog with MOQ | ProductForm, MOQSettings |
| **B2B Order Processing** | Review and approve retailer orders | B2BOrderCard, OrderApproval |
| **Retailer Network** | View retailers ordering from you | RetailerList, RetailerDetails |
| **Stock Management** | Track bulk inventory levels | StockManagement |
| **Business Analytics** | B2B sales and order trends | Dashboard charts |

### 4.2 Bulk Product Management

**Wholesaler Product Creation:**
```typescript
const addWholesalerProduct = async (productData) => {
  const { data: wholesaler } = await supabase
    .from('wholesalers')
    .select('id')
    .eq('user_id', user.id)
    .single();
  
  await supabase.from('wholesaler_products').insert({
    wholesaler_id: wholesaler.id,
    product_id: productData.product_id,
    price: productData.wholesale_price,
    stock_quantity: productData.bulk_stock,
    minimum_order_quantity: productData.moq, // MOQ
    is_available: true,
  });
};
```

**MOQ Configuration:**
- Set minimum order quantity per product
- Prevents retailers from ordering below threshold
- Configurable during product creation/editing
- Displayed prominently on product cards

### 4.3 B2B Order Processing

**Order Review Dashboard:**
```typescript
const { data: b2bOrders } = useB2BOrders();

// Query implementation
const useB2BOrders = () => {
  return useQuery({
    queryKey: ['b2b-orders'],
    queryFn: async () => {
      return supabase
        .from('orders')
        .select(`
          *,
          order_items(*, products(*)),
          profiles!orders_buyer_id_fkey(full_name),
          retailers!inner(business_name)
        `)
        .eq('seller_id', user.id)
        .eq('order_type', 'retailer_to_wholesaler')
        .order('created_at', { ascending: false });
    },
  });
};
```

**Order Approval Process:**
```typescript
const approveB2BOrder = async (orderId) => {
  // 1. Check stock availability
  const orderItems = await getOrderItems(orderId);
  for (const item of orderItems) {
    const stock = await checkWholesalerStock(item.product_id);
    if (stock < item.quantity) {
      throw new Error('Insufficient stock');
    }
  }
  
  // 2. Update order status to 'confirmed'
  await supabase
    .from('orders')
    .update({ status: 'confirmed' })
    .eq('id', orderId);
  
  // Database trigger handles:
  // - Decreasing wholesaler stock
  // - Adding/updating retailer inventory
  // - Creating notification for retailer
};
```

**Rejection Handling:**
```typescript
const rejectB2BOrder = async (orderId, reason) => {
  await supabase
    .from('orders')
    .update({ 
      status: 'cancelled',
      notes: reason,
    })
    .eq('id', orderId);
  
  // Notify retailer
  await createNotification({
    type: 'order_cancelled',
    message: `Order rejected: ${reason}`,
  });
};
```

### 4.4 Automated Stock Management

**Stock Deduction Trigger:**
```sql
-- Triggered when B2B order is confirmed
CREATE TRIGGER on_b2b_order_confirmed
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed' AND OLD.status = 'pending')
  EXECUTE FUNCTION handle_b2b_order_confirmation();
```

**Function Logic:**
```sql
1. Get wholesaler_id and retailer_id
2. For each order item:
   - Check wholesaler stock
   - Decrease wholesaler stock
   - Check if retailer has product
   - If yes: increase retailer stock
   - If no: create new retailer_product (with 20% markup)
3. Create notification for retailer
```

### 4.5 Retailer Network Management

**Retailer Overview:**
```typescript
// View retailers who have ordered from you
const { data: retailers } = useQuery({
  queryKey: ['my-retailers'],
  queryFn: async () => {
    return supabase
      .from('orders')
      .select(`
        retailers!inner(id, business_name, business_address),
        profiles!inner(full_name, phone)
      `)
      .eq('seller_id', user.id)
      .eq('order_type', 'retailer_to_wholesaler')
      .eq('status', 'confirmed');
  },
});
```

**Retailer Insights:**
- Total orders placed
- Total revenue generated
- Order frequency
- Top purchased products
- Contact information

### 4.6 Business Analytics

**B2B Metrics:**
```typescript
// Total B2B sales
const { data: totalSales } = useQuery({
  queryKey: ['b2b-total-sales'],
  queryFn: async () => {
    const result = await supabase
      .from('orders')
      .select('total_amount')
      .eq('seller_id', user.id)
      .eq('order_type', 'retailer_to_wholesaler')
      .eq('status', 'confirmed');
    
    return result.data.reduce((sum, order) => sum + order.total_amount, 0);
  },
});
```

**Analytics Dashboards:**
- Revenue trends (daily, weekly, monthly)
- Top-selling products
- Order volume by retailer
- Product category distribution
- Stock turnover rates

---

## 5. Real-Time Features & Notifications

### 5.1 Notification System Architecture

**Notification Types:**
```typescript
type NotificationType = 
  | 'order_placed'
  | 'payment_success'
  | 'payment_failed'
  | 'order_confirmed'
  | 'order_packed'
  | 'order_shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'order_cancelled';
```

**Notification Creation:**
```typescript
// Automated notifications via database triggers
CREATE TRIGGER on_order_status_change
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION create_order_notification();
```

### 5.2 Real-Time Notification Delivery

**Implementation:**
```typescript
const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  
  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, []);
  
  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
        toast.info(payload.new.message); // Show toast
      })
      .subscribe();
    
    return () => supabase.removeChannel(channel);
  }, [user.id]);
  
  return { notifications };
};
```

**UI Components:**
- **NotificationBell:** Badge with unread count
- **NotificationsList:** Dropdown with recent notifications
- Mark as read functionality
- Click to navigate to related order/transaction

### 5.3 Automated Delivery Progress Simulation

**Edge Function Implementation:**
```typescript
// supabase/functions/simulate-delivery-progress/index.ts
Deno.serve(async (req) => {
  // Get orders in transit
  const { data: activeDeliveries } = await supabase
    .from('delivery_tracking')
    .select('*')
    .in('current_status', ['picked_up', 'in_transit', 'out_for_delivery']);
  
  // Update each delivery
  for (const delivery of activeDeliveries) {
    const nextStatus = getNextStatus(delivery.current_status);
    
    await supabase
      .from('delivery_tracking')
      .update({
        current_status: nextStatus,
        current_latitude: simulateMovement(delivery).lat,
        current_longitude: simulateMovement(delivery).lng,
      })
      .eq('id', delivery.id);
    
    // Status history automatically created by trigger
  }
  
  return new Response('Success', { status: 200 });
});
```

**Cron Job Schedule:**
```sql
-- Run every 5 minutes
SELECT cron.schedule(
  'simulate-delivery-progress',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url:='https://dvfknfniksvgmwmtrecv.supabase.co/functions/v1/simulate-delivery-progress',
    headers:='{"Authorization": "Bearer [ANON_KEY]"}'::jsonb
  );
  $$
);
```

### 5.4 Real-Time Stock Updates

**Stock Update Indicator:**
```typescript
// Component shows when stock changes
const StockUpdateIndicator = ({ productId }) => {
  const [stockChange, setStockChange] = useState(null);
  
  useEffect(() => {
    const channel = supabase
      .channel('stock-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'retailer_products',
        filter: `product_id=eq.${productId}`,
      }, (payload) => {
        const oldStock = payload.old.stock_quantity;
        const newStock = payload.new.stock_quantity;
        
        if (oldStock !== newStock) {
          setStockChange(newStock - oldStock);
          // Show indicator for 3 seconds
          setTimeout(() => setStockChange(null), 3000);
        }
      })
      .subscribe();
    
    return () => supabase.removeChannel(channel);
  }, [productId]);
  
  return stockChange && (
    <Badge variant={stockChange > 0 ? 'success' : 'warning'}>
      {stockChange > 0 ? '+' : ''}{stockChange}
    </Badge>
  );
};
```

### 5.5 Order Status Real-Time Updates

**Customer Order Tracking:**
```typescript
// Real-time order status updates
useEffect(() => {
  const channel = supabase
    .channel('order-updates')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'orders',
      filter: `id=eq.${orderId}`,
    }, (payload) => {
      setOrder(payload.new);
      
      // Show toast notification
      toast.success(`Order status: ${payload.new.status}`);
    })
    .subscribe();
  
  return () => supabase.removeChannel(channel);
}, [orderId]);
```

### 5.6 Real-Time Features Summary

| Feature | Update Frequency | Technology | User Benefit |
|---------|-----------------|------------|--------------|
| **Notifications** | Instant | Postgres Changes | Immediate awareness |
| **Delivery Tracking** | Every 5 minutes | Cron + Edge Function | Live location updates |
| **Stock Updates** | Instant | Postgres Changes | Accurate availability |
| **Order Status** | Instant | Postgres Changes | Order transparency |
| **Cart Sync** | Instant | Database updates | Multi-device consistency |

---

## Summary

Part 2 detailed the implementation of core features across all user modules. The platform leverages React Query for efficient data fetching, Supabase real-time subscriptions for live updates, and well-structured database triggers for automated workflows. Each module is designed with security, performance, and user experience in mind.

**Next:** Part 3 will cover innovation aspects, technical depth, testing procedures, challenges faced, and future enhancements.

---

*End of Part 2*
