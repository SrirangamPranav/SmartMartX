import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/useCart";

interface AddToCartButtonProps {
  productId: string;
  sellerId: string;
  stockQuantity: number;
  isAvailable: boolean;
  className?: string;
}

export const AddToCartButton = ({
  productId,
  sellerId,
  stockQuantity,
  isAvailable,
  className = "",
}: AddToCartButtonProps) => {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart.mutate({ productId, sellerId, quantity: 1 });
  };

  const isDisabled = !isAvailable || stockQuantity === 0 || addToCart.isPending;

  return (
    <Button
      onClick={handleAddToCart}
      disabled={isDisabled}
      className={className}
    >
      <ShoppingCart className="h-4 w-4 mr-2" />
      {addToCart.isPending ? "Adding..." : "Add to Cart"}
    </Button>
  );
};
