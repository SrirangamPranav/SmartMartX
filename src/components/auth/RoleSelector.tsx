import React from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface RoleSelectorProps {
  selectedRole: 'customer' | 'retailer' | 'wholesaler' | null;
  onRoleSelect: (role: 'customer' | 'retailer' | 'wholesaler') => void;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({ selectedRole, onRoleSelect }) => {
  return (
    <div className="space-y-4">
      <Label className="text-base">Select Your Role</Label>
      <RadioGroup value={selectedRole || ''} onValueChange={(value) => onRoleSelect(value as any)}>
        <Card className="p-4 cursor-pointer hover:border-primary transition-colors">
          <div className="flex items-start space-x-3">
            <RadioGroupItem value="customer" id="customer" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="customer" className="cursor-pointer font-medium">Customer</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Browse and order products from local retailers
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 cursor-pointer hover:border-primary transition-colors">
          <div className="flex items-start space-x-3">
            <RadioGroupItem value="retailer" id="retailer" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="retailer" className="cursor-pointer font-medium">Retailer</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Sell products to customers and order from wholesalers
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 cursor-pointer hover:border-primary transition-colors">
          <div className="flex items-start space-x-3">
            <RadioGroupItem value="wholesaler" id="wholesaler" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="wholesaler" className="cursor-pointer font-medium">Wholesaler</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Supply products in bulk to retailers
              </p>
            </div>
          </div>
        </Card>
      </RadioGroup>
    </div>
  );
};
