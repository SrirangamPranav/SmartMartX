import { useNavigate } from "react-router-dom";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useWholesalers } from "@/hooks/useWholesalers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MapPin } from "lucide-react";

const Wholesalers = () => {
  const navigate = useNavigate();
  const { loading: authLoading } = useRequireAuth("retailer");
  const { data: wholesalers, isLoading } = useWholesalers();

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="h-10 w-64 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/retailer/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Browse Wholesalers</h1>
        </div>

        {wholesalers && wholesalers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wholesalers.map((wholesaler) => (
              <Card key={wholesaler.id}>
                <CardHeader>
                  <CardTitle>{wholesaler.business_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-2 mb-4">
                    <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{wholesaler.business_address}</p>
                  </div>
                  {wholesaler.minimum_order_value && (
                    <p className="text-sm text-muted-foreground mb-4">
                      Min Order: ₹{wholesaler.minimum_order_value}
                    </p>
                  )}
                  <Button
                    onClick={() => navigate(`/retailer/wholesaler/${wholesaler.id}/products`)}
                    className="w-full"
                  >
                    View Products
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No Wholesalers Available"
            description="There are no active wholesalers at the moment. Please check back later."
          />
        )}
      </div>
    </div>
  );
};

export default Wholesalers;
