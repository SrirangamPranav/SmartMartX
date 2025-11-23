import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useCart = () => {
  const queryClient = useQueryClient();

  const { data: cartItems, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get cart items
      const { data: cartData, error: cartError } = await supabase
        .from("cart_items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (cartError) throw cartError;
      if (!cartData || cartData.length === 0) return [];

      // Get product details
      const productIds = cartData.map(item => item.product_id);
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("*")
        .in("id", productIds);

      if (productsError) throw productsError;

      // Get seller details (profiles)
      const sellerIds = cartData.map(item => item.seller_id);
      const { data: sellers, error: sellersError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", sellerIds);

      if (sellersError) throw sellersError;

      // Get retailer details
      const { data: retailers, error: retailersError } = await supabase
        .from("retailers")
        .select("id, user_id, business_name")
        .in("user_id", sellerIds);

      if (retailersError) throw retailersError;

      // Get retailer products for price and stock
      const { data: retailerProducts, error: rpError } = await supabase
        .from("retailer_products")
        .select("*")
        .in("product_id", productIds);

      if (rpError) throw rpError;

      // Combine all data
      return cartData.map(item => {
        const product = products?.find(p => p.id === item.product_id);
        const seller = sellers?.find(s => s.id === item.seller_id);
        const retailer = retailers?.find(r => r.user_id === item.seller_id);
        const retailerProduct = retailerProducts?.find(
          rp => rp.product_id === item.product_id && rp.retailer_id === retailer?.id
        );

        return {
          ...item,
          products: product,
          seller: seller,
          retailer: retailer,
          price: retailerProduct?.price || product?.base_price || 0,
          stock_quantity: retailerProduct?.stock_quantity || 0,
          is_available: retailerProduct?.is_available || false,
        };
      });
    },
  });

  const addToCart = useMutation({
    mutationFn: async ({
      productId,
      sellerId,
      quantity = 1,
    }: {
      productId: string;
      sellerId: string;
      quantity?: number;
    }) => {
      const { data: existingItem } = await supabase
        .from("cart_items")
        .select("*")
        .eq("product_id", productId)
        .eq("seller_id", sellerId)
        .single();

      if (existingItem) {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: existingItem.quantity + quantity })
          .eq("id", existingItem.id);
        if (error) throw error;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { error } = await supabase.from("cart_items").insert({
          user_id: user.id,
          product_id: productId,
          seller_id: sellerId,
          quantity,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
      toast.success("Added to cart");
    },
    onError: (error) => {
      toast.error("Failed to add to cart");
      console.error(error);
    },
  });

  const updateQuantity = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity })
        .eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
    },
    onError: () => {
      toast.error("Failed to update quantity");
    },
  });

  const removeFromCart = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from("cart_items").delete().eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
      toast.success("Removed from cart");
    },
    onError: () => {
      toast.error("Failed to remove item");
    },
  });

  const clearCart = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
      toast.success("Cart cleared");
    },
  });

  return {
    cartItems,
    isLoading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  };
};
