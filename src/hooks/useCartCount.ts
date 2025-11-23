import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useCartCount = () => {
  return useQuery({
    queryKey: ["cart-count"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cart_items")
        .select("quantity");

      if (error) throw error;
      
      const total = data?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      return total;
    },
  });
};
