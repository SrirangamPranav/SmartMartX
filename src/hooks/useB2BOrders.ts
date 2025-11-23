import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useB2BOrders = (userId: string, role: "retailer" | "wholesaler") => {
  return useQuery({
    queryKey: ["b2b-orders", userId, role],
    queryFn: async () => {
      let query = supabase
        .from("orders")
        .select(`
          *,
          order_items (
            *,
            products (*)
          ),
          profiles!orders_buyer_id_fkey (
            full_name
          )
        `)
        .eq("order_type", "retailer_to_wholesaler")
        .order("created_at", { ascending: false });

      if (role === "retailer") {
        query = query.eq("buyer_id", userId);
      } else {
        query = query.eq("seller_id", userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};
