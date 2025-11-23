import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PriceDisplay } from "@/components/shared/PriceDisplay";
import { ShoppingBag } from "lucide-react";

interface CartSummaryProps {
  items: any[];
  onCheckout: () => void;
}

export const CartSummary = ({ items, onCheckout }: CartSummaryProps) => {
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;

  const hasOutOfStock = items.some(
    (item) => !item.is_available || item.stock_quantity === 0
  );

  const hasLowStock = items.some(
    (item) => item.quantity > item.stock_quantity
  );

  const canCheckout = !hasOutOfStock && !hasLowStock && items.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <PriceDisplay price={subtotal} />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax (10%)</span>
            <PriceDisplay price={tax} />
          </div>
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>Total</span>
            <PriceDisplay price={total} className="text-lg" />
          </div>
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={onCheckout}
          disabled={!canCheckout}
        >
          <ShoppingBag className="h-4 w-4 mr-2" />
          Proceed to Checkout
        </Button>

        {hasOutOfStock && (
          <p className="text-xs text-destructive text-center">
            Remove out of stock items to continue
          </p>
        )}

        {hasLowStock && !hasOutOfStock && (
          <p className="text-xs text-yellow-600 dark:text-yellow-500 text-center">
            Adjust quantities to continue
          </p>
        )}
      </CardContent>
    </Card>
  );
};
