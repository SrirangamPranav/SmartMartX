import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useCategorySalesAnalytics = (userId: string) => {
  return useQuery({
    queryKey: ["category-sales", userId],
    queryFn: async () => {
      // Get all confirmed B2B orders for this wholesaler
      const { data, error } = await supabase
        .from("order_items")
        .select(`
          quantity,
          products (
            category
          ),
          orders!inner (
            seller_id,
            order_type,
            status
          )
        `)
        .eq("orders.seller_id", userId)
        .eq("orders.order_type", "retailer_to_wholesaler")
        .in("orders.status", ["confirmed", "processing", "shipped", "delivered"]);

      if (error) throw error;

      // Group by category and sum quantities
      const categoryMap = new Map<string, number>();
      data.forEach((item: any) => {
        const category = item.products?.category || "other";
        const current = categoryMap.get(category) || 0;
        categoryMap.set(category, current + item.quantity);
      });

      // Convert to array format for chart
      return Array.from(categoryMap.entries())
        .map(([category, quantity]) => ({
          category: category.charAt(0).toUpperCase() + category.slice(1),
          quantity,
        }))
        .sort((a, b) => b.quantity - a.quantity);
    },
    enabled: !!userId,
  });
};
