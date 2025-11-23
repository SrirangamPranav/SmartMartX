import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DeliveryStats {
  pending: number;
  confirmed: number;
  packed: number;
  picked_up: number;
  in_transit: number;
  out_for_delivery: number;
  delivered: number;
  cancelled: number;
}

export const useDeliveryAnalytics = (userId: string, role: "retailer" | "wholesaler" | "customer") => {
  return useQuery({
    queryKey: ["delivery-analytics", userId, role],
    queryFn: async () => {
      const roleField = role === "customer" ? "buyer_id" : "seller_id";

      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          delivery_tracking (
            current_status
          )
        `)
        .eq(roleField, userId);

      if (error) throw error;

      const stats: DeliveryStats = {
        pending: 0,
        confirmed: 0,
        packed: 0,
        picked_up: 0,
        in_transit: 0,
        out_for_delivery: 0,
        delivered: 0,
        cancelled: 0,
      };

      data.forEach((order: any) => {
        if (order.delivery_tracking) {
          const status = order.delivery_tracking.current_status;
          stats[status as keyof DeliveryStats]++;
        }
      });

      return stats;
    },
    enabled: !!userId,
  });
};
