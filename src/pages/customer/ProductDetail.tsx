import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StockBadge } from "@/components/shared/StockBadge";
import { PriceDisplay } from "@/components/shared/PriceDisplay";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AddToCartButton } from "@/components/customer/AddToCartButton";

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { loading: authLoading } = useRequireAuth("customer");

  const { data: product, isLoading } = useQuery({
    queryKey: ["retailer-product", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("retailer_products")
        .select("*, products(*), retailers(*)")
        .eq("id", productId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="h-10 w-64 mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!product) {
    return <div>Product not found</div>;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl mb-2">{product.products.name}</CardTitle>
                <Badge>{product.products.category}</Badge>
              </div>
              <StockBadge stockQuantity={product.stock_quantity} isAvailable={product.is_available} />
            </div>
          </CardHeader>
          <CardContent>
            <PriceDisplay price={product.price} className="text-4xl text-primary mb-6" />
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">
                {product.products.description || "No description available"}
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Seller Information</h3>
              <p className="text-foreground font-medium">{product.retailers.business_name}</p>
              <p className="text-sm text-muted-foreground">{product.retailers.business_address}</p>
            </div>

            <AddToCartButton
              productId={product.id}
              sellerId={product.retailer_id}
              stockQuantity={product.stock_quantity}
              isAvailable={product.is_available}
              className="w-full"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductDetail;
