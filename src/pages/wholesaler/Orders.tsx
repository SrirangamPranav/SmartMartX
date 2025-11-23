import { useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NavBar } from "@/components/NavBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { B2BOrderCard } from "@/components/wholesaler/B2BOrderCard";
import { Package } from "lucide-react";

const WholesalerOrders = () => {
  const { user, loading: authLoading } = useRequireAuth("wholesaler");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: wholesaler } = useQuery({
    queryKey: ["wholesaler-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wholesalers")
        .select("*")
        .eq("user_id", user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: orders, isLoading } = useQuery({
    queryKey: ["wholesaler-b2b-orders", wholesaler?.id, statusFilter],
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
        .eq("seller_id", user?.id)
        .eq("order_type", "retailer_to_wholesaler")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as any);
      }

      const { data: ordersData, error } = await query;
      if (error) throw error;

      // Fetch retailer info separately for each order
      const ordersWithRetailers = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: retailer } = await supabase
            .from("retailers")
            .select("business_name, business_address")
            .eq("user_id", order.buyer_id)
            .single();

          return { ...order, retailers: retailer };
        })
      );

      return ordersWithRetailers;
    },
    enabled: !!user && !!wholesaler,
  });

  const pendingCount = orders?.filter((o) => o.status === "pending").length || 0;
  const confirmedCount = orders?.filter((o) => o.status === "confirmed").length || 0;
  const cancelledCount = orders?.filter((o) => o.status === "cancelled").length || 0;

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-64 mb-6" />
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Product Requests</h1>
          <p className="text-muted-foreground">
            Manage product requests from retailers
          </p>
        </div>

        <Tabs defaultValue="all" value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="all">
              All ({orders?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({pendingCount})
            </TabsTrigger>
            <TabsTrigger value="confirmed">
              Approved ({confirmedCount})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Rejected ({cancelledCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={statusFilter}>
            {orders && orders.length > 0 ? (
              <div className="grid gap-6">
                {orders.map((order) => (
                  <B2BOrderCard
                    key={order.id}
                    order={order}
                    showActions={order.status === "pending"}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title={`No ${statusFilter === "all" ? "" : statusFilter} Orders`}
                description={
                  statusFilter === "pending"
                    ? "No pending product requests from retailers."
                    : statusFilter === "confirmed"
                    ? "No approved orders yet."
                    : statusFilter === "cancelled"
                    ? "No rejected orders."
                    : "No product requests yet from retailers."
                }
                icon={Package}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WholesalerOrders;
