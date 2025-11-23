# Delivery Automation System

## Overview
The delivery automation system simulates real-world delivery progress using an Edge Function that runs on a scheduled cron job.

## Components

### 1. Edge Function: `simulate-delivery-progress`
- **Location**: `supabase/functions/simulate-delivery-progress/`
- **Purpose**: Automatically progresses delivery statuses based on time elapsed
- **Access**: Public endpoint (JWT verification disabled for cron access)

### 2. Status Progression Flow
Orders automatically progress through these statuses:

1. **pending** → (5 minutes) → **confirmed**
2. **confirmed** → (15 minutes) → **packed**
3. **packed** → (30 minutes) → **picked_up**
4. **picked_up** → (1 hour) → **in_transit**
5. **in_transit** → (3 hours) → **out_for_delivery**
6. **out_for_delivery** → (1 hour) → **delivered**

### 3. Automated Actions

#### When Order is Confirmed:
- Creates delivery tracking record
- Generates tracking number (format: `TRK{timestamp}{random}`)
- Assigns delivery partner (Express Delivery)
- Sets estimated delivery time (24 hours from confirmation)
- Sends notification to customer

#### On Status Update:
- Updates delivery tracking status
- Creates status history entry
- Updates order status (when delivered)
- Sends push notification to customer
- Real-time updates via Supabase subscriptions

### 4. Cron Schedule
- **Frequency**: Every 5 minutes
- **Job Name**: `simulate-delivery-progress`
- **Enabled**: Yes

## Testing the System

### Manual Testing
You can manually trigger the delivery simulation:

```bash
curl -X POST https://dvfknfniksvgmwmtrecv.supabase.co/functions/v1/simulate-delivery-progress \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Test Flow
1. Place an order through the checkout process
2. Order status changes to "confirmed"
3. Wait 5 minutes for the cron job to run
4. Delivery tracking is automatically created
5. Status progresses through the flow based on time delays
6. Real-time updates appear in the tracking UI
7. Notifications are sent at each status change

## Monitoring

### Check Cron Job Status
```sql
SELECT * FROM cron.job WHERE jobname = 'simulate-delivery-progress';
```

### View Cron Job Runs
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'simulate-delivery-progress')
ORDER BY start_time DESC 
LIMIT 10;
```

### Check Edge Function Logs
View logs in Supabase Dashboard:
- Navigate to Edge Functions
- Select `simulate-delivery-progress`
- View Logs tab

## Configuration

### Adjust Status Delays
Edit the `STATUS_DELAYS` object in the Edge Function:

```typescript
const STATUS_DELAYS = {
  pending: 5,        // minutes
  confirmed: 15,
  packed: 30,
  picked_up: 60,
  in_transit: 180,
  out_for_delivery: 60,
};
```

### Change Cron Schedule
Update the cron schedule in the database:

```sql
SELECT cron.unschedule('simulate-delivery-progress');

SELECT cron.schedule(
  'simulate-delivery-progress',
  '*/10 * * * *', -- Run every 10 minutes instead
  $$ ... $$
);
```

## Notifications

The system creates notifications for these events:
- `order_confirmed` - Order confirmed and tracking started
- `order_packed` - Order has been packed
- `order_shipped` - Order picked up by delivery partner
- `out_for_delivery` - Order is out for delivery
- `delivered` - Order has been delivered

Users receive real-time toast notifications when viewing the app.

## Security

- Edge function has JWT verification disabled to allow cron job access
- Uses service role key for database operations
- All database operations respect RLS policies
- Notifications only sent to order owners

## Troubleshooting

### Deliveries Not Progressing
1. Check if cron job is running: View `cron.job_run_details`
2. Check Edge Function logs for errors
3. Verify extensions are enabled: `pg_cron` and `pg_net`
4. Ensure delivery tracking records exist for orders

### Missing Notifications
1. Check if notifications table has entries
2. Verify user_id matches order buyer_id
3. Check RLS policies on notifications table

### Manual Status Update (for testing)
```sql
UPDATE delivery_tracking 
SET current_status = 'out_for_delivery' 
WHERE tracking_number = 'TRK...';
```
