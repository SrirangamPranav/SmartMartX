# API Reference

## Overview

SmartMartX uses a combination of Supabase's auto-generated REST API and custom Edge Functions for backend functionality. This document covers both types of APIs.

## Base URLs

- **Supabase REST API**: `https://dvfknfniksvgmwmtrecv.supabase.co/rest/v1`
- **Edge Functions**: `https://dvfknfniksvgmwmtrecv.supabase.co/functions/v1`

## Authentication

All API requests require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <JWT_TOKEN>
```

The JWT token is automatically managed by the Supabase client library.

## Edge Functions

### 1. check-auth-provider

**Purpose**: Determines the authentication provider for a given email address.

**Endpoint**: `POST /functions/v1/check-auth-provider`

**Use Case**: Before login, check if user should use email/password or social login.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "auth_provider": "email" | "google" | "facebook"
}
```

**Example Usage:**
```typescript
const { data, error } = await supabase.functions.invoke('check-auth-provider', {
  body: { email: 'user@example.com' }
});

if (data.auth_provider === 'google') {
  // Show "Sign in with Google" button
} else {
  // Show email/password form
}
```

**Error Responses:**
- `400`: Email is required
- `500`: Server error

---

### 2. simulate-delivery-progress

**Purpose**: Automated delivery status progression for demo/testing purposes.

**Endpoint**: Invoked automatically by cron job (no direct HTTP access needed)

**Schedule**: Every 1 minute (demo mode)

**Functionality:**
1. Finds confirmed orders without delivery tracking
2. Creates delivery tracking records
3. Progresses delivery status based on time delays
4. Updates order status when delivered
5. Creates notifications for status changes

**Status Progression Logic:**
```
Status          → Next Status        | Delay
------------------------------------------------
pending         → confirmed          | 0.5 min
confirmed       → packed             | 1 min
packed          → picked_up          | 1 min
picked_up       → in_transit         | 2 min
in_transit      → out_for_delivery   | 2 min
out_for_delivery → delivered         | 3 min
```

**Automatic Actions:**
- Creates `delivery_tracking` record on order confirmation
- Updates `current_status` every minute if delay passed
- Logs each status change in `delivery_status_history`
- Sends notification to customer on status change
- Updates order status to 'delivered' when complete

**Sample Delivery Partner Data:**
```typescript
{
  delivery_partner_name: "FastEx Logistics",
  delivery_partner_phone: "+91-9876543210",
  tracking_number: "TRK" + random(6),
  estimated_delivery_time: now() + 10 minutes
}
```

**Manual Testing:**
```bash
curl -X POST \
  https://dvfknfniksvgmwmtrecv.supabase.co/functions/v1/simulate-delivery-progress \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Cron Configuration:**
```sql
-- Runs every 1 minute
SELECT cron.schedule(
  'simulate-delivery-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url:='https://dvfknfniksvgmwmtrecv.supabase.co/functions/v1/simulate-delivery-progress',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer <ANON_KEY>"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
```

---

## Supabase Client API

### Authentication

#### Sign Up with Email
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: {
    data: {
      full_name: 'John Doe'
    }
  }
});
```

#### Sign In with Email
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});
```

#### Sign In with Google
```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/onboarding`
  }
});
```

#### Sign Out
```typescript
const { error } = await supabase.auth.signOut();
```

#### Get Current Session
```typescript
const { data: { session }, error } = await supabase.auth.getSession();
```

---

### Database Operations

All database operations use the Supabase client with automatic RLS enforcement.

#### Products

**Fetch All Products**
```typescript
const { data, error } = await supabase
  .from('products')
  .select('*')
  .order('created_at', { ascending: false });
```

**Fetch Products by Category**
```typescript
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('category', 'electronics');
```

**Create Product**
```typescript
const { data, error } = await supabase
  .from('products')
  .insert({
    name: 'iPhone 15',
    description: 'Latest Apple smartphone',
    category: 'electronics',
    base_price: 79999,
    image_url: 'https://...'
  })
  .select()
  .single();
```

#### Retailer Products

**Fetch Retailer's Products**
```typescript
const { data, error } = await supabase
  .from('retailer_products')
  .select(`
    *,
    product:products(*),
    retailer:retailers(*)
  `)
  .eq('retailer_id', retailerId)
  .eq('is_available', true);
```

**Update Stock**
```typescript
const { error } = await supabase
  .from('retailer_products')
  .update({ stock_quantity: newQuantity })
  .eq('id', productId);
```

**Create Retailer Product**
```typescript
const { data, error } = await supabase
  .from('retailer_products')
  .insert({
    retailer_id: retailerId,
    product_id: productId,
    price: 89999,
    stock_quantity: 50,
    is_available: true
  });
```

#### Cart Operations

**Add to Cart**
```typescript
const { data, error } = await supabase
  .from('cart_items')
  .upsert({
    user_id: userId,
    seller_id: sellerId,
    product_id: productId,
    quantity: 2
  }, {
    onConflict: 'user_id,product_id,seller_id'
  });
```

