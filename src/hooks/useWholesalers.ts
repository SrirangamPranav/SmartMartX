import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useWholesalers = () => {
  return useQuery({
    queryKey: ["wholesalers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wholesalers")
        .select("*")
        .eq("is_active", true);

      if (error) throw error;
      return data;
    },
  });
};
