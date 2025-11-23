import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MapPin, CreditCard, Package } from "lucide-react";
import { PriceDisplay } from "@/components/shared/PriceDisplay";
import type { Address } from "@/hooks/useAddresses";
import type { PaymentMethod } from "@/hooks/usePaymentMethods";

interface OrderReviewStepProps {
  address?: Address;
  paymentMethod?: PaymentMethod | { method_type: string };
  cartItems: any[];
  totalAmount: number;
  notes?: string;
  onNotesChange: (notes: string) => void;
  onPlaceOrder: () => void;
  onBack: () => void;
  isPlacingOrder: boolean;
}

export const OrderReviewStep = ({
  address,
  paymentMethod,
  cartItems,
  totalAmount,
  notes,
  onNotesChange,
  onPlaceOrder,
  onBack,
  isPlacingOrder,
}: OrderReviewStepProps) => {
  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" onClick={onBack} className="mb-2">
          ← Back
        </Button>
        <h2 className="text-2xl font-bold text-foreground mb-2">Review Order</h2>
        <p className="text-muted-foreground">Review your order details before placing</p>
      </div>

      {/* Delivery Address */}
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-primary mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-2">Delivery Address</h3>
            {address && (
              <>
                <p className="font-medium text-foreground">{address.label}</p>
                <p className="text-sm text-muted-foreground">
                  {address.address_line1}
                  {address.address_line2 && `, ${address.address_line2}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {address.city}, {address.state} {address.postal_code}
                </p>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Payment Method */}
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <CreditCard className="h-5 w-5 text-primary mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-2">Payment Method</h3>
            {paymentMethod && (
              <>
                <p className="font-medium text-foreground capitalize">
                  {paymentMethod.method_type}
                </p>
                {"card_last_four" in paymentMethod && paymentMethod.card_last_four && (
                  <p className="text-sm text-muted-foreground">
                    {paymentMethod.card_brand} •••• {paymentMethod.card_last_four}
                  </p>
                )}
                {"upi_id" in paymentMethod && paymentMethod.upi_id && (
                  <p className="text-sm text-muted-foreground">{paymentMethod.upi_id}</p>
                )}
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Order Items */}
      <Card className="p-4">
        <div className="flex items-start gap-3 mb-4">
          <Package className="h-5 w-5 text-primary mt-0.5" />
          <h3 className="font-semibold text-foreground">Order Items ({cartItems.length})</h3>
        </div>
        <div className="space-y-3">
          {cartItems.map((item) => (
            <div key={item.id} className="flex gap-3 pb-3 border-b border-border last:border-0">
              <div className="flex-1">
                <p className="font-medium text-foreground">{item.products?.name}</p>
                <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
              </div>
              <div className="text-right">
                <PriceDisplay price={item.price * item.quantity} />
              </div>
            </div>
          ))}
        </div>
        <Separator className="my-4" />
        <div className="flex justify-between items-center">
          <span className="font-semibold text-foreground">Total Amount:</span>
          <PriceDisplay price={totalAmount} className="text-xl font-bold" />
        </div>
      </Card>

      {/* Order Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Order Notes (Optional)</Label>
        <Textarea
          id="notes"
          placeholder="Any special instructions for delivery..."
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={3}
        />
      </div>

      <Button
        onClick={onPlaceOrder}
        disabled={isPlacingOrder}
        className="w-full"
        size="lg"
      >
        {isPlacingOrder ? "Placing Order..." : "Place Order"}
      </Button>
    </div>
  );
};