**Fetch Cart Items**
```typescript
const { data, error } = await supabase
  .from('cart_items')
  .select(`
    *,
    product:products(*),
    seller:profiles(*)
  `)
  .eq('user_id', userId);
```

**Remove from Cart**
```typescript
const { error } = await supabase
  .from('cart_items')
  .delete()
  .eq('id', cartItemId);
```

**Clear Cart**
```typescript
const { error } = await supabase
  .from('cart_items')
  .delete()
  .eq('user_id', userId);
```

#### Order Management

**Create Order**
```typescript
// 1. Create order
const { data: order, error: orderError } = await supabase
  .from('orders')
  .insert({
    buyer_id: userId,
    seller_id: sellerId,
    order_type: 'customer_to_retailer',
    total_amount: 1500,
    delivery_address: '123 Main St, City',
    delivery_latitude: 28.6139,
    delivery_longitude: 77.2090,
    notes: 'Please call on arrival'
  })
  .select()
  .single();

// 2. Add order items
const { error: itemsError } = await supabase
  .from('order_items')
  .insert([
    {
      order_id: order.id,
      product_id: product1Id,
      quantity: 2,
      unit_price: 500,
      subtotal: 1000
    },
    {
      order_id: order.id,
      product_id: product2Id,
      quantity: 1,
      unit_price: 500,
      subtotal: 500
    }
  ]);
```

**Fetch Orders (Buyer)**
```typescript
const { data, error } = await supabase
  .from('orders')
  .select(`
    *,
    seller:profiles!seller_id(*),
    order_items(
      *,
      product:products(*)
    )
  `)
  .eq('buyer_id', userId)
  .order('created_at', { ascending: false });
```

**Fetch Orders (Seller)**
```typescript
const { data, error } = await supabase
  .from('orders')
  .select(`
    *,
    buyer:profiles!buyer_id(*),
    order_items(
      *,
      product:products(*)
    )
  `)
  .eq('seller_id', userId)
  .order('created_at', { ascending: false });
```

**Update Order Status**
```typescript
const { error } = await supabase
  .from('orders')
  .update({ status: 'confirmed' })
  .eq('id', orderId);
```

**B2B Order (Retailer to Wholesaler)**
```typescript
const { data, error } = await supabase
  .from('orders')
  .insert({
    buyer_id: retailerUserId,
    seller_id: wholesalerUserId,
    order_type: 'retailer_to_wholesaler',
    total_amount: 50000,
    delivery_address: 'Retailer Business Address',
    notes: 'Bulk order for restocking'
  })
  .select()
  .single();
```

#### Delivery Tracking

**Fetch Delivery Tracking**
```typescript
const { data, error } = await supabase
  .from('delivery_tracking')
  .select(`
    *,
    order:orders(*),
    delivery_status_history(*)
  `)
  .eq('order_id', orderId)
  .single();
```

**Fetch Status History**
```typescript
const { data, error } = await supabase
  .from('delivery_status_history')
  .select('*')
  .eq('delivery_tracking_id', trackingId)
  .order('timestamp', { ascending: true });
```

#### Notifications

**Fetch Notifications**
```typescript
const { data, error } = await supabase
  .from('notifications')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(50);
```

**Mark as Read**
```typescript
const { error } = await supabase
  .from('notifications')
  .update({ is_read: true })
  .eq('id', notificationId);
```

**Mark All as Read**
```typescript
const { error } = await supabase
  .from('notifications')
  .update({ is_read: true })
  .eq('user_id', userId)
  .eq('is_read', false);
```

**Real-Time Subscription**
```typescript
const subscription = supabase
  .channel('notifications')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      // Show toast notification
      toast.info(payload.new.title, {
        description: payload.new.message
      });
    }
  )
  .subscribe();

// Cleanup
subscription.unsubscribe();
```

#### Feedback

**Submit Feedback**
```typescript
const { error } = await supabase
  .from('feedback')
  .insert({
    order_id: orderId,
    reviewer_id: userId,
    reviewee_id: sellerId,
    product_id: productId,
    rating: 5,
    comment: 'Excellent product and service!'
  });
```

**Fetch Product Feedback**
```typescript
const { data, error } = await supabase
  .from('feedback')
  .select(`
    *,
    reviewer:profiles!reviewer_id(full_name, avatar_url)
  `)
  .eq('product_id', productId)
  .order('created_at', { ascending: false });
```

#### Analytics

**Order Statistics**
```typescript
const { data, error } = await supabase
  .from('orders')
  .select('status, created_at, total_amount')
  .eq('seller_id', sellerId)
  .gte('created_at', startDate)
  .lte('created_at', endDate);
```

**Revenue by Date**
```typescript
const { data, error } = await supabase
  .from('orders')
  .select('created_at, total_amount')
  .eq('seller_id', sellerId)
  .eq('status', 'delivered')
  .gte('created_at', startDate);
```

