import { useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useOrders } from "@/hooks/useDeliveryTracking";
import { NavBar } from "@/components/NavBar";
import { CustomerOrderCard } from "@/components/customer/CustomerOrderCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/EmptyState";
import { Loader2, Package } from "lucide-react";

const CustomerOrders = () => {
  useRequireAuth("customer");
  const { orders, isLoading } = useOrders();
  const [activeTab, setActiveTab] = useState("all");

  const filteredOrders = orders?.filter((order) => {
    if (activeTab === "all") return true;
    return order.status === activeTab;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container mx-auto p-6">
        <h1 className="text-4xl font-bold mb-6">My Orders</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
            <TabsTrigger value="shipped">Shipped</TabsTrigger>
            <TabsTrigger value="delivered">Delivered</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {!filteredOrders || filteredOrders.length === 0 ? (
              <EmptyState
                icon={Package}
                title={`No ${activeTab !== "all" ? activeTab : ""} orders`}
                description={
                  activeTab === "all"
                    ? "You haven't placed any orders yet"
                    : `You don't have any ${activeTab} orders`
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOrders.map((order) => (
                  <CustomerOrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CustomerOrders;
