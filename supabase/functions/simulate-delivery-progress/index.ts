import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Status progression order
const STATUS_PROGRESSION = [
  'pending',
  'confirmed',
  'packed',
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'delivered',
];

// Time delays in minutes for each status transition (demo mode - faster)
const STATUS_DELAYS = {
  pending: 0.5,        // 30 seconds to confirmed
  confirmed: 1,        // 1 min to packed
  packed: 1.5,         // 1.5 min to picked_up
  picked_up: 2,        // 2 min to in_transit
  in_transit: 3,       // 3 min to out_for_delivery
  out_for_delivery: 2, // 2 min to delivered
};

interface DeliveryTracking {
  id: string;
  order_id: string;
  current_status: string;
  created_at: string;
  tracking_number: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting delivery simulation process...');

    // 1. Find orders that are confirmed but don't have delivery tracking yet
    const { data: ordersWithoutTracking, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id, 
        order_number, 
        buyer_id, 
        delivery_address, 
        delivery_latitude, 
        delivery_longitude,
        delivery_tracking!left(id)
      `)
      .eq('status', 'confirmed')
      .is('delivery_tracking.id', null);

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      throw ordersError;
    }

    console.log(`Found ${ordersWithoutTracking?.length || 0} orders without tracking`);

    // Create delivery tracking for new confirmed orders
    for (const order of ordersWithoutTracking || []) {
      const trackingNumber = `TRK${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const estimatedDelivery = new Date();
      estimatedDelivery.setHours(estimatedDelivery.getHours() + 24);

      const { error: trackingError } = await supabase
        .from('delivery_tracking')
        .insert({
          order_id: order.id,
          tracking_number: trackingNumber,
          current_status: 'pending',
          delivery_partner_name: 'Express Delivery',
          delivery_partner_phone: '+91-9876543210',
          estimated_delivery_time: estimatedDelivery.toISOString(),
        });

      if (trackingError) {
        console.error(`Error creating tracking for order ${order.order_number}:`, trackingError);
      } else {
        console.log(`Created tracking ${trackingNumber} for order ${order.order_number}`);
        
        // Create notification
        await supabase.from('notifications').insert({
          user_id: order.buyer_id,
          type: 'order_confirmed',
          title: 'Order Confirmed',
          message: `Your order #${order.order_number} has been confirmed and tracking has started.`,
          related_order_id: order.id,
        });
      }
    }

    // 2. Get all active deliveries (not delivered or cancelled)
    const { data: activeDeliveries, error: deliveriesError } = await supabase
      .from('delivery_tracking')
      .select(`
        id,
        order_id,
        current_status,
        created_at,
        tracking_number,
        order:orders!delivery_tracking_order_id_fkey(
          order_number,
          buyer_id
        )
      `)
      .not('current_status', 'in', '(delivered,cancelled)');

    if (deliveriesError) {
      console.error('Error fetching deliveries:', deliveriesError);
      throw deliveriesError;
    }

    console.log(`Found ${activeDeliveries?.length || 0} active deliveries to process`);

    let updatedCount = 0;

    // 3. Process each delivery
    for (const delivery of activeDeliveries || []) {
      const currentStatusIndex = STATUS_PROGRESSION.indexOf(delivery.current_status);
      
      if (currentStatusIndex === -1 || currentStatusIndex >= STATUS_PROGRESSION.length - 1) {
        continue; // Skip if already delivered or invalid status
      }

      // Get the most recent status history for this delivery
      const { data: latestStatus, error: statusError } = await supabase
        .from('delivery_status_history')
        .select('timestamp, status')
        .eq('delivery_tracking_id', delivery.id)
        .eq('status', delivery.current_status)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (statusError && statusError.code !== 'PGRST116') {
        console.error(`Error fetching status history for ${delivery.tracking_number}:`, statusError);
        continue;
      }

      const lastStatusTime = latestStatus 
        ? new Date(latestStatus.timestamp) 
        : new Date(delivery.created_at);
      
      const now = new Date();
      const minutesSinceLastStatus = (now.getTime() - lastStatusTime.getTime()) / 1000 / 60;
      const requiredMinutes = STATUS_DELAYS[delivery.current_status as keyof typeof STATUS_DELAYS];

      console.log(`Delivery ${delivery.tracking_number}: Current status ${delivery.current_status}, ${minutesSinceLastStatus.toFixed(1)} min elapsed (needs ${requiredMinutes})`);

      // Check if enough time has passed
      if (minutesSinceLastStatus >= requiredMinutes) {
        const nextStatus = STATUS_PROGRESSION[currentStatusIndex + 1];
        
        console.log(`Updating ${delivery.tracking_number} from ${delivery.current_status} to ${nextStatus}`);

        // Update delivery tracking status
        const { error: updateError } = await supabase
          .from('delivery_tracking')
          .update({ 
            current_status: nextStatus,
            actual_delivery_time: nextStatus === 'delivered' ? now.toISOString() : null,
          })
          .eq('id', delivery.id);

        if (updateError) {
          console.error(`Error updating delivery ${delivery.tracking_number}:`, updateError);
          continue;
        }

        // Update order status if delivered
        if (nextStatus === 'delivered') {
          await supabase
            .from('orders')
            .update({ status: 'delivered' })
            .eq('id', delivery.order_id);
        }

        updatedCount++;

        // Create notification
        const notificationTypes: Record<string, string> = {
          confirmed: 'order_confirmed',
          packed: 'order_packed',
          picked_up: 'order_shipped',
          out_for_delivery: 'out_for_delivery',
          delivered: 'delivered',
        };

        const notificationMessages: Record<string, string> = {
          confirmed: 'Your order has been confirmed',
          packed: 'Your order has been packed',
          picked_up: 'Your order has been picked up',
          in_transit: 'Your order is in transit',
          out_for_delivery: 'Your order is out for delivery',
          delivered: 'Your order has been delivered',
        };

        if (notificationTypes[nextStatus]) {
          await supabase.from('notifications').insert({
            user_id: (delivery.order as any).buyer_id,
            type: notificationTypes[nextStatus],
            title: notificationMessages[nextStatus],
            message: `Order #${(delivery.order as any).order_number} - ${notificationMessages[nextStatus]}`,
            related_order_id: delivery.order_id,
          });
        }

        console.log(`✓ Successfully updated to ${nextStatus}`);
      }
    }

    console.log(`Delivery simulation complete. Updated ${updatedCount} deliveries.`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${activeDeliveries?.length || 0} deliveries, updated ${updatedCount}`,
        ordersWithoutTracking: ordersWithoutTracking?.length || 0,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in simulate-delivery-progress:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
