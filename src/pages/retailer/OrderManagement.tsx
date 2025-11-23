import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NavBar } from "@/components/NavBar";
import { Package, Calendar, MapPin, Check, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

const OrderManagement = () => {
  const { user, loading } = useRequireAuth('retailer');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  const { data: pendingOrders, isLoading } = useQuery({
    queryKey: ["pending-orders", retailer?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          buyer:profiles!orders_buyer_id_fkey(full_name, phone),
          order_items(
            *,
            product:products(name, image_url)
          )
        `)
        .eq("seller_id", user?.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!retailer && !!user,
  });

  const confirmOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from("orders")
        .update({ status: "confirmed" })
        .eq("id", orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-orders"] });
      toast.success("Order confirmed successfully!");
    },
    onError: () => {
      toast.error("Failed to confirm order");
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-orders"] });
      toast.success("Order cancelled");
    },
    onError: () => {
      toast.error("Failed to cancel order");
    },
  });

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
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Order Management</h2>
          <p className="text-muted-foreground">Review and confirm pending orders</p>
        </div>

        {!pendingOrders || pendingOrders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-xl font-semibold mb-2">No Pending Orders</p>
              <p className="text-muted-foreground mb-4">All orders have been processed</p>
              <Button onClick={() => navigate('/retailer/orders')}>View All Orders</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingOrders.map((order: any) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Order #{order.order_number}
                        <Badge variant="secondary">Pending</Badge>
                      </CardTitle>
                      <CardDescription className="mt-2">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(order.created_at), 'PPp')}
                          </span>
                          <span>Customer: {order.buyer?.full_name}</span>
                          {order.buyer?.phone && <span>📞 {order.buyer.phone}</span>}
                        </div>
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">₹{order.total_amount.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">{order.order_items?.length} items</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Delivery Address */}
                    <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Delivery Address</p>
                        <p className="text-sm text-muted-foreground">{order.delivery_address}</p>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div>
                      <p className="font-medium text-sm mb-2">Order Items:</p>
                      <div className="space-y-2">
                        {order.order_items?.map((item: any) => (
                          <div key={item.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                            {item.product?.image_url && (
                              <img 
                                src={item.product.image_url} 
                                alt={item.product.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.product?.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Qty: {item.quantity} × ₹{item.unit_price.toFixed(2)}
                              </p>
                            </div>
                            <p className="font-semibold">₹{item.subtotal.toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <Button 
                        className="flex-1"
                        onClick={() => confirmOrderMutation.mutate(order.id)}
                        disabled={confirmOrderMutation.isPending}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Confirm Order
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => cancelOrderMutation.mutate(order.id)}
                        disabled={cancelOrderMutation.isPending}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel Order
                      </Button>
                      <Button 
                        variant="ghost"
                        onClick={() => navigate(`/retailer/order/${order.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default OrderManagement;
