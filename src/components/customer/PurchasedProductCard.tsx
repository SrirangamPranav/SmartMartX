import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PriceDisplay } from "@/components/shared/PriceDisplay";
import { ProductFeedbackDialog } from "./ProductFeedbackDialog";
import { Package } from "lucide-react";
import { format } from "date-fns";

interface PurchasedProductCardProps {
  orderItemId: string;
  productId: string;
  productName: string;
  productImage: string | null;
  productCategory: string;
  quantity: number;
  unitPrice: number;
  orderId: string;
  orderNumber: string;
  orderDate: string;
  orderStatus: string;
  sellerId: string;
  feedback?: {
    id: string;
    rating: number;
    comment: string | null;
  } | null;
}

export const PurchasedProductCard = ({
  productId,
  productName,
  productImage,
  productCategory,
  quantity,
  unitPrice,
  orderId,
  orderNumber,
  orderDate,
  orderStatus,
  sellerId,
  feedback,
}: PurchasedProductCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="w-20 h-20 rounded-md bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
            {productImage ? (
              <img
                src={productImage}
                alt={productName}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{productName}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {productCategory}
              </Badge>
              <span className="text-sm text-muted-foreground">Qty: {quantity}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <PriceDisplay price={unitPrice} className="text-base font-semibold" />
              <span className="text-xs text-muted-foreground">each</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Order {orderNumber} • {format(new Date(orderDate), "MMM dd, yyyy")}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <ProductFeedbackDialog
          productId={productId}
          productName={productName}
          orderId={orderId}
          sellerId={sellerId}
          orderStatus={orderStatus}
          existingFeedback={feedback}
        />
      </CardFooter>
    </Card>
  );
};
