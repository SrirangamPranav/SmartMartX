import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { useCheckout } from "@/hooks/useCheckout";
import { useAddresses } from "@/hooks/useAddresses";
import { AddressStep } from "@/components/customer/checkout/AddressStep";
import { PaymentMethodStep } from "@/components/customer/checkout/PaymentMethodStep";
import { OrderReviewStep } from "@/components/customer/checkout/OrderReviewStep";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, isLoading } = useCart();
  const { defaultAddress } = useAddresses();
  const {
    currentStep,
    checkoutData,
    updateCheckoutData,
    nextStep,
    previousStep,
    placeOrder,
    isPlacingOrder,
  } = useCheckout();

  useEffect(() => {
    if (!isLoading && (!cartItems || cartItems.length === 0)) {
      navigate("/customer/cart");
    }
  }, [cartItems, isLoading, navigate]);

  // Auto-select default address when checkout loads
  useEffect(() => {
    if (defaultAddress && !checkoutData.address) {
      updateCheckoutData({ address: defaultAddress });
    }
  }, [defaultAddress, checkoutData.address, updateCheckoutData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return null;
  }

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const stepProgress = {
    address: 33,
    payment: 66,
    review: 100,
  };

  const handlePlaceOrder = () => {
    placeOrder.mutate({ cartItems, totalAmount });
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Checkout</h1>
          <Progress value={stepProgress[currentStep]} className="h-2" />
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span className={currentStep === "address" ? "text-primary font-medium" : ""}>
              Address
            </span>
            <span className={currentStep === "payment" ? "text-primary font-medium" : ""}>
              Payment
            </span>
            <span className={currentStep === "review" ? "text-primary font-medium" : ""}>
              Review
            </span>
          </div>
        </div>

        <Card className="p-6">
          {currentStep === "address" && (
            <AddressStep
              selectedAddress={checkoutData.address}
              onSelectAddress={(address) => updateCheckoutData({ address })}
              onNext={nextStep}
            />
          )}

          {currentStep === "payment" && (
            <PaymentMethodStep
              selectedPaymentMethod={checkoutData.paymentMethod}
              onSelectPaymentMethod={(method) => updateCheckoutData({ paymentMethod: method })}
              onNext={nextStep}
              onBack={previousStep}
            />
          )}

          {currentStep === "review" && (
            <OrderReviewStep
              address={checkoutData.address}
              paymentMethod={checkoutData.paymentMethod}
              cartItems={cartItems}
              totalAmount={totalAmount}
              notes={checkoutData.notes}
              onNotesChange={(notes) => updateCheckoutData({ notes })}
              onPlaceOrder={handlePlaceOrder}
              onBack={previousStep}
              isPlacingOrder={isPlacingOrder}
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default Checkout;
