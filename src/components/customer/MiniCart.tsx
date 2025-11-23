import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { PriceDisplay } from "@/components/shared/PriceDisplay";
import { Trash2, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MiniCartProps {
  onClose: () => void;
}

export const MiniCart = ({ onClose }: MiniCartProps) => {
  const { cartItems, removeFromCart } = useCart();
  const navigate = useNavigate();

  const handleViewCart = () => {
    onClose();
    navigate("/customer/cart");
  };

  const subtotal = cartItems?.reduce((sum, item: any) => {
    return sum + (item.price * item.quantity);
  }, 0) || 0;

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="w-80 p-4 text-center">
        <ShoppingBag className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-4">Your cart is empty</p>
        <Button onClick={onClose} variant="outline" className="w-full">
          Continue Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Shopping Cart</h3>
        <p className="text-xs text-muted-foreground">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</p>
      </div>

      <ScrollArea className="h-[300px]">
        <div className="p-4 space-y-3">
          {cartItems.slice(0, 5).map((item: any) => {
            const product = item.products;
            const price = item.price;

            return (
              <div key={item.id} className="flex gap-3 items-start pb-3 border-b border-border last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{product?.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">Qty: {item.quantity}</p>
                  <PriceDisplay price={price * item.quantity} className="text-sm mt-1" />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFromCart.mutate(item.id)}
                  className="h-8 w-8 flex-shrink-0"
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            );
          })}
          {cartItems.length > 5 && (
            <p className="text-xs text-center text-muted-foreground py-2">
              + {cartItems.length - 5} more items
            </p>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border space-y-3 bg-background">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-foreground">Subtotal:</span>
          <PriceDisplay price={subtotal} className="text-lg font-bold" />
        </div>
        <Button onClick={handleViewCart} className="w-full">
          <ShoppingBag className="h-4 w-4 mr-2" />
          View Full Cart
        </Button>
      </div>
    </div>
  );
};
