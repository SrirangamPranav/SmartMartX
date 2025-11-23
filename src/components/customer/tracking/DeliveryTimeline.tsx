import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, Clock } from "lucide-react";
import { format } from "date-fns";
import type { DeliveryStatus } from "@/hooks/useDeliveryTracking";

interface DeliveryTimelineProps {
  statusHistory: DeliveryStatus[];
  currentStatus: string;
}

const statusOrder = [
  "pending",
  "confirmed",
  "packed",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
];

const statusLabels: Record<string, string> = {
  pending: "Order Placed",
  confirmed: "Order Confirmed",
  packed: "Package Packed",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const DeliveryTimeline = ({ statusHistory, currentStatus }: DeliveryTimelineProps) => {
  const currentStatusIndex = statusOrder.indexOf(currentStatus);
  const isCancelled = currentStatus === "cancelled";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-8">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

          {statusOrder.map((status, index) => {
            const statusEntry = statusHistory.find((h) => h.status === status);
            const isCompleted = index <= currentStatusIndex && !isCancelled;
            const isCurrent = status === currentStatus;

            return (
              <div key={status} className="relative flex items-start gap-4">
                {/* Status Icon */}
                <div
                  className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    isCompleted
                      ? "bg-primary border-primary"
                      : isCurrent
                      ? "bg-background border-primary"
                      : "bg-background border-border"
                  }`}
                >
                  {isCompleted && !isCurrent ? (
                    <CheckCircle className="h-4 w-4 text-primary-foreground" />
                  ) : isCurrent ? (
                    <Clock className="h-4 w-4 text-primary" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>

                {/* Status Details */}
                <div className="flex-1 pb-8">
                  <div className="flex items-center gap-2">
                    <h4
                      className={`font-semibold ${
                        isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {statusLabels[status]}
                    </h4>
                    {isCurrent && (
                      <Badge variant="secondary" className="text-xs">
                        Current
                      </Badge>
                    )}
                  </div>

                  {statusEntry && (
                    <div className="mt-1 space-y-1">
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(statusEntry.timestamp), "MMM dd, yyyy 'at' hh:mm a")}
                      </p>
                      {statusEntry.location && (
                        <p className="text-sm text-muted-foreground">{statusEntry.location}</p>
                      )}
                      {statusEntry.notes && (
                        <p className="text-sm text-foreground mt-1">{statusEntry.notes}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Cancelled status (if applicable) */}
          {isCancelled && (
            <div className="relative flex items-start gap-4">
              <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-destructive border-destructive">
                <Circle className="h-4 w-4 text-destructive-foreground" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-destructive">Order Cancelled</h4>
                {statusHistory.find((h) => h.status === "cancelled") && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(
                      new Date(statusHistory.find((h) => h.status === "cancelled")!.timestamp),
                      "MMM dd, yyyy 'at' hh:mm a"
                    )}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
