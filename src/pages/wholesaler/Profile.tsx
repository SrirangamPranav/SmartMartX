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
  const { user, loading: authLoading } = useRequireAuth("wholesaler");
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: wholesaler, isLoading } = useQuery({
    queryKey: ["wholesaler-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wholesalers")
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
      business_name: wholesaler?.business_name || "",
      minimum_order_value: wholesaler?.minimum_order_value || 0,
      is_active: wholesaler?.is_active ?? true,
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const updates = {
        business_name: data.business_name,
        minimum_order_value: data.minimum_order_value,
        is_active: data.is_active,
        ...(selectedLocation && {
          business_address: selectedLocation.address,
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
        }),
      };

      const { error } = await supabase
        .from("wholesalers")
        .update(updates)
        .eq("user_id", user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wholesaler-profile"] });
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
          <Button variant="ghost" size="icon" onClick={() => navigate("/wholesaler/dashboard")}>
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
                  defaultValue={wholesaler?.business_address || ""}
                  label="Business Address"
                />
              </div>

              <div>
                <Label htmlFor="minimum_order_value">Minimum Order Value (₹)</Label>
                <Input
                  id="minimum_order_value"
                  type="number"
                  step="0.01"
                  {...register("minimum_order_value")}
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