**Category Sales**
```typescript
const { data, error } = await supabase
  .from('order_items')
  .select(`
    quantity,
    subtotal,
    product:products(category)
  `)
  .eq('order_id', 'in.(SELECT id FROM orders WHERE seller_id = ...)')
```

---

## Error Handling

### Common Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| 401 | Unauthorized | Check authentication token |
| 403 | Forbidden | User lacks permissions (RLS) |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate entry (unique constraint) |
| 422 | Validation Error | Check request payload |
| 500 | Server Error | Check logs, retry request |

### Error Response Format
```json
{
  "error": {
    "message": "Error description",
    "details": "Additional details",
    "hint": "Suggestion to fix",
    "code": "PGRST116"
  }
}
```

### Handling Errors
```typescript
const { data, error } = await supabase
  .from('products')
  .select('*');

if (error) {
  console.error('Error:', error.message);
  console.error('Details:', error.details);
  console.error('Hint:', error.hint);
  
  // Show user-friendly message
  toast.error('Failed to load products. Please try again.');
}
```

---

## Rate Limiting

Supabase imposes rate limits:
- **Anonymous requests**: 60/minute
- **Authenticated requests**: 600/minute

For production, consider:
- Implementing request caching
- Using React Query's caching strategy
- Debouncing search inputs

---

## Best Practices

### 1. Use Select Queries Efficiently
```typescript
// ❌ Bad: Fetches all columns
const { data } = await supabase.from('orders').select('*');

// ✅ Good: Fetch only needed columns
const { data } = await supabase
  .from('orders')
  .select('id, order_number, status, total_amount');
```

### 2. Use Relationships
```typescript
// ✅ Fetch related data in one query
const { data } = await supabase
  .from('orders')
  .select(`
    *,
    buyer:profiles!buyer_id(full_name, phone),
    order_items(
      quantity,
      product:products(name, image_url)
    )
  `);
```

### 3. Handle Loading States
```typescript
const { data, error, isLoading } = useQuery({
  queryKey: ['products'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*');
    if (error) throw error;
    return data;
  }
});

if (isLoading) return <Loading />;
if (error) return <Error message={error.message} />;
return <ProductList products={data} />;
```

### 4. Use Optimistic Updates
```typescript
const mutation = useMutation({
  mutationFn: async (newStatus) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);
    if (error) throw error;
  },
  onMutate: async (newStatus) => {
    // Optimistically update UI
    queryClient.setQueryData(['order', orderId], (old) => ({
      ...old,
      status: newStatus
    }));
  },
  onError: () => {
    // Revert on error
    queryClient.invalidateQueries(['order', orderId]);
  }
});
```

### 5. Implement Pagination
```typescript
const PAGE_SIZE = 20;

const { data, error } = await supabase
  .from('products')
  .select('*')
  .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
```

---

## Testing APIs

### Using Postman

**Base Configuration:**
```
URL: https://dvfknfniksvgmwmtrecv.supabase.co/rest/v1/products
Method: GET
Headers:
  apikey: YOUR_ANON_KEY
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json
```

### Using cURL

**Fetch Products:**
```bash
curl -X GET \
  'https://dvfknfniksvgmwmtrecv.supabase.co/rest/v1/products?select=*' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Create Order:**
```bash
curl -X POST \
  'https://dvfknfniksvgmwmtrecv.supabase.co/rest/v1/orders' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "buyer_id": "uuid",
    "seller_id": "uuid",
    "order_type": "customer_to_retailer",
    "total_amount": 1500,
    "delivery_address": "123 Main St"
  }'
```

---

## Monitoring & Debugging

### View Edge Function Logs
1. Go to Supabase Dashboard
2. Navigate to Edge Functions
3. Click on function name
4. View logs tab

### View Database Logs
1. Go to Supabase Dashboard
2. Navigate to Database → Logs
3. Filter by severity and time range

### Query Performance
```sql
-- Analyze query performance
EXPLAIN ANALYZE
SELECT * FROM orders WHERE buyer_id = 'uuid';
```

---

## Security Considerations

### Never Expose Service Role Key
```typescript
// ❌ NEVER do this in frontend
const supabase = createClient(URL, SERVICE_ROLE_KEY);

// ✅ Always use anon key in frontend
const supabase = createClient(URL, ANON_KEY);
```

### Validate Input
```typescript
const orderSchema = z.object({
  total_amount: z.number().positive(),
  delivery_address: z.string().min(10),
  notes: z.string().optional()
});

const validatedData = orderSchema.parse(formData);
```

### Use RLS Policies
All tables have RLS enabled. Users can only access their own data automatically.

---

## API Limits

| Resource | Limit |
|----------|-------|
| Request size | 2MB |
| Response size | 10MB |
| Query timeout | 3 seconds |
| Edge function timeout | 150 seconds |

For larger datasets, implement pagination and streaming responses.
