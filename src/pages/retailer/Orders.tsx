import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NavBar } from "@/components/NavBar";
import { Calendar, MapPin, Package } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

const Orders = () => {
  const { user, loading } = useRequireAuth('retailer');
  const navigate = useNavigate();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["retailer-orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          buyer:profiles!orders_buyer_id_fkey(full_name, phone),
          order_items(
            *,
            product:products(name, image_url)
          ),
          delivery_tracking(current_status, tracking_number)
        `)
        .eq("seller_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      confirmed: "default",
      processing: "default",
      shipped: "default",
      delivered: "outline",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const filterOrders = (status?: string) => {
    if (!orders) return [];
    if (!status) return orders;
    return orders.filter(order => order.status === status);
  };

  const OrderCard = ({ order }: { order: any }) => (
    <Card className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/retailer/order/${order.id}`)}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              #{order.order_number}
              {getStatusBadge(order.status)}
            </CardTitle>
            <CardDescription className="mt-2">
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(order.created_at), 'PP')}
                </span>
                <span>{order.buyer?.full_name}</span>
              </div>
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold">₹{order.total_amount.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">{order.order_items?.length} items</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 mt-0.5" />
          <p className="line-clamp-1">{order.delivery_address}</p>
        </div>
        {order.delivery_tracking && (
          <div className="mt-2 pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Tracking: {order.delivery_tracking.tracking_number} • 
              Status: {order.delivery_tracking.current_status}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold mb-2">All Orders</h2>
            <p className="text-muted-foreground">View and manage your order history</p>
          </div>
          <Button onClick={() => navigate('/retailer/order-management')}>
            <Package className="h-4 w-4 mr-2" />
            Pending Orders
          </Button>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="all">All ({orders?.length || 0})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({filterOrders('pending').length})</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed ({filterOrders('confirmed').length})</TabsTrigger>
            <TabsTrigger value="delivered">Delivered ({filterOrders('delivered').length})</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled ({filterOrders('cancelled').length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {!orders || orders.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-xl font-semibold">No Orders Yet</p>
                  <p className="text-muted-foreground">Orders will appear here once customers place them</p>
                </CardContent>
              </Card>
            ) : (
              orders.map(order => <OrderCard key={order.id} order={order} />)
            )}
          </TabsContent>

          {['pending', 'confirmed', 'delivered', 'cancelled'].map(status => (
            <TabsContent key={status} value={status} className="space-y-4">
              {filterOrders(status).length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Package className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-xl font-semibold">No {status} orders</p>
                  </CardContent>
                </Card>
              ) : (
                filterOrders(status).map(order => <OrderCard key={order.id} order={order} />)
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
};

export default Orders;
