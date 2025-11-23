import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useCart } from "@/hooks/useCart";
import { CartItem } from "@/components/customer/CartItem";
import { CartSummary } from "@/components/customer/CartSummary";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Cart = () => {
  const { loading: authLoading } = useRequireAuth("customer");
  const { cartItems, isLoading, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    navigate("/customer/checkout");
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-10 w-64 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  // Group items by retailer
  const groupedItems = cartItems?.reduce((acc: any, item: any) => {
    const retailerId = item.retailer?.id || item.seller_id;
    if (!acc[retailerId]) {
      acc[retailerId] = {
        retailer: item.retailer,
        items: [],
      };
    }
    acc[retailerId].items.push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/customer/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Shopping Cart</h1>
        </div>

        {!cartItems || cartItems.length === 0 ? (
          <EmptyState
            title="Your cart is empty"
            description="Start shopping to add items to your cart"
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {Object.values(groupedItems).map((group: any) => (
                <div key={group.retailer?.id || 'unknown'} className="space-y-4">
                  <h2 className="text-xl font-semibold text-foreground">
                    {group.retailer?.business_name || 'Unknown Retailer'}
                  </h2>
                  {group.items.map((item: any) => (
                    <CartItem
                      key={item.id}
                      item={item}
                      onUpdateQuantity={(itemId, quantity) =>
                        updateQuantity.mutate({ itemId, quantity })
                      }
                      onRemove={(itemId) => removeFromCart.mutate(itemId)}
                    />
                  ))}
                </div>
              ))}
            </div>

            <div className="lg:sticky lg:top-6 h-fit">
              <CartSummary items={cartItems} onCheckout={handleCheckout} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
