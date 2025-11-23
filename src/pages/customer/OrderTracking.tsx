import { useParams, useNavigate } from "react-router-dom";
import { useDeliveryTracking } from "@/hooks/useDeliveryTracking";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, Loader2 } from "lucide-react";
import { DeliveryTimeline } from "@/components/customer/tracking/DeliveryTimeline";
import { DeliveryPartnerCard } from "@/components/customer/tracking/DeliveryPartnerCard";
import { DeliveryMap } from "@/components/customer/tracking/DeliveryMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const OrderTracking = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { tracking, isLoading } = useDeliveryTracking(orderId!);

  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!tracking) {
    return (
      <div className="container max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Tracking information not available</h2>
          <p className="text-muted-foreground mb-6">
            We couldn't find tracking information for this order.
          </p>
          <Button onClick={() => navigate("/customer/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    packed: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    picked_up: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
    in_transit: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    out_for_delivery: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    delivered: "bg-green-500/10 text-green-500 border-green-500/20",
    cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
  };

  return (
    <div className="container max-w-6xl mx-auto p-6">
      <Button variant="ghost" onClick={() => navigate("/customer/dashboard")} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Orders
      </Button>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">Track Your Order</h1>
          <Badge className={statusColors[tracking.current_status] || "bg-muted"}>
            {tracking.current_status.replace(/_/g, " ").toUpperCase()}
          </Badge>
        </div>
        <p className="text-muted-foreground">Order #{tracking.order.order_number}</p>
      </div>

      {/* Order Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Order Number</p>
              <p className="font-semibold">{tracking.order.order_number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="font-semibold">₹{tracking.order.total_amount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Order Status</p>
              <p className="font-semibold capitalize">{tracking.order.status.replace(/_/g, " ")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <DeliveryTimeline
            statusHistory={tracking.status_history}
            currentStatus={tracking.current_status}
          />
          <DeliveryMap
            currentLatitude={tracking.current_latitude}
            currentLongitude={tracking.current_longitude}
            deliveryAddress={tracking.order.delivery_address}
          />
        </div>

        <div>
          <DeliveryPartnerCard
            partnerName={tracking.delivery_partner_name}
            partnerPhone={tracking.delivery_partner_phone}
            trackingNumber={tracking.tracking_number}
            estimatedDelivery={tracking.estimated_delivery_time}
            actualDelivery={tracking.actual_delivery_time}
          />
        </div>
      </div>

      {tracking.delivery_notes && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Delivery Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{tracking.delivery_notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrderTracking;
