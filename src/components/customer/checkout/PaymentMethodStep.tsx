import { useState } from "react";
import { usePaymentMethods, type PaymentMethod } from "@/hooks/usePaymentMethods";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, Smartphone, Building2, Banknote, Plus, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PaymentMethodStepProps {
  selectedPaymentMethod?: PaymentMethod | { method_type: string };
  onSelectPaymentMethod: (method: PaymentMethod | { method_type: string }) => void;
  onNext: () => void;
  onBack: () => void;
}

export const PaymentMethodStep = ({
  selectedPaymentMethod,
  onSelectPaymentMethod,
  onNext,
  onBack,
}: PaymentMethodStepProps) => {
  const { paymentMethods, isLoading } = usePaymentMethods();
  const [newMethodType, setNewMethodType] = useState<string>("");
  const [cardNumber, setCardNumber] = useState("");
  const [upiId, setUpiId] = useState("");

  const paymentTypeIcons = {
    card: CreditCard,
    upi: Smartphone,
    netbanking: Building2,
    cod: Banknote,
  };

  const handleNext = () => {
    if (!selectedPaymentMethod) return;
    onNext();
  };

  const handleNewMethodSelect = () => {
    if (newMethodType === "card" && cardNumber) {
      onSelectPaymentMethod({ method_type: "card" });
    } else if (newMethodType === "upi" && upiId) {
      onSelectPaymentMethod({ method_type: "upi" });
    } else if (newMethodType) {
      onSelectPaymentMethod({ method_type: newMethodType });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" onClick={onBack} className="mb-2">
          ← Back
        </Button>
        <h2 className="text-2xl font-bold text-foreground mb-2">Payment Method</h2>
        <p className="text-muted-foreground">Select or add a payment method</p>
      </div>

      <Alert>
        <AlertDescription>
          🧪 <strong>Test Mode:</strong> Use test card 4111 1111 1111 1111 or any UPI ID for testing.
          90% payments succeed, 10% fail randomly to simulate real scenarios.
        </AlertDescription>
      </Alert>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          {/* Saved Payment Methods */}
          {paymentMethods && paymentMethods.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Saved Methods</h3>
              {paymentMethods.map((method) => {
                const Icon = paymentTypeIcons[method.method_type as keyof typeof paymentTypeIcons];
                return (
                  <Card
                    key={method.id}
                    className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedPaymentMethod && "id" in selectedPaymentMethod && selectedPaymentMethod?.id === method.id
                        ? "border-primary border-2 bg-primary/5"
                        : "border-border"
                    }`}
                    onClick={() => onSelectPaymentMethod(method)}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <p className="font-medium text-foreground capitalize">
                          {method.method_type}
                        </p>
                        {method.card_last_four && (
                          <p className="text-sm text-muted-foreground">
                            {method.card_brand} •••• {method.card_last_four}
                          </p>
                        )}
                        {method.upi_id && (
                          <p className="text-sm text-muted-foreground">{method.upi_id}</p>
                        )}
                      </div>
                      {selectedPaymentMethod && "id" in selectedPaymentMethod && selectedPaymentMethod?.id === method.id && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Add New Payment Method */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">
              {paymentMethods && paymentMethods.length > 0 ? "Or Add New Method" : "Select Payment Method"}
            </h3>
            
            <RadioGroup value={newMethodType} onValueChange={setNewMethodType}>
              <div className="space-y-3">
                <Card className="p-4">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <span>Credit/Debit Card</span>
                    </Label>
                  </div>
                  {newMethodType === "card" && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input
                          id="cardNumber"
                          placeholder="4111 1111 1111 1111"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          maxLength={19}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Use 4111 1111 1111 1111 for testing
                        </p>
                      </div>
                    </div>
                  )}
                </Card>

                <Card className="p-4">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="upi" id="upi" />
                    <Label htmlFor="upi" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Smartphone className="h-5 w-5 text-primary" />
                      <span>UPI</span>
                    </Label>
                  </div>
                  {newMethodType === "upi" && (
                    <div className="mt-4">
                      <Label htmlFor="upiId">UPI ID</Label>
                      <Input
                        id="upiId"
                        placeholder="yourname@upi"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                      />
                    </div>
                  )}
                </Card>

                <Card className="p-4">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="netbanking" id="netbanking" />
                    <Label htmlFor="netbanking" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Building2 className="h-5 w-5 text-primary" />
                      <span>Net Banking</span>
                    </Label>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Banknote className="h-5 w-5 text-primary" />
                      <span>Cash on Delivery</span>
                    </Label>
                  </div>
                </Card>
              </div>
            </RadioGroup>
          </div>
        </>
      )}

      <Button
        onClick={() => {
          if (newMethodType) {
            handleNewMethodSelect();
          }
          handleNext();
        }}
        disabled={!selectedPaymentMethod && !newMethodType}
        className="w-full"
        size="lg"
      >
        Continue to Review
      </Button>
    </div>
  );
};
