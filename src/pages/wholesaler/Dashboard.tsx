import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Package, Clock, TrendingUp, ShoppingCart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { useCategorySalesAnalytics } from "@/hooks/useCategorySalesAnalytics";
import { RevenueChart } from "@/components/analytics/RevenueChart";
import { CategorySalesChart } from "@/components/analytics/CategorySalesChart";

const WholesalerDashboard = () => {
  const { user, loading } = useRequireAuth('wholesaler');
  const navigate = useNavigate();

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

  const { data: productsCount } = useQuery({
    queryKey: ["wholesaler-products-count", wholesaler?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("wholesaler_products")
        .select("*", { count: "exact", head: true })
        .eq("wholesaler_id", wholesaler?.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!wholesaler,
  });

  // Get B2B order statistics
  const { data: b2bStats, isLoading: statsLoading } = useQuery({
    queryKey: ["b2b-stats", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("status, total_amount")
        .eq("seller_id", user?.id)
        .eq("order_type", "retailer_to_wholesaler");

      if (error) throw error;

      const stats = {
        total: data.length,
        pending: data.filter((o) => o.status === "pending").length,
        confirmed: data.filter((o) => o.status === "confirmed").length,
        revenue: data
          .filter((o) => ["confirmed", "processing", "shipped", "delivered"].includes(o.status))
          .reduce((sum, o) => sum + Number(o.total_amount), 0),
      };

      return stats;
    },
    enabled: !!user,
  });

  // Get active retailers count
  const { data: retailersCount } = useQuery({
    queryKey: ["active-retailers", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("buyer_id")
        .eq("seller_id", user?.id)
        .eq("order_type", "retailer_to_wholesaler")
        .in("status", ["confirmed", "processing", "shipped", "delivered"]);

      if (error) throw error;

      const uniqueRetailers = new Set(data.map((o) => o.buyer_id));
      return uniqueRetailers.size;
    },
    enabled: !!user,
  });

  // Get products sold count
  const { data: productsSold } = useQuery({
    queryKey: ["products-sold", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("quantity, orders!inner(seller_id, order_type, status)")
        .eq("orders.seller_id", user?.id)
        .eq("orders.order_type", "retailer_to_wholesaler")
        .in("orders.status", ["confirmed", "processing", "shipped", "delivered"]);

      if (error) throw error;

      return data.reduce((sum, item) => sum + item.quantity, 0);
    },
    enabled: !!user,
  });

  const { data: categoryData, isLoading: categoryLoading } = useCategorySalesAnalytics(user?.id || "");

  if (loading || statsLoading || categoryLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Wholesaler Dashboard</h2>
          <p className="text-muted-foreground">Manage your wholesale distribution and retail partners.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Products Sold</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{productsSold || 0}</div>
              <p className="text-xs text-muted-foreground">Total units sold</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Retailers</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{retailersCount || 0}</div>
              <p className="text-xs text-muted-foreground">Partners with orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{b2bStats?.pending || 0}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{(b2bStats?.revenue || 0).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">From confirmed orders</p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Charts */}
        <div className="mb-8">
          {categoryData && <CategorySalesChart data={categoryData} />}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your wholesale operations</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4">
            <Button className="h-20" variant="outline" onClick={() => navigate('/wholesaler/products')}>
              Manage Products
            </Button>
            <Button className="h-20" variant="outline" onClick={() => navigate('/wholesaler/orders')}>
              View Orders
            </Button>
            <Button className="h-20" variant="outline" onClick={() => navigate('/wholesaler/profile')}>
              Business Profile
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default WholesalerDashboard;
