import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useProfile } from "@/hooks/useProfile";
import { AddressManagement } from "@/components/customer/AddressManagement";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { GooglePlacesAutocomplete } from "@/components/auth/GooglePlacesAutocomplete";
import { useState } from "react";

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useRequireAuth("customer");
  const { profile, isLoading, updateProfile, isUpdating } = useProfile();
  const [selectedLocation, setSelectedLocation] = useState<any>(null);

  const { register, handleSubmit, formState: { errors } } = useForm({
    values: {
      full_name: profile?.full_name || "",
      phone: profile?.phone || "",
    },
  });

  const onSubmit = (data: any) => {
    const updates = {
      full_name: data.full_name,
      phone: data.phone,
      ...(selectedLocation && {
        default_address: selectedLocation.address,
        default_latitude: selectedLocation.latitude,
        default_longitude: selectedLocation.longitude,
      }),
    };
    updateProfile(updates);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="h-10 w-64 mb-6" />
        <Skeleton className="h-96 w-full max-w-2xl mx-auto" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/customer/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user?.email} disabled />
              </div>

              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  {...register("full_name", { required: "Name is required" })}
                />
                {errors.full_name && (
                  <p className="text-sm text-destructive mt-1">{errors.full_name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" {...register("phone")} />
              </div>

              <div>
                <GooglePlacesAutocomplete
                  onLocationSelect={setSelectedLocation}
                  defaultValue={profile?.default_address || ""}
                  label="Default Delivery Address"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isUpdating}>
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <AddressManagement />
      </div>
    </div>
  );
};

export default Profile;
