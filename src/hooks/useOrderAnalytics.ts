import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export interface OrderStats {
  total: number;
  pending: number;
  confirmed: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
}

export interface MonthlyOrderData {
  month: string;
  orders: number;
  revenue: number;
}

export const useOrderAnalytics = (userId: string, role: "retailer" | "wholesaler" | "customer") => {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["order-stats", userId, role],
    queryFn: async () => {
      const roleField = role === "customer" ? "buyer_id" : "seller_id";
      
      const { data, error } = await supabase
        .from("orders")
        .select("status")
        .eq(roleField, userId);

      if (error) throw error;

      const stats: OrderStats = {
        total: data.length,
        pending: 0,
        confirmed: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
      };

      data.forEach((order) => {
        stats[order.status as keyof Omit<OrderStats, "total">]++;
      });

      return stats;
    },
    enabled: !!userId,
  });

  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ["monthly-orders", userId, role],
    queryFn: async () => {
      const roleField = role === "customer" ? "buyer_id" : "seller_id";
      const months: MonthlyOrderData[] = [];

      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const start = startOfMonth(date);
        const end = endOfMonth(date);

        const { data, error } = await supabase
          .from("orders")
          .select("total_amount")
          .eq(roleField, userId)
          .gte("created_at", start.toISOString())
          .lte("created_at", end.toISOString());

        if (error) throw error;

        months.push({
          month: format(date, "MMM"),
          orders: data.length,
          revenue: data.reduce((sum, order) => sum + Number(order.total_amount), 0),
        });
      }

      return months;
    },
    enabled: !!userId,
  });

  return {
    stats,
    monthlyData,
    isLoading: statsLoading || monthlyLoading,
  };
};
