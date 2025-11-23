import { useState } from "react";
import { useAddresses } from "@/hooks/useAddresses";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Plus, Check } from "lucide-react";
import { AddressManagement } from "../AddressManagement";
import type { Address } from "@/hooks/useAddresses";

interface AddressStepProps {
  selectedAddress?: Address;
  onSelectAddress: (address: Address) => void;
  onNext: () => void;
}

export const AddressStep = ({ selectedAddress, onSelectAddress, onNext }: AddressStepProps) => {
  const { addresses, isLoading } = useAddresses();
  const [showAddressForm, setShowAddressForm] = useState(false);

  const handleNext = () => {
    if (!selectedAddress) return;
    onNext();
  };

  if (showAddressForm) {
    return (
      <div>
        <Button
          variant="ghost"
          onClick={() => setShowAddressForm(false)}
          className="mb-4"
        >
          ← Back to addresses
        </Button>
        <AddressManagement />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Delivery Address</h2>
        <p className="text-muted-foreground">Select or add a delivery address</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {addresses?.map((address) => (
              <Card
                key={address.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedAddress?.id === address.id
                    ? "border-primary border-2 bg-primary/5"
                    : "border-border"
                }`}
                onClick={() => onSelectAddress(address)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{address.label}</h3>
                      {address.is_default && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {address.address_line1}
                      {address.address_line2 && `, ${address.address_line2}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {address.city}, {address.state} {address.postal_code}
                    </p>
                  </div>
                  {selectedAddress?.id === address.id && (
                    <div className="mt-1">
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={() => setShowAddressForm(true)}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Address
          </Button>
        </>
      )}

      <Button
        onClick={handleNext}
        disabled={!selectedAddress}
        className="w-full"
        size="lg"
      >
        Continue to Payment
      </Button>
    </div>
  );
};
