import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

interface DeliveryMapProps {
  currentLatitude?: number;
  currentLongitude?: number;
  deliveryAddress: string;
}

export const DeliveryMap = ({
  currentLatitude,
  currentLongitude,
  deliveryAddress,
}: DeliveryMapProps) => {
  // For now, we'll show a placeholder map
  // In a real implementation, you'd use Google Maps or Mapbox
  const hasLocation = currentLatitude && currentLongitude;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery Location</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
            {hasLocation ? (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20">
                <div className="flex items-center justify-center h-full">
                  <div className="relative">
                    <MapPin className="h-12 w-12 text-primary animate-bounce" />
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-primary/30 rounded-full blur-md" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-8">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Location tracking not available yet
                </p>
              </div>
            )}
          </div>

          <div className="flex items-start gap-2 p-4 bg-muted/50 rounded-lg">
            <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">Delivery Address</p>
              <p className="text-sm text-muted-foreground">{deliveryAddress}</p>
            </div>
          </div>

          {hasLocation && (
            <div className="text-xs text-muted-foreground text-center">
              Last updated: Just now
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
