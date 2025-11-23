import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Minus, Plus } from "lucide-react";
import { PriceDisplay } from "@/components/shared/PriceDisplay";
import { StockBadge } from "@/components/shared/StockBadge";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface CartItemProps {
  item: any;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
}

export const CartItem = ({ item, onUpdateQuantity, onRemove }: CartItemProps) => {
  const [quantity, setQuantity] = useState(item.quantity);
  const product = item.products;
  const retailer = item.retailer;
  const price = item.price;
  const stockQuantity = item.stock_quantity;
  const isAvailable = item.is_available;

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return;
    if (newQuantity > stockQuantity) {
      return;
    }
    setQuantity(newQuantity);
    onUpdateQuantity(item.id, newQuantity);
  };

  const outOfStock = !isAvailable || stockQuantity === 0;
  const lowStock = stockQuantity < quantity;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-foreground">{product?.name}</h3>
                <p className="text-sm text-muted-foreground">From: {retailer?.business_name || 'Unknown'}</p>
                <Badge variant="outline" className="mt-1">{product?.category}</Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(item.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>

            {outOfStock && (
              <div className="bg-destructive/10 text-destructive text-sm p-2 rounded mb-2">
                This item is currently out of stock
              </div>
            )}

            {!outOfStock && lowStock && (
              <div className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 text-sm p-2 rounded mb-2">
                Only {stockQuantity} items available. Please reduce quantity.
              </div>
            )}

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                  className="w-16 text-center"
                  min="1"
                  max={stockQuantity}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= stockQuantity}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <StockBadge stockQuantity={stockQuantity} isAvailable={isAvailable} />
              </div>

              <div className="text-right">
                <PriceDisplay price={price} className="text-lg" />
                <p className="text-xs text-muted-foreground">
                  Subtotal: <PriceDisplay price={price * quantity} />
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
