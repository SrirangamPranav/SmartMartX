import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GooglePlacesAutocomplete } from '@/components/auth/GooglePlacesAutocomplete';
import { RoleSelector } from '@/components/auth/RoleSelector';
import { BusinessInfoForm } from '@/components/auth/BusinessInfoForm';
import { useAuth } from '@/contexts/AuthContext';

type Step = 'location' | 'phone' | 'role' | 'business';

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, loading, refreshProfile, roles } = useAuth();
  const [step, setStep] = useState<Step>('location');
  const [submitting, setSubmitting] = useState(false);

  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState<any>(null);
  const [role, setRole] = useState<'customer' | 'retailer' | 'wholesaler' | null>(null);
  const [businessInfo, setBusinessInfo] = useState<{
    businessName: string;
    businessAddress: string;
    businessLatitude?: number;
    businessLongitude?: number;
    deliveryRadius: number;
  }>({
    businessName: '',
    businessAddress: '',
    businessLatitude: undefined,
    businessLongitude: undefined,
    deliveryRadius: 5
  });

  useEffect(() => {
    // Wait for auth to finish loading before checking user
    if (!loading) {
      if (!user) {
        navigate('/auth/login');
      } else if (roles.length > 0) {
        // User already has a role, redirect to dashboard
        if (roles.includes('customer')) {
          navigate('/customer/dashboard');
        } else if (roles.includes('retailer')) {
          navigate('/retailer/dashboard');
        } else if (roles.includes('wholesaler')) {
          navigate('/wholesaler/dashboard');
        }
      }
    }
  }, [user, loading, roles, navigate]);

  const handleLocationNext = () => {
    if (!location) {
      toast.error('Please select your location');
      return;
    }
    setStep('phone');
  };

  const handlePhoneNext = () => {
    setStep('role');
  };

  const handleRoleNext = () => {
    if (!role) {
      toast.error('Please select a role');
      return;
    }

    if (role === 'customer') {
      handleFinalSubmit();
    } else {
      setStep('business');
    }
  };

  const handleFinalSubmit = async () => {
    if (!user) return;

    if (role !== 'customer' && (!businessInfo.businessName || !businessInfo.businessAddress)) {
      toast.error('Please fill in business information');
      return;
    }

    setSubmitting(true);

    try {
      const provider = user.app_metadata?.provider || 'google';

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          phone,
          auth_provider: provider === 'google' ? 'google' : 'facebook',
          default_latitude: location.latitude,
          default_longitude: location.longitude,
          default_address: location.address,
          city: location.city,
          state: location.state,
          postal_code: location.postalCode,
          country: location.country
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // For customers, create their default address in customer_addresses table
      if (role === 'customer') {
        const { error: addressError } = await supabase
          .from('customer_addresses')
          .insert({
            user_id: user.id,
            label: 'Home',
            address_line1: location.address,
            city: location.city,
            state: location.state,
            postal_code: location.postalCode,
            country: location.country || 'India',
            latitude: location.latitude,
            longitude: location.longitude,
            is_default: true
          });

        if (addressError) throw addressError;
      }

      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: user.id,
        role
      });

      if (roleError) throw roleError;

      if (role === 'retailer') {
        const { error: retailerError } = await supabase.from('retailers').insert({
          user_id: user.id,
          business_name: businessInfo.businessName,
          business_address: businessInfo.businessAddress,
          latitude: businessInfo.businessLatitude,
          longitude: businessInfo.businessLongitude,
          delivery_radius_km: businessInfo.deliveryRadius
        });

        if (retailerError) throw retailerError;
      } else if (role === 'wholesaler') {
        const { error: wholesalerError } = await supabase.from('wholesalers').insert({
          user_id: user.id,
          business_name: businessInfo.businessName,
          business_address: businessInfo.businessAddress,
          latitude: businessInfo.businessLatitude,
          longitude: businessInfo.businessLongitude
        });

        if (wholesalerError) throw wholesalerError;
      }

      await refreshProfile();
      toast.success('Profile completed successfully!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete profile');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete Your Profile</CardTitle>
          <CardDescription>Let's set up your account</CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'location' && (
            <div className="space-y-4">
              <GooglePlacesAutocomplete
                label="Your Location"
                placeholder="Search for your address..."
                onLocationSelect={setLocation}
              />
              <Button className="w-full" onClick={handleLocationNext}>
                Continue
              </Button>
            </div>
          )}

          {step === 'phone' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1234567890"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="w-full" onClick={() => setStep('location')}>
                  Back
                </Button>
                <Button className="w-full" onClick={handlePhoneNext}>
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 'role' && (
            <div className="space-y-4">
              <RoleSelector selectedRole={role} onRoleSelect={setRole} />
              <div className="flex gap-2">
                <Button variant="outline" className="w-full" onClick={() => setStep('phone')}>
                  Back
                </Button>
                <Button className="w-full" onClick={handleRoleNext}>
                  {role === 'customer' ? 'Complete' : 'Continue'}
                </Button>
              </div>
            </div>
          )}

          {step === 'business' && (
            <div className="space-y-4">
              <BusinessInfoForm
                businessInfo={businessInfo}
                onChange={setBusinessInfo}
                roleType={role as 'retailer' | 'wholesaler'}
              />
              <div className="flex gap-2">
                <Button variant="outline" className="w-full" onClick={() => setStep('role')}>
                  Back
                </Button>
                <Button className="w-full" onClick={handleFinalSubmit} disabled={submitting}>
                  {submitting ? 'Completing...' : 'Complete Profile'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
