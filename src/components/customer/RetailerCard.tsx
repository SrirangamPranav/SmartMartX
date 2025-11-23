import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface RetailerCardProps {
  retailer: {
    id: string;
    business_name: string;
    business_address: string;
    delivery_radius_km: number | null;
  };
}

export const RetailerCard = ({ retailer }: RetailerCardProps) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{retailer.business_name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-2 mb-4">
          <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{retailer.business_address}</p>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Delivery Radius: {retailer.delivery_radius_km || 5} km
        </p>
        <Button
          onClick={() => navigate(`/customer/retailer/${retailer.id}/products`)}
          className="w-full"
        >
          View Products
        </Button>
      </CardContent>
    </Card>
  );
};
