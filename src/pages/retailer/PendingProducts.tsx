import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useB2BOrders } from "@/hooks/useB2BOrders";
import { NavBar } from "@/components/NavBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { PriceDisplay } from "@/components/shared/PriceDisplay";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Package, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

const PendingProducts = () => {
  const { user, loading: authLoading } = useRequireAuth("retailer");
  const { data: orders, isLoading } = useB2BOrders(user?.id || "", "retailer");
  const queryClient = useQueryClient();

  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", orderId)
        .eq("buyer_id", user?.id)
        .eq("status", "pending");

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Order cancelled successfully");
      queryClient.invalidateQueries({ queryKey: ["b2b-orders"] });
    },
    onError: () => {
      toast.error("Failed to cancel order");
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "pending":
        return "secondary";
      case "confirmed":
        return "default";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

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
            Track your product requests to wholesalers
          </p>
        </div>

        {orders && orders.length > 0 ? (
          <div className="grid gap-6">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Order #{order.order_number}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(order.created_at), "PPp")}
                      </p>
                    </div>
                    <Badge variant={getStatusVariant(order.status)} className="flex items-center gap-1">
                      {getStatusIcon(order.status)}
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Products Requested:</h4>
                      <div className="space-y-2">
                        {order.order_items?.map((item: any) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 bg-muted rounded-lg"
                          >
                            <div>
                              <p className="font-medium">{item.products?.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Quantity: {item.quantity} units
                              </p>
                            </div>
                            <PriceDisplay price={item.subtotal} />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Amount</p>
                        <PriceDisplay price={order.total_amount} className="text-xl" />
                      </div>

                      {order.status === "pending" && (
                        <Button
                          variant="destructive"
                          onClick={() => cancelOrderMutation.mutate(order.id)}
                          disabled={cancelOrderMutation.isPending}
                        >
                          Cancel Request
                        </Button>
                      )}

                      {order.status === "confirmed" && (
                        <Badge variant="default" className="text-base px-4 py-2">
                          ✓ Approved - Stock Added
                        </Badge>
                      )}
                    </div>

                    {order.notes && (
                      <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground">Note: {order.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No Product Requests"
            description="You haven't made any product requests yet. Browse wholesalers to add products to your store."
          />
        )}
      </div>
    </div>
  );
};

export default PendingProducts;
