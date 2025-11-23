import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { GooglePlacesAutocomplete } from "@/components/auth/GooglePlacesAutocomplete";
import { useState } from "react";
import { toast } from "sonner";

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useRequireAuth("retailer");
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: retailer, isLoading } = useQuery({
    queryKey: ["retailer-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("retailers")
        .select("*")
        .eq("user_id", user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { register, handleSubmit, watch, setValue } = useForm({
    values: {
      business_name: retailer?.business_name || "",
      delivery_radius_km: retailer?.delivery_radius_km || 5,
      is_active: retailer?.is_active ?? true,
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const updates = {
        business_name: data.business_name,
        delivery_radius_km: data.delivery_radius_km,
        is_active: data.is_active,
        ...(selectedLocation && {
          business_address: selectedLocation.address,
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
        }),
      };

      const { error } = await supabase
        .from("retailers")
        .update(updates)
        .eq("user_id", user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["retailer-profile"] });
      toast.success("Profile updated successfully");
    },
  });

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
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/retailer/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Business Profile</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="space-y-4">
              <div>
                <Label htmlFor="business_name">Business Name</Label>
                <Input id="business_name" {...register("business_name", { required: true })} />
              </div>

              <div>
                <GooglePlacesAutocomplete
                  onLocationSelect={setSelectedLocation}
                  defaultValue={retailer?.business_address || ""}
                  label="Business Address"
                />
              </div>

              <div>
                <Label htmlFor="delivery_radius_km">Delivery Radius (km)</Label>
                <Input
                  id="delivery_radius_km"
                  type="number"
                  step="0.1"
                  {...register("delivery_radius_km")}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Business Active</Label>
                <Switch
                  id="is_active"
                  checked={watch("is_active")}
                  onCheckedChange={(checked) => setValue("is_active", checked)}
                />
              </div>

              <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
