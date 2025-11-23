import { useParams, useNavigate } from "react-router-dom";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NavBar } from "@/components/NavBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PriceDisplay } from "@/components/shared/PriceDisplay";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle, XCircle, Package, AlertTriangle } from "lucide-react";
import { useState } from "react";

const WholesalerOrderManagement = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useRequireAuth("wholesaler");
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason] = useState("");

  const { data: order, isLoading } = useQuery({
    queryKey: ["b2b-order", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
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
        .eq("id", orderId)
        .eq("seller_id", user?.id)
        .eq("order_type", "retailer_to_wholesaler")
        .single();

      if (error) throw error;

      // Fetch retailer info separately
      const { data: retailer } = await supabase
        .from("retailers")
        .select("business_name, business_address, user_id")
        .eq("user_id", data.buyer_id)
        .single();

      return { ...data, retailers: retailer };
    },
    enabled: !!orderId && !!user,
  });

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

  // Check stock availability for all items
  const { data: stockCheck } = useQuery({
    queryKey: ["stock-check", orderId, wholesaler?.id],
    queryFn: async () => {
      if (!order?.order_items || !wholesaler?.id) return null;

      const checks = await Promise.all(
        order.order_items.map(async (item: any) => {
          const { data, error } = await supabase
            .from("wholesaler_products")
            .select("stock_quantity")
            .eq("wholesaler_id", wholesaler.id)
            .eq("product_id", item.product_id)
            .single();

          if (error) return { product: item.products.name, available: false, current: 0, needed: item.quantity };

          return {
            product: item.products.name,
            available: data.stock_quantity >= item.quantity,
            current: data.stock_quantity,
            needed: item.quantity,
          };
        })
      );

      return {
        allAvailable: checks.every((c) => c.available),
        items: checks,
      };
    },
    enabled: !!order && !!wholesaler,
  });

  const approveOrderMutation = useMutation({
    mutationFn: async () => {
      if (!stockCheck?.allAvailable) {
        throw new Error("Insufficient stock for some items");
      }

      const { error } = await supabase
        .from("orders")
        .update({ status: "confirmed" })
        .eq("id", orderId)
        .eq("seller_id", user?.id)
        .eq("status", "pending");

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Order approved! Stock has been updated.");
      queryClient.invalidateQueries({ queryKey: ["b2b-order"] });
      queryClient.invalidateQueries({ queryKey: ["wholesaler-b2b-orders"] });
      navigate("/wholesaler/orders");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to approve order");
    },
  });

  const rejectOrderMutation = useMutation({
    mutationFn: async () => {
      if (!rejectReason.trim()) {
        throw new Error("Please provide a reason for rejection");
      }

      const { error } = await supabase
        .from("orders")
        .update({
          status: "cancelled",
          notes: order?.notes ? `${order.notes}\nRejected: ${rejectReason}` : `Rejected: ${rejectReason}`,
        })
        .eq("id", orderId)
        .eq("seller_id", user?.id)
        .eq("status", "pending");

      if (error) throw error;

      // Create notification for retailer
      console.log("Creating rejection notification for retailer:", order?.buyer_id);
      const { error: notificationError } = await supabase.from("notifications").insert({
        user_id: order?.buyer_id,
        type: "order_cancelled",
        title: "Order Rejected",
        message: `Your product request #${order?.order_number} was rejected. Reason: ${rejectReason}`,
        related_order_id: orderId,
      });

      if (notificationError) {
        console.error("Failed to create rejection notification:", notificationError);
        // Don't fail the rejection, just log the error
      } else {
        console.log("Rejection notification created successfully");
      }
    },
    onSuccess: () => {
      toast.success("Order rejected");
      queryClient.invalidateQueries({ queryKey: ["b2b-order"] });
      queryClient.invalidateQueries({ queryKey: ["wholesaler-b2b-orders"] });
      navigate("/wholesaler/orders");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reject order");
    },
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-64 mb-6" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container mx-auto px-4 py-8">
          <p>Order not found</p>
        </div>
      </div>
    );
  }

  const isPending = order.status === "pending";

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/wholesaler/orders")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Order #{order.order_number}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(new Date(order.created_at), "PPp")}
                  </p>
                </div>
                <Badge
                  variant={
                    order.status === "pending"
                      ? "secondary"
                      : order.status === "confirmed"
                      ? "default"
                      : "destructive"
                  }
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Retailer Information</h4>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-muted-foreground">Business:</span>{" "}
                      {order.retailers?.business_name}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Contact:</span>{" "}
                      {order.profiles?.full_name}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Address:</span>{" "}
                      {order.retailers?.business_address}
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Delivery Address</h4>
                  <p className="text-sm">{order.delivery_address}</p>
                  {order.notes && (
                    <div className="mt-3">
                      <h4 className="font-semibold mb-1">Notes</h4>
                      <p className="text-sm text-muted-foreground">{order.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Requested Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.order_items?.map((item: any, index: number) => {
                  const itemStock = stockCheck?.items[index];
                  return (
                    <div
                      key={item.id}
                      className="flex items-start justify-between p-4 bg-muted rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.products?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Category: {item.products?.category}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Quantity: {item.quantity} units × ₹{item.unit_price}
                        </p>
                        {itemStock && (
                          <div className="mt-2 flex items-center gap-2">
                            {itemStock.available ? (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                ✓ Stock Available ({itemStock.current} units)
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Insufficient Stock (Have: {itemStock.current}, Need: {itemStock.needed})
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      <PriceDisplay price={item.subtotal} className="text-lg font-semibold" />
                    </div>
                  );
                })}

                <div className="flex items-center justify-between pt-4 border-t">
                  <p className="text-lg font-semibold">Total Amount</p>
                  <PriceDisplay price={order.total_amount} className="text-2xl font-bold" />
                </div>
              </div>
            </CardContent>
          </Card>

          {isPending && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!stockCheck?.allAvailable && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm font-medium text-destructive flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Cannot approve: Insufficient stock for some items
                    </p>
                  </div>
                )}

                <div className="flex gap-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        className="flex-1"
                        disabled={!stockCheck?.allAvailable || approveOrderMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve Order
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Approve Product Request</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will approve the order and automatically:
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Deduct stock from your inventory</li>
                            <li>Add products to retailer's store</li>
                            <li>Notify the retailer</li>
                          </ul>
                          <p className="mt-3 font-medium">This action cannot be undone.</p>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => approveOrderMutation.mutate()}>
                          Approve Order
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="flex-1">
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject Order
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reject Product Request</AlertDialogTitle>
                        <AlertDialogDescription>
                          Please provide a reason for rejecting this order. The retailer will be notified.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="my-4">
                        <Label htmlFor="reject-reason">Reason for Rejection *</Label>
                        <Textarea
                          id="reject-reason"
                          placeholder="e.g., Out of stock, Minimum order not met, etc."
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          className="mt-2"
                          rows={3}
                        />
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => rejectOrderMutation.mutate()}
                          disabled={!rejectReason.trim() || rejectOrderMutation.isPending}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Reject Order
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default WholesalerOrderManagement;
