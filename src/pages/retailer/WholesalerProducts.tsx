import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuth } from "@/contexts/AuthContext";
import { CategoryTabs } from "@/components/shared/CategoryTabs";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StockBadge } from "@/components/shared/StockBadge";
import { PriceDisplay } from "@/components/shared/PriceDisplay";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";

const WholesalerProducts = () => {
  const { wholesalerId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useRequireAuth("retailer");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [retailPrice, setRetailPrice] = useState("");
  const [stockQty, setStockQty] = useState("");
  const queryClient = useQueryClient();

  const { data: wholesaler } = useQuery({
    queryKey: ["wholesaler", wholesalerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wholesalers")
        .select("*")
        .eq("id", wholesalerId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: retailer } = useQuery({
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

  const { data: products, isLoading } = useQuery({
    queryKey: ["wholesaler-products", wholesalerId, selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from("wholesaler_products")
        .select("*, products(*)")
        .eq("wholesaler_id", wholesalerId)
        .eq("is_available", true);

      if (selectedCategory !== "all") {
        query = query.eq("products.category", selectedCategory as any);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data?.filter((item) => item.products !== null) || [];
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: { productId: string; price: number; stockQty: number; wholesalePrice: number; minOrderQty: number }) => {
      // Validation
      if (data.price <= data.wholesalePrice) {
        throw new Error("Retail price must be higher than wholesale price");
      }
      if (data.stockQty < data.minOrderQty) {
        throw new Error(`Minimum order quantity is ${data.minOrderQty} units`);
      }
      if (data.stockQty > selectedProduct?.stock_quantity) {
        throw new Error(`Maximum available quantity is ${selectedProduct?.stock_quantity}`);
      }

      // Create B2B order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          buyer_id: user?.id,
          seller_id: wholesaler?.user_id,
          order_type: "retailer_to_wholesaler",
          status: "pending",
          total_amount: data.wholesalePrice * data.stockQty,
          delivery_address: retailer?.business_address || "",
          notes: `Desired retail price: ₹${data.price.toFixed(2)}`,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order item
      const { error: itemError } = await supabase
        .from("order_items")
        .insert({
          order_id: order.id,
          product_id: data.productId,
          quantity: data.stockQty,
          unit_price: data.wholesalePrice,
          subtotal: data.wholesalePrice * data.stockQty,
        });

      if (itemError) throw itemError;

      // Create notification for wholesaler
      console.log("Creating order placement notification for wholesaler:", wholesaler?.user_id);
      const { error: notificationError } = await supabase.from("notifications").insert({
        user_id: wholesaler?.user_id,
        type: "order_placed",
        title: "New Product Request",
        message: `${retailer?.business_name} requested ${data.stockQty} units`,
        related_order_id: order.id,
      });

      if (notificationError) {
        console.error("Failed to create notification:", notificationError);
        // Don't fail the order, just log the error
      } else {
        console.log("Notification created successfully for order:", order.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["b2b-orders"] });
      toast.success("Product request sent to wholesaler for approval");
      setSelectedProduct(null);
      setRetailPrice("");
      setStockQty("");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to send product request");
    },
  });

  const handleRequestProduct = () => {
    if (!retailPrice || !stockQty) {
      toast.error("Please fill all fields");
      return;
    }

    const price = parseFloat(retailPrice);
    const qty = parseInt(stockQty);
    const wholesalePrice = selectedProduct.price;
    const minOrderQty = selectedProduct.minimum_order_quantity;

    if (isNaN(price) || isNaN(qty)) {
      toast.error("Please enter valid numbers");
      return;
    }

    if (price <= wholesalePrice) {
      toast.error(`Retail price must be higher than wholesale price (₹${wholesalePrice})`);
      return;
    }

    if (qty < minOrderQty) {
      toast.error(`Minimum order quantity is ${minOrderQty} units`);
      return;
    }

    if (qty > selectedProduct.stock_quantity) {
      toast.error(`Maximum available quantity is ${selectedProduct.stock_quantity}`);
      return;
    }

    createOrderMutation.mutate({
      productId: selectedProduct.product_id,
      price,
      stockQty: qty,
      wholesalePrice,
      minOrderQty,
    });
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="h-10 w-64 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/retailer/wholesalers")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{wholesaler?.business_name}</h1>
            <p className="text-muted-foreground">Request products from this wholesaler</p>
          </div>
        </div>

        <div className="mb-6">
          <CategoryTabs selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
        </div>

        {products && products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{product.products.name}</CardTitle>
                  <Badge className="w-fit">{product.products.category}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {product.products.description || "No description"}
                  </p>
                  <div className="mb-3">
                    <PriceDisplay price={product.price} className="text-xl text-primary" />
                    <p className="text-sm text-muted-foreground">Min Order: {product.minimum_order_quantity} units</p>
                  </div>
                  <StockBadge stockQuantity={product.stock_quantity} isAvailable={product.is_available} />
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        className="w-full mt-4"
                        onClick={() => setSelectedProduct(product)}
                        disabled={!product.is_available || product.stock_quantity === 0}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Request Product
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Request Product from Wholesaler</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="p-4 bg-muted rounded-lg">
                          <Label>Product</Label>
                          <p className="font-medium">{selectedProduct?.products.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Wholesale Price: ₹{selectedProduct?.price} per unit
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Available Stock: {selectedProduct?.stock_quantity} units
                          </p>
                          <p className="text-sm font-medium text-primary">
                            Minimum Order: {selectedProduct?.minimum_order_quantity} units
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="stock-qty">Request Quantity *</Label>
                          <Input
                            id="stock-qty"
                            type="number"
                            min={selectedProduct?.minimum_order_quantity}
                            max={selectedProduct?.stock_quantity}
                            value={stockQty}
                            onChange={(e) => setStockQty(e.target.value)}
                            placeholder={`Min ${selectedProduct?.minimum_order_quantity} units`}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Min: {selectedProduct?.minimum_order_quantity}, Max: {selectedProduct?.stock_quantity}
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="retail-price">Your Retail Price (₹) *</Label>
                          <Input
                            id="retail-price"
                            type="number"
                            step="0.01"
                            min={selectedProduct?.price}
                            value={retailPrice}
                            onChange={(e) => setRetailPrice(e.target.value)}
                            placeholder={`Must be higher than ₹${selectedProduct?.price}`}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Set the price you'll sell to customers
                          </p>
                        </div>
                        {retailPrice && stockQty && (
                          <div className="p-3 bg-primary/10 rounded-lg">
                            <p className="text-sm font-medium">Order Summary:</p>
                            <p className="text-sm text-muted-foreground">
                              Total Cost: ₹{(selectedProduct?.price * parseInt(stockQty || "0")).toFixed(2)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Potential Profit: ₹{((parseFloat(retailPrice || "0") - selectedProduct?.price) * parseInt(stockQty || "0")).toFixed(2)}
                            </p>
                          </div>
                        )}
                        <Button 
                          onClick={handleRequestProduct} 
                          className="w-full"
                          disabled={createOrderMutation.isPending}
                        >
                          {createOrderMutation.isPending ? "Sending Request..." : "Send Request to Wholesaler"}
                        </Button>
                        <p className="text-xs text-center text-muted-foreground">
                          The wholesaler will review and approve your request
                        </p>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No Products Available"
            description="This wholesaler doesn't have any products in this category."
          />
        )}
      </div>
    </div>
  );
};

export default WholesalerProducts;
