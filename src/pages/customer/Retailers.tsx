import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useRetailers } from "@/hooks/useRetailers";
import { RetailerCard } from "@/components/customer/RetailerCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Retailers = () => {
  const { loading: authLoading } = useRequireAuth("customer");
  const { data: retailers, isLoading } = useRetailers();
  const navigate = useNavigate();

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-10 w-64 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/customer/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Browse Retailers</h1>
        </div>

        {retailers && retailers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {retailers.map((retailer) => (
              <RetailerCard key={retailer.id} retailer={retailer} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No Retailers Available"
            description="There are no active retailers in your area at the moment. Please check back later."
          />
        )}
      </div>
    </div>
  );
};

export default Retailers;
