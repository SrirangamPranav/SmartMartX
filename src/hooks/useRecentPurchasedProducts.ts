import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useRecentPurchasedProducts = () => {
  return useQuery({
    queryKey: ["recent-purchased-products"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch order items with orders and products
      const { data: orderItems, error } = await supabase
        .from("order_items")
        .select(`
          id,
          quantity,
          unit_price,
          order_id,
          product_id,
          orders!inner(
            id,
            order_number,
            created_at,
            status,
            seller_id
          ),
          products(
            id,
            name,
            description,
            image_url,
            category
          )
        `)
        .eq("orders.buyer_id", user.id)
        .neq("orders.status", "cancelled")
        .order("orders(created_at)", { ascending: false })
        .limit(6);

      if (error) throw error;
      if (!orderItems) return [];

      // Fetch all feedback for this user
      const { data: feedbackData, error: feedbackError } = await supabase
        .from("feedback")
        .select("id, rating, comment, order_id, product_id")
        .eq("reviewer_id", user.id);

      if (feedbackError) throw feedbackError;

      // Combine order items with their feedback
      const itemsWithFeedback = orderItems.map((item) => {
        const feedback = feedbackData?.find(
          (f) => f.order_id === item.order_id && f.product_id === item.product_id
        );
        return {
          ...item,
          feedback: feedback ? [feedback] : [],
        };
      });

      return itemsWithFeedback;
    },
  });
};
