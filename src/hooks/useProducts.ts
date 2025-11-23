import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useProducts = (category?: string) => {
  return useQuery({
    queryKey: ["products", category],
    queryFn: async () => {
      let query = supabase.from("products").select("*");

      if (category && category !== "all") {
        query = query.eq("category", category as any);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};
