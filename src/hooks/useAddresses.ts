import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export interface Address {
  id: string;
  user_id: string;
  label: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  latitude?: number;
  longitude?: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export const useAddresses = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  const { data: addresses, isLoading } = useQuery({
    queryKey: ["addresses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_addresses")
        .select("*")
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Address[];
    },
  });

  // Auto-migrate existing users: if no addresses but profile has default_address, create it
  useEffect(() => {
    const migrateDefaultAddress = async () => {
      if (addresses?.length === 0 && profile?.default_address) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from("customer_addresses").insert({
          user_id: user.id,
          label: 'Home',
          address_line1: profile.default_address,
          city: profile.city || '',
          state: profile.state || '',
          postal_code: profile.postal_code || '',
          country: profile.country || 'India',
          latitude: profile.default_latitude,
          longitude: profile.default_longitude,
          is_default: true
        });

        if (!error) {
          queryClient.invalidateQueries({ queryKey: ["addresses"] });
        }
      }
    };

    migrateDefaultAddress();
  }, [addresses, profile, queryClient]);

  const createAddress = useMutation({
    mutationFn: async (address: Omit<Address, "id" | "user_id" | "created_at" | "updated_at">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // If this is set as default, unset other defaults first
      if (address.is_default) {
        await supabase
          .from("customer_addresses")
          .update({ is_default: false })
          .eq("user_id", user.id);
      }

      const { error } = await supabase.from("customer_addresses").insert({
        ...address,
        user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Address added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add address");
      console.error(error);
    },
  });

  const updateAddress = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Address> & { id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // If this is set as default, unset other defaults first
      if (updates.is_default) {
        await supabase
          .from("customer_addresses")
          .update({ is_default: false })
          .eq("user_id", user.id)
          .neq("id", id);
      }

      const { error } = await supabase
        .from("customer_addresses")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Address updated successfully");
    },
    onError: () => {
      toast.error("Failed to update address");
    },
  });

  const deleteAddress = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("customer_addresses")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Address deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete address");
    },
  });

  return {
    addresses,
    isLoading,
    createAddress,
    updateAddress,
    deleteAddress,
    defaultAddress: addresses?.find(a => a.is_default),
  };
};
