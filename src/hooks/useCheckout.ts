import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import type { Address } from "./useAddresses";
import type { PaymentMethod } from "./usePaymentMethods";

export type CheckoutStep = "address" | "payment" | "review";

export interface CheckoutData {
  address?: Address;
  paymentMethod?: PaymentMethod | { method_type: string };
  notes?: string;
}

export const useCheckout = () => {
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("address");
  const [checkoutData, setCheckoutData] = useState<CheckoutData>({});
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const processPayment = async (
    orderId: string,
    amount: number,
    paymentMethod: PaymentMethod | { method_type: string }
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Generate transaction ID
    const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create payment transaction
    const { error: paymentError } = await supabase
      .from("payment_transactions")
      .insert({
        transaction_id: transactionId,
        order_id: orderId,
        user_id: user.id,
        amount,
        payment_method_id: "id" in paymentMethod ? paymentMethod.id : null,
        payment_method_type: paymentMethod.method_type as any,
        status: "processing",
      });

    if (paymentError) throw paymentError;

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock payment gateway logic
    const isSuccess = Math.random() > 0.1; // 90% success rate

    if (isSuccess) {
      // Update payment status
      const { error: updateError } = await supabase
        .from("payment_transactions")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          gateway_response: {
            status: "success",
            message: "Payment processed successfully",
          },
        })
        .eq("transaction_id", transactionId);

      if (updateError) throw updateError;

      // Create notification
      await supabase.from("notifications").insert({
        user_id: user.id,
        type: "payment_success",
        title: "Payment Successful",
        message: `Your payment of ₹${amount} has been processed successfully.`,
        related_order_id: orderId,
      });

      return { success: true, transactionId };
    } else {
      // Payment failed
      const { error: updateError } = await supabase
        .from("payment_transactions")
        .update({
          status: "failed",
          failure_reason: "Payment declined by gateway",
          gateway_response: {
            status: "failed",
            message: "Insufficient funds or card declined",
          },
        })
        .eq("transaction_id", transactionId);

      if (updateError) throw updateError;

      // Create notification
      await supabase.from("notifications").insert({
        user_id: user.id,
        type: "payment_failed",
        title: "Payment Failed",
        message: `Your payment of ₹${amount} could not be processed. Please try again.`,
        related_order_id: orderId,
      });

      throw new Error("Payment declined by gateway");
    }
  };

  const placeOrder = useMutation({
    mutationFn: async ({
      cartItems,
      totalAmount,
    }: {
      cartItems: any[];
      totalAmount: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (!checkoutData.address || !checkoutData.paymentMethod) {
        throw new Error("Missing checkout data");
      }

      // Group items by seller
      const itemsBySeller = cartItems.reduce((acc: any, item: any) => {
        const sellerId = item.seller_id;
        if (!acc[sellerId]) {
          acc[sellerId] = [];
        }
        acc[sellerId].push(item);
        return acc;
      }, {});

      const orderIds: string[] = [];

      // Create orders for each seller
      for (const [sellerId, items] of Object.entries(itemsBySeller)) {
        const sellerTotal = (items as any[]).reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        // Generate order number
        const orderNumber = `ORD${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        // Create order
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert({
            order_number: orderNumber,
            buyer_id: user.id,
            seller_id: sellerId,
            order_type: "customer_to_retailer",
            total_amount: sellerTotal,
            delivery_address: `${checkoutData.address.address_line1}, ${checkoutData.address.city}, ${checkoutData.address.state} ${checkoutData.address.postal_code}`,
            delivery_latitude: checkoutData.address.latitude,
            delivery_longitude: checkoutData.address.longitude,
            notes: checkoutData.notes,
            status: "pending",
          })
          .select()
          .single();

        if (orderError) throw orderError;

        orderIds.push(order.id);

        // Create order items
        const orderItems = (items as any[]).map((item) => ({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.price,
          subtotal: item.price * item.quantity,
        }));

        const { error: itemsError } = await supabase
          .from("order_items")
          .insert(orderItems);

        if (itemsError) throw itemsError;

        // Process payment for this order
        try {
          await processPayment(order.id, sellerTotal, checkoutData.paymentMethod);
        } catch (paymentError) {
          // If payment fails, delete the order and items
          await supabase.from("order_items").delete().eq("order_id", order.id);
          await supabase.from("orders").delete().eq("id", order.id);
          throw paymentError;
        }

        // Create notification only after successful payment
        await supabase.from("notifications").insert({
          user_id: user.id,
          type: "order_placed",
          title: "Order Placed Successfully",
          message: `Your order #${orderNumber} has been placed successfully.`,
          related_order_id: order.id,
        });
      }

      // Clear cart
      await supabase.from("cart_items").delete().eq("user_id", user.id);

      return orderIds;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
      toast.success("Order placed successfully!");
      navigate("/customer/dashboard");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to place order");
    },
  });

  const updateCheckoutData = (data: Partial<CheckoutData>) => {
    setCheckoutData((prev) => ({ ...prev, ...data }));
  };

  const goToStep = (step: CheckoutStep) => {
    setCurrentStep(step);
  };

  const nextStep = () => {
    if (currentStep === "address") setCurrentStep("payment");
    else if (currentStep === "payment") setCurrentStep("review");
  };

  const previousStep = () => {
    if (currentStep === "review") setCurrentStep("payment");
    else if (currentStep === "payment") setCurrentStep("address");
  };

  return {
    currentStep,
    checkoutData,
    updateCheckoutData,
    goToStep,
    nextStep,
    previousStep,
    placeOrder,
    isPlacingOrder: placeOrder.isPending,
  };
};
