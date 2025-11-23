import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, MapPin, Eye } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface OrderCardProps {
  order: {
    id: string;
    order_number: string;
    total_amount: number;
    status: string;
    delivery_address: string;
    created_at: string;
    seller: { full_name: string };
    delivery_tracking?: Array<{
      tracking_number: string;
      current_status: string;
    }>;
  };
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  processing: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  shipped: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  delivered: "bg-green-500/10 text-green-500 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
};

const deliveryStatusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  packed: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  picked_up: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  in_transit: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  out_for_delivery: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  delivered: "bg-green-500/10 text-green-500 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
};

export const OrderCard = ({ order }: OrderCardProps) => {
  const navigate = useNavigate();
  const hasTracking = order.delivery_tracking && order.delivery_tracking.length > 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {order.order_number}
            </CardTitle>
            <CardDescription>
              Ordered on {format(new Date(order.created_at), "MMM dd, yyyy")}
            </CardDescription>
          </div>
          <Badge className={statusColors[order.status] || "bg-muted"}>
            {order.status.replace(/_/g, " ").toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{order.delivery_address}</span>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold">₹{order.total_amount.toFixed(2)}</p>
            </div>

            {hasTracking && (
              <div className="text-right space-y-1">
                <Badge className={deliveryStatusColors[order.delivery_tracking[0].current_status] || "bg-muted"}>
                  {order.delivery_tracking[0].current_status.replace(/_/g, " ").toUpperCase()}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  {order.delivery_tracking[0].tracking_number}
                </p>
              </div>
            )}
          </div>

          {hasTracking && (
            <Button
              onClick={() => navigate(`/customer/tracking/${order.id}`)}
              className="w-full"
              variant="outline"
            >
              <Eye className="h-4 w-4 mr-2" />
              Track Order
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
