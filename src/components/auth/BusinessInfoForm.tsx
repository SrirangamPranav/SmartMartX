import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GooglePlacesAutocomplete } from './GooglePlacesAutocomplete';

interface BusinessInfo {
  businessName: string;
  businessAddress: string;
  businessLatitude?: number;
  businessLongitude?: number;
  deliveryRadius: number;
}

interface BusinessInfoFormProps {
  businessInfo: BusinessInfo;
  onChange: (info: BusinessInfo) => void;
  roleType: 'retailer' | 'wholesaler';
}

export const BusinessInfoForm: React.FC<BusinessInfoFormProps> = ({
  businessInfo,
  onChange,
  roleType
}) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="businessName">Business Name</Label>
        <Input
          id="businessName"
          value={businessInfo.businessName}
          onChange={(e) => onChange({ ...businessInfo, businessName: e.target.value })}
          placeholder="Enter your business name"
        />
      </div>

      <GooglePlacesAutocomplete
        label="Business Address"
        placeholder="Search for your business address..."
        onLocationSelect={(location) => {
          onChange({
            ...businessInfo,
            businessAddress: location.address,
            businessLatitude: location.latitude,
            businessLongitude: location.longitude
          });
        }}
      />

      <div>
        <Label htmlFor="deliveryRadius">
          {roleType === 'retailer' ? 'Delivery Radius (km)' : 'Service Area Radius (km)'}
        </Label>
        <Input
          id="deliveryRadius"
          type="number"
          min="1"
          step="0.5"
          value={businessInfo.deliveryRadius}
          onChange={(e) => onChange({ ...businessInfo, deliveryRadius: parseFloat(e.target.value) })}
          placeholder="5"
        />
      </div>
    </div>
  );
};
