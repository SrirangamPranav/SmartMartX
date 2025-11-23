import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type PaymentMethodType = "card" | "upi" | "netbanking" | "cod";

export interface PaymentMethod {
  id: string;
  user_id: string;
  method_type: PaymentMethodType;
  card_last_four?: string;
  card_brand?: string;
  upi_id?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export const usePaymentMethods = () => {
  const queryClient = useQueryClient();

  const { data: paymentMethods, isLoading } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PaymentMethod[];
    },
  });

  const addPaymentMethod = useMutation({
    mutationFn: async (method: Omit<PaymentMethod, "id" | "user_id" | "created_at" | "updated_at">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (method.is_default) {
        await supabase
          .from("payment_methods")
          .update({ is_default: false })
          .eq("user_id", user.id);
      }

      const { error } = await supabase.from("payment_methods").insert({
        ...method,
        user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      toast.success("Payment method added successfully");
    },
    onError: () => {
      toast.error("Failed to add payment method");
    },
  });

  const updatePaymentMethod = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PaymentMethod> & { id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (updates.is_default) {
        await supabase
          .from("payment_methods")
          .update({ is_default: false })
          .eq("user_id", user.id)
          .neq("id", id);
      }

      const { error } = await supabase
        .from("payment_methods")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      toast.success("Payment method updated successfully");
    },
    onError: () => {
      toast.error("Failed to update payment method");
    },
  });

  const deletePaymentMethod = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("payment_methods")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      toast.success("Payment method deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete payment method");
    },
  });

  return {
    paymentMethods,
    isLoading,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    defaultPaymentMethod: paymentMethods?.find(pm => pm.is_default),
  };
};
