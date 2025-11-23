import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PriceDisplay } from "@/components/shared/PriceDisplay";
import { format } from "date-fns";
import { Package, Clock, CheckCircle, XCircle, AlertCircle, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface B2BOrderCardProps {
  order: any;
  showActions?: boolean;
}

export const B2BOrderCard = ({ order, showActions = false }: B2BOrderCardProps) => {
  const navigate = useNavigate();

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

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order #{order.order_number}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              From: {order.retailers?.business_name || "Unknown Retailer"}
            </p>
            <p className="text-xs text-muted-foreground">
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
            <h4 className="font-semibold mb-2 text-sm">Products Requested:</h4>
            <div className="space-y-2">
              {order.order_items?.slice(0, 2).map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 bg-muted rounded-md text-sm"
                >
                  <div>
                    <p className="font-medium">{item.products?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Qty: {item.quantity} × ₹{item.unit_price}
                    </p>
                  </div>
                  <PriceDisplay price={item.subtotal} className="text-sm" />
                </div>
              ))}
              {order.order_items?.length > 2 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{order.order_items.length - 2} more item(s)
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <PriceDisplay price={order.total_amount} className="text-lg font-bold" />
            </div>

            {showActions && order.status === "pending" && (
              <Button onClick={() => navigate(`/wholesaler/order-management/${order.id}`)}>
                Review Order
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}

            {!showActions && (
              <Button
                variant="outline"
                onClick={() => navigate(`/wholesaler/order-management/${order.id}`)}
              >
                View Details
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
