import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NavBar } from '@/components/NavBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GooglePlacesAutocomplete } from '@/components/auth/GooglePlacesAutocomplete';
import { RoleSelector } from '@/components/auth/RoleSelector';
import { BusinessInfoForm } from '@/components/auth/BusinessInfoForm';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';

type Step = 'credentials' | 'location' | 'role' | 'business';

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('credentials');
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
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

  const handleEmailRegister = async () => {
    if (!email || !password || !fullName) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setStep('location');
  };

  const handleLocationNext = () => {
    if (!location) {
      toast.error('Please select your location');
      return;
    }
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
    if (role !== 'customer' && (!businessInfo.businessName || !businessInfo.businessAddress)) {
      toast.error('Please fill in business information');
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      // Update the profile created by the trigger with additional information
      const { error: profileError } = await supabase.from('profiles')
        .update({
          full_name: fullName,
          phone,
          default_latitude: location.latitude,
          default_longitude: location.longitude,
          default_address: location.address,
          city: location.city,
          state: location.state,
          postal_code: location.postalCode,
          country: location.country
        })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: authData.user.id,
        role
      });

      if (roleError) throw roleError;

      if (role === 'retailer') {
        const { error: retailerError } = await supabase.from('retailers').insert({
          user_id: authData.user.id,
          business_name: businessInfo.businessName,
          business_address: businessInfo.businessAddress,
          latitude: businessInfo.businessLatitude,
          longitude: businessInfo.businessLongitude,
          delivery_radius_km: businessInfo.deliveryRadius
        });

        if (retailerError) throw retailerError;
      } else if (role === 'wholesaler') {
        const { error: wholesalerError } = await supabase.from('wholesalers').insert({
          user_id: authData.user.id,
          business_name: businessInfo.businessName,
          business_address: businessInfo.businessAddress,
          latitude: businessInfo.businessLatitude,
          longitude: businessInfo.businessLongitude
        });

        if (wholesalerError) throw wholesalerError;
      }

      toast.success('Account created successfully!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="flex items-center justify-center p-4 pt-20">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Create an Account</CardTitle>
            <CardDescription>Join SmartMartX to start trading</CardDescription>
          </CardHeader>
        <CardContent>
          {step === 'credentials' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1234567890"
                />
              </div>

              <Button className="w-full" onClick={handleEmailRegister}>
                Continue
              </Button>

              <div className="relative">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                  OR
                </span>
              </div>

              <SocialAuthButtons mode="signup" />

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Button variant="link" className="p-0" onClick={() => navigate('/auth/login')}>
                  Sign in
                </Button>
              </p>
            </div>
          )}

          {step === 'location' && (
            <div className="space-y-4">
              <GooglePlacesAutocomplete
                label="Your Location"
                placeholder="Search for your address..."
                onLocationSelect={setLocation}
              />
              <div className="flex gap-2">
                <Button variant="outline" className="w-full" onClick={() => setStep('credentials')}>
                  Back
                </Button>
                <Button className="w-full" onClick={handleLocationNext}>
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 'role' && (
            <div className="space-y-4">
              <RoleSelector selectedRole={role} onRoleSelect={setRole} />
              <div className="flex gap-2">
                <Button variant="outline" className="w-full" onClick={() => setStep('location')}>
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
                <Button className="w-full" onClick={handleFinalSubmit} disabled={loading}>
                  {loading ? 'Creating Account...' : 'Complete Registration'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        </Card>
      </div>
    </div>
  );
}
