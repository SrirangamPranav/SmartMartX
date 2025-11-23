import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NavBar } from '@/components/NavBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [authProvider, setAuthProvider] = useState<'email' | 'google' | 'facebook' | null>(null);
  const [emailChecked, setEmailChecked] = useState(false);

  const checkAuthProvider = async () => {
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('auth_provider')
        .eq('id', (await supabase.auth.getUser()).data.user?.id || '')
        .single();

      if (data?.auth_provider) {
        setAuthProvider(data.auth_provider as any);
      }
      setEmailChecked(true);
    } catch (error) {
      setEmailChecked(true);
      setAuthProvider('email');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      toast.success('Logged in successfully!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      // Use production URL for deployed site, or current origin for development
      const redirectUrl = window.location.hostname === 'localhost' 
        ? `${window.location.origin}/`
        : 'https://smartmartx.vercel.app/';
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: redirectUrl
        }
      });

      if (error) throw error;
      setOtpSent(true);
      toast.success('Check your email for the login link or code!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      });

      if (error) throw error;
      toast.success('Logged in successfully!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Invalid OTP');
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
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>Sign in to your SmartMartX account</CardDescription>
          </CardHeader>
        <CardContent>
          {!emailChecked ? (
            <div className="space-y-4">
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
              <Button className="w-full" onClick={checkAuthProvider} disabled={loading}>
                Continue
              </Button>

              <div className="relative">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                  OR
                </span>
              </div>

              <SocialAuthButtons mode="signin" />

              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Button variant="link" className="p-0" onClick={() => navigate('/auth/register')}>
                  Sign up
                </Button>
              </p>
            </div>
          ) : authProvider === 'google' || authProvider === 'facebook' ? (
            <div className="space-y-4">
              <p className="text-center text-sm">
                This account uses {authProvider === 'google' ? 'Google' : 'Facebook'} Sign-In
              </p>
              <SocialAuthButtons mode="signin" />
              <Button variant="outline" className="w-full" onClick={() => setEmailChecked(false)}>
                Back
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="password" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="password">Password</TabsTrigger>
                <TabsTrigger value="otp">OTP</TabsTrigger>
              </TabsList>

              <TabsContent value="password">
                <form onSubmit={handlePasswordLogin} className="space-y-4">
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
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign in'}
                  </Button>
                  <Button
                    variant="link"
                    className="w-full p-0 text-sm"
                    onClick={() => navigate('/auth/reset-password')}
                  >
                    Forgot Password?
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setEmailChecked(false)}
                  >
                    Back
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="otp">
                <div className="space-y-4">
                  {!otpSent ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        We'll send a 6-digit code to {email}
                      </p>
                      <Button className="w-full" onClick={handleSendOTP} disabled={loading}>
                        {loading ? 'Sending...' : 'Send OTP'}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setEmailChecked(false)}
                      >
                        Back
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label>Enter 6-digit code</Label>
                        <div className="flex justify-center">
                          <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                            <InputOTPGroup>
                              <InputOTPSlot index={0} />
                              <InputOTPSlot index={1} />
                              <InputOTPSlot index={2} />
                              <InputOTPSlot index={3} />
                              <InputOTPSlot index={4} />
                              <InputOTPSlot index={5} />
                            </InputOTPGroup>
                          </InputOTP>
                        </div>
                      </div>
                      <Button className="w-full" onClick={handleVerifyOTP} disabled={loading}>
                        {loading ? 'Verifying...' : 'Verify OTP'}
                      </Button>
                      <Button variant="outline" className="w-full" onClick={handleSendOTP}>
                        Resend OTP
                      </Button>
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
        </Card>
      </div>
    </div>
  );
}
