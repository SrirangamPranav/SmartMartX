import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { CategoryTabs } from "@/components/shared/CategoryTabs";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StockBadge } from "@/components/shared/StockBadge";
import { LowStockWarning } from "@/components/shared/StockUpdateIndicator";
import { PriceDisplay } from "@/components/shared/PriceDisplay";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const CATEGORIES = ["electronics", "clothing", "food", "home", "beauty", "sports", "books", "toys", "other"];

const Products = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useRequireAuth("retailer");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const queryClient = useQueryClient();

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
    queryKey: ["my-retailer-products", retailer?.id, selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from("retailer_products")
        .select("*, products(*)")
        .eq("retailer_id", retailer?.id);

      if (selectedCategory !== "all") {
        query = query.eq("products.category", selectedCategory as any);
      }

      const { data, error } = await query;
      if (error) throw error;
      // Filter out any items where products is null
      return data?.filter((item) => item.products !== null) || [];
    },
    enabled: !!retailer,
  });

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    base_price: "",
    retail_price: "",
    stock_quantity: "",
  });

  const addProductMutation = useMutation({
    mutationFn: async (data: any) => {
      // First, create the product in the products table
      const { data: newProduct, error: productError } = await supabase
        .from("products")
        .insert({
          name: data.name,
          category: data.category,
          description: data.description,
          base_price: parseFloat(data.base_price),
        })
        .select()
        .single();

      if (productError) throw productError;

      // Then, add it to retailer_products
      const { error: retailerProductError } = await supabase
        .from("retailer_products")
        .insert({
          retailer_id: retailer?.id,
          product_id: newProduct.id,
          price: parseFloat(data.retail_price),
          stock_quantity: parseInt(data.stock_quantity),
          is_available: true,
        });

      if (retailerProductError) throw retailerProductError;
      return newProduct;
    },
    onSuccess: (newProduct) => {
      queryClient.invalidateQueries({ queryKey: ["my-retailer-products"] });
      queryClient.invalidateQueries({ queryKey: ["retailer-products-count"] });
      toast.success(`"${newProduct.name}" added successfully`);
      setIsAddDialogOpen(false);
      setFormData({
        name: "",
        category: "",
        description: "",
        base_price: "",
        retail_price: "",
        stock_quantity: "",
      });
    },
    onError: (error) => {
      toast.error("Failed to add product: " + error.message);
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      // Update retailer_products
      const { error } = await supabase
        .from("retailer_products")
        .update({
          price: parseFloat(data.retail_price),
          stock_quantity: parseInt(data.stock_quantity),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-retailer-products"] });
      toast.success("Product updated successfully");
      setEditingProduct(null);
    },
    onError: (error) => {
      toast.error("Failed to update product: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from("retailer_products")
        .delete()
        .eq("id", productId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-retailer-products"] });
      toast.success("Product removed from your store");
    },
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="h-10 w-64 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/retailer/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold text-foreground">My Products</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/retailer/wholesalers")}>
              Browse Wholesalers
            </Button>
            <Dialog open={isAddDialogOpen || !!editingProduct} onOpenChange={(open) => {
              if (open) {
                setIsAddDialogOpen(true);
              } else {
                setIsAddDialogOpen(false);
                setEditingProduct(null);
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingProduct ? "Edit Product" : "Create New Product"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Product Name *</Label>
                    <Input
                      placeholder="e.g., Premium Coffee Beans"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={!!editingProduct}
                    />
                  </div>
                  <div>
                    <Label>Category *</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(val) => setFormData({ ...formData, category: val })}
                      disabled={!!editingProduct}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Describe your product..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      disabled={!!editingProduct}
                    />
                  </div>
                  <div>
                    <Label>Base Price (₹) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.base_price}
                      onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                      disabled={!!editingProduct}
                    />
                  </div>
                  <div>
                    <Label>Retail Price (₹) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.retail_price}
                      onChange={(e) => setFormData({ ...formData, retail_price: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Stock Quantity *</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    />
                  </div>
                  <Button 
                    onClick={() => {
                      if (editingProduct) {
                        updateProductMutation.mutate({ id: editingProduct.id, data: formData });
                      } else {
                        addProductMutation.mutate(formData);
                      }
                    }} 
                    className="w-full"
                    disabled={
                      !formData.retail_price || 
                      !formData.stock_quantity ||
                      (editingProduct ? updateProductMutation.isPending : addProductMutation.isPending) ||
                      (!editingProduct && (!formData.name || !formData.category || !formData.base_price))
                    }
                  >
                    {editingProduct 
                      ? (updateProductMutation.isPending ? "Updating..." : "Update Product")
                      : (addProductMutation.isPending ? "Creating..." : "Create Product")
                    }
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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
                  <div className="space-y-3">
                    <div>
                      <PriceDisplay price={product.price} className="text-xl text-primary" />
                    </div>
                    
                    <div className="space-y-2">
                      <StockBadge 
                        stockQuantity={product.stock_quantity} 
                        isAvailable={product.is_available}
                        updatedAt={product.updated_at}
                        showIcon
                      />
                      <LowStockWarning stockQuantity={product.stock_quantity} threshold={10} />
                    </div>

                    <div className="mt-4 space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        setEditingProduct(product);
                        setFormData({
                          name: product.products.name,
                          category: product.products.category,
                          description: product.products.description || "",
                          base_price: product.products.base_price.toString(),
                          retail_price: product.price.toString(),
                          stock_quantity: product.stock_quantity.toString(),
                        });
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => deleteMutation.mutate(product.id)}
                    >
                      Remove
                    </Button>
                  </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No Products Yet"
            description="Browse wholesalers to add products to your store."
            actionLabel="Browse Wholesalers"
            onAction={() => navigate("/retailer/wholesalers")}
          />
        )}
      </div>
    </div>
  );
};

export default Products;
