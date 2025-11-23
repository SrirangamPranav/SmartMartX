import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { toast } from "sonner";

export interface DeliveryStatus {
  id: string;
  status: string;
  timestamp: string;
  location?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
}

export interface DeliveryTracking {
  id: string;
  order_id: string;
  tracking_number: string;
  current_status: string;
  delivery_partner_name: string;
  delivery_partner_phone: string;
  estimated_delivery_time: string;
  actual_delivery_time?: string;
  current_latitude?: number;
  current_longitude?: number;
  delivery_notes?: string;
  order: {
    order_number: string;
    total_amount: number;
    delivery_address: string;
    created_at: string;
    status: string;
  };
  status_history: DeliveryStatus[];
}

export const useDeliveryTracking = (orderId: string) => {
  const { data: tracking, isLoading, refetch } = useQuery({
    queryKey: ["delivery-tracking", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_tracking")
        .select(`
          *,
          order:orders!inner(
            order_number,
            total_amount,
            delivery_address,
            created_at,
            status
          )
        `)
        .eq("order_id", orderId)
        .single();

      if (error) throw error;

      // Fetch status history
      const { data: history, error: historyError } = await supabase
        .from("delivery_status_history")
        .select("*")
        .eq("delivery_tracking_id", data.id)
        .order("timestamp", { ascending: false });

      if (historyError) throw historyError;

      return {
        ...data,
        status_history: history || [],
      } as DeliveryTracking;
    },
    enabled: !!orderId,
  });

  // Real-time subscription for status updates
  useEffect(() => {
    if (!orderId) return;

    const channel = supabase
      .channel(`delivery-tracking-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "delivery_tracking",
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          console.log("Delivery tracking updated:", payload);
          refetch();
          
          if (payload.eventType === "UPDATE") {
            const newStatus = (payload.new as any).current_status;
            toast.success(`Delivery status updated to: ${newStatus.replace(/_/g, ' ')}`);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "delivery_status_history",
        },
        () => {
          console.log("New status history entry");
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, refetch]);

  return {
    tracking,
    isLoading,
    refetch,
  };
};

export const useOrders = () => {
  const { data: orders, isLoading } = useQuery({
    queryKey: ["customer-orders"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          seller:profiles!orders_seller_id_fkey(full_name),
          delivery_tracking(id, tracking_number, current_status),
          order_items(
            id,
            quantity,
            products(name, image_url)
          )
        `)
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Transform delivery_tracking from object to array for consistency
      return data?.map(order => ({
        ...order,
        delivery_tracking: order.delivery_tracking ? [order.delivery_tracking] : []
      }));
    },
  });

  return {
    orders,
    isLoading,
  };
};
