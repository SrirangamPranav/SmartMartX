import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { ProductCard } from "@/components/customer/ProductCard";
import { CategoryTabs } from "@/components/shared/CategoryTabs";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search } from "lucide-react";

const RetailerProducts = () => {
  const { retailerId } = useParams();
  const navigate = useNavigate();
  const { loading: authLoading } = useRequireAuth("customer");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: retailer } = useQuery({
    queryKey: ["retailer", retailerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("retailers")
        .select("*")
        .eq("id", retailerId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!retailerId,
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["retailer-products", retailerId, selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from("retailer_products")
        .select("*, products(*), retailers(user_id)")
        .eq("retailer_id", retailerId)
        .eq("is_available", true);

      if (selectedCategory !== "all") {
        query = query.eq("products.category", selectedCategory as any);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data?.filter((item) => item.products !== null) || [];
    },
    enabled: !!retailerId,
  });

  const filteredProducts = products?.filter((product) =>
    product.products.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="h-10 w-64 mb-6" />
        <Skeleton className="h-12 w-full mb-6" />
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
          <Button variant="ghost" size="icon" onClick={() => navigate("/customer/retailers")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{retailer?.business_name}</h1>
            <p className="text-muted-foreground">{retailer?.business_address}</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="mb-6">
          <CategoryTabs selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
        </div>

        {filteredProducts && filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No Products Found"
            description="This retailer doesn't have any products available in this category."
          />
        )}
      </div>
    </div>
  );
};

export default RetailerProducts;
