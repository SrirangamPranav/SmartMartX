import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StockBadge } from "@/components/shared/StockBadge";
import { PriceDisplay } from "@/components/shared/PriceDisplay";
import { useNavigate } from "react-router-dom";
import { AddToCartButton } from "@/components/customer/AddToCartButton";
import { Eye } from "lucide-react";

interface ProductCardProps {
  product: {
    id: string;
    product_id: string;
    retailer_id: string;
    retailers?: {
      user_id: string;
    };
    products: {
      name: string;
      description: string | null;
      category: string;
    };
    price: number;
    stock_quantity: number;
    is_available: boolean;
  };
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{product.products.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {product.products.description || "No description available"}
        </p>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <div className="flex justify-between items-center w-full">
          <PriceDisplay price={product.price} className="text-xl" />
          <StockBadge stockQuantity={product.stock_quantity} isAvailable={product.is_available} />
        </div>
        <div className="flex gap-2 w-full">
          <Button 
            variant="outline" 
            onClick={() => navigate(`/customer/product/${product.id}`)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            View
          </Button>
          <AddToCartButton
            productId={product.product_id}
            sellerId={product.retailers?.user_id || product.retailer_id}
            stockQuantity={product.stock_quantity}
            isAvailable={product.is_available}
            className="flex-1"
          />
        </div>
      </CardFooter>
    </Card>
  );
};
