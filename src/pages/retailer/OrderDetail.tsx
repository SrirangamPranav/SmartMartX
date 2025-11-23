import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NavBar } from "@/components/NavBar";
import { ArrowLeft, Calendar, MapPin, Package, Truck, User, Phone } from "lucide-react";
import { format } from "date-fns";
import { useNavigate, useParams } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

const OrderDetail = () => {
  const { user, loading } = useRequireAuth('retailer');
  const navigate = useNavigate();
  const { orderId } = useParams();

  const { data: order, isLoading } = useQuery({
    queryKey: ["order-detail", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          buyer:profiles!orders_buyer_id_fkey(full_name, phone, email_verified),
          order_items(
            *,
            product:products(name, image_url, description, category)
          ),
          delivery_tracking(
            *,
            delivery_status_history(*)
          )
        `)
        .eq("id", orderId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
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

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-xl">Order not found</p>
              <Button className="mt-4" onClick={() => navigate('/retailer/orders')}>
                Back to Orders
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      <main className="container mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-6" onClick={() => navigate('/retailer/orders')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Order Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      Order #{order.order_number}
                      {getStatusBadge(order.status)}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Placed on {format(new Date(order.created_at), 'PPpp')}
                      </div>
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold">₹{order.total_amount.toLocaleString()}</p>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
                <CardDescription>{order.order_items?.length} items</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.order_items?.map((item: any) => (
                    <div key={item.id}>
                      <div className="flex gap-4">
                        {item.product?.image_url && (
                          <img 
                            src={item.product.image_url} 
                            alt={item.product.name}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold">{item.product?.name}</h4>
                          {item.product?.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {item.product.description}
                            </p>
                          )}
                          <div className="flex justify-between items-center mt-2">
                            <p className="text-sm text-muted-foreground">
                              Quantity: {item.quantity} × ₹{item.unit_price.toFixed(2)}
                            </p>
                            <p className="font-semibold">₹{item.subtotal.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                      <Separator className="mt-4" />
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2">
                    <p className="text-lg font-semibold">Total</p>
                    <p className="text-2xl font-bold">₹{order.total_amount.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Tracking */}
            {order.delivery_tracking && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Delivery Tracking
                  </CardTitle>
                  <CardDescription>
                    Tracking #{order.delivery_tracking.tracking_number}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span>Current Status</span>
                      <Badge>{order.delivery_tracking.current_status}</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Delivery Partner</p>
                      <p className="text-sm">{order.delivery_tracking.delivery_partner_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.delivery_tracking.delivery_partner_phone}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Estimated Delivery</p>
                      <p className="text-sm">
                        {format(new Date(order.delivery_tracking.estimated_delivery_time), 'PPpp')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Name</p>
                  <p className="text-sm text-muted-foreground">{order.buyer?.full_name}</p>
                </div>
                {order.buyer?.phone && (
                  <div>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      Phone
                    </p>
                    <p className="text-sm text-muted-foreground">{order.buyer.phone}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delivery Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{order.delivery_address}</p>
                {order.delivery_latitude && order.delivery_longitude && (
                  <Button 
                    variant="outline" 
                    className="w-full mt-3"
                    onClick={() => window.open(
                      `https://www.google.com/maps?q=${order.delivery_latitude},${order.delivery_longitude}`,
                      '_blank'
                    )}
                  >
                    View on Map
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Order Notes */}
            {order.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Order Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{order.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderDetail;
