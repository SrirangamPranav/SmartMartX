import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, User, Clock, Package } from "lucide-react";
import { format } from "date-fns";

interface DeliveryPartnerCardProps {
  partnerName: string;
  partnerPhone: string;
  trackingNumber: string;
  estimatedDelivery: string;
  actualDelivery?: string;
}

export const DeliveryPartnerCard = ({
  partnerName,
  partnerPhone,
  trackingNumber,
  estimatedDelivery,
  actualDelivery,
}: DeliveryPartnerCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery Partner</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">{partnerName}</p>
            <p className="text-sm text-muted-foreground">Delivery Partner</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tracking Number</p>
            <p className="font-mono font-semibold">{trackingNumber}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Clock className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {actualDelivery ? "Delivered On" : "Estimated Delivery"}
            </p>
            <p className="font-semibold">
              {format(
                new Date(actualDelivery || estimatedDelivery),
                "MMM dd, yyyy 'at' hh:mm a"
              )}
            </p>
          </div>
        </div>

        <Button className="w-full" variant="outline" asChild>
          <a href={`tel:${partnerPhone}`}>
            <Phone className="h-4 w-4 mr-2" />
            Call {partnerName}
          </a>
        </Button>
      </CardContent>
    </Card>
  );
};
