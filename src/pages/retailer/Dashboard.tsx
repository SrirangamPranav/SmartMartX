import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Package, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { useOrderAnalytics } from "@/hooks/useOrderAnalytics";
import { useDeliveryAnalytics } from "@/hooks/useDeliveryAnalytics";
import { OrderStatsChart } from "@/components/analytics/OrderStatsChart";
import { RevenueChart } from "@/components/analytics/RevenueChart";
import { DeliveryPerformanceChart } from "@/components/analytics/DeliveryPerformanceChart";

const RetailerDashboard = () => {
  const { user, loading } = useRequireAuth('retailer');
  const navigate = useNavigate();

  const { data: retailer } = useQuery({
    queryKey: ["retailer-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("retailers")
        .select("*")
        .eq("user_id", user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: productsCount } = useQuery({
    queryKey: ["retailer-products-count", retailer?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("retailer_products")
        .select("*", { count: "exact", head: true })
        .eq("retailer_id", retailer?.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!retailer,
  });

  const { stats, monthlyData, isLoading: analyticsLoading } = useOrderAnalytics(
    user?.id || "",
    "retailer"
  );

  const { data: deliveryStats, isLoading: deliveryLoading } = useDeliveryAnalytics(
    user?.id || "",
    "retailer"
  );

  if (loading || analyticsLoading || deliveryLoading) {
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
          <h2 className="text-3xl font-bold mb-2">Retailer Dashboard</h2>
          <p className="text-muted-foreground">Manage your store, inventory, and orders.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{productsCount || 0}</div>
              <p className="text-xs text-muted-foreground">
                {productsCount ? `${productsCount} products listed` : "No products listed"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pending || 0}</div>
              <p className="text-xs text-muted-foreground">Awaiting processing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivered</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.delivered || 0}</div>
              <p className="text-xs text-muted-foreground">Successfully delivered</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your store and inventory</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button className="h-20" variant="outline" onClick={() => navigate('/retailer/products')}>
              Manage Products
            </Button>
            <Button className="h-20" variant="outline" onClick={() => navigate('/retailer/pending-products')}>
              Pending Requests
            </Button>
            <Button className="h-20" variant="outline" onClick={() => navigate('/retailer/order-management')}>
              Order Management
            </Button>
            <Button className="h-20" variant="outline" onClick={() => navigate('/retailer/orders')}>
              View Orders
            </Button>
            <Button className="h-20" variant="outline" onClick={() => navigate('/retailer/wholesalers')}>
              Browse Wholesalers
            </Button>
          </CardContent>
        </Card>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {stats && <OrderStatsChart stats={stats} />}
          {monthlyData && <RevenueChart data={monthlyData} />}
        </div>

        {deliveryStats && (
          <div className="mb-8">
            <DeliveryPerformanceChart stats={deliveryStats} />
          </div>
        )}
      </main>
    </div>
  );
};

export default RetailerDashboard;
