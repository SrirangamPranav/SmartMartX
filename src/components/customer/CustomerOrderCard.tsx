import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PriceDisplay } from "@/components/shared/PriceDisplay";
import { MapPin, Package, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface CustomerOrderCardProps {
  order: {
    id: string;
    order_number: string;
    created_at: string;
    status: string;
    total_amount: number;
    delivery_address: string;
    order_items: Array<{
      id: string;
      quantity: number;
      products: {
        name: string;
        image_url: string | null;
      };
    }>;
    delivery_tracking?: Array<{
      id: string;
      tracking_number: string;
      current_status: string;
    }>;
  };
}

const statusColors = {
  pending: "bg-yellow-500",
  confirmed: "bg-blue-500",
  processing: "bg-purple-500",
  shipped: "bg-indigo-500",
  delivered: "bg-green-500",
  cancelled: "bg-red-500",
};

export const CustomerOrderCard = ({ order }: CustomerOrderCardProps) => {
  const navigate = useNavigate();
  const hasTracking = order.delivery_tracking && order.delivery_tracking.length > 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">{order.order_number}</h3>
            <p className="text-sm text-muted-foreground">
              {format(new Date(order.created_at), "MMM dd, yyyy • hh:mm a")}
            </p>
          </div>
          <Badge
            variant="secondary"
            className={`${statusColors[order.status as keyof typeof statusColors]} text-white`}
          >
            {order.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground line-clamp-2">
            {order.delivery_address}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Package className="h-4 w-4" />
            <span>{order.order_items?.length || 0} item(s)</span>
          </div>
          {order.order_items && order.order_items.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {order.order_items.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="w-12 h-12 rounded bg-muted flex items-center justify-center overflow-hidden"
                >
                  {item.products?.image_url ? (
                    <img
                      src={item.products.image_url}
                      alt={item.products.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              ))}
              {order.order_items.length > 3 && (
                <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-xs font-medium">
                  +{order.order_items.length - 3}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm font-medium">Total Amount</span>
          <PriceDisplay price={order.total_amount} className="text-lg font-bold" />
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        {hasTracking && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/customer/tracking/${order.id}`)}
            className="gap-2"
          >
            <Truck className="h-4 w-4" />
            Track Order
          </Button>
        )}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(`/customer/tracking/${order.id}`)}
          className="flex-1"
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};
