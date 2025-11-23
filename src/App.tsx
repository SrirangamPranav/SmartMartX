import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import ResetPassword from "./pages/auth/ResetPassword";
import Onboarding from "./pages/Onboarding";
import CustomerDashboard from "./pages/customer/Dashboard";
import CustomerOrders from "./pages/customer/Orders";
import CustomerRetailers from "./pages/customer/Retailers";
import CustomerRetailerProducts from "./pages/customer/RetailerProducts";
import CustomerProductDetail from "./pages/customer/ProductDetail";
import CustomerProfile from "./pages/customer/Profile";
import CustomerCart from "./pages/customer/Cart";
import CustomerCheckout from "./pages/customer/Checkout";
import CustomerOrderTracking from "./pages/customer/OrderTracking";

import RetailerDashboard from "./pages/retailer/Dashboard";
import RetailerProducts from "./pages/retailer/Products";
import RetailerOrderManagement from "./pages/retailer/OrderManagement";
import RetailerOrders from "./pages/retailer/Orders";
import RetailerOrderDetail from "./pages/retailer/OrderDetail";
import RetailerWholesalers from "./pages/retailer/Wholesalers";
import RetailerWholesalerProducts from "./pages/retailer/WholesalerProducts";
import RetailerPendingProducts from "./pages/retailer/PendingProducts";
import RetailerProfile from "./pages/retailer/Profile";

import WholesalerDashboard from "./pages/wholesaler/Dashboard";
import WholesalerProducts from "./pages/wholesaler/Products";
import WholesalerOrders from "./pages/wholesaler/Orders";
import WholesalerOrderManagement from "./pages/wholesaler/OrderManagement";
import WholesalerProfile from "./pages/wholesaler/Profile";
import { useEffect } from "react";

const queryClient = new QueryClient();

// Initialize theme before app renders
const initTheme = () => {
  const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
  if (savedTheme) {
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
  } else {
    // Default to dark mode
    localStorage.setItem("theme", "dark");
    document.documentElement.classList.add("dark");
  }
};

// Run immediately
initTheme();

const App = () => {
  useEffect(() => {
    // Ensure theme persists on navigation
    initTheme();
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth/register" element={<Register />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/onboarding" element={<Onboarding />} />
            
            {/* Customer Routes */}
            <Route path="/customer/dashboard" element={<CustomerDashboard />} />
            <Route path="/customer/orders" element={<CustomerOrders />} />
            <Route path="/customer/retailers" element={<CustomerRetailers />} />
            <Route path="/customer/retailer/:retailerId/products" element={<CustomerRetailerProducts />} />
            <Route path="/customer/product/:productId" element={<CustomerProductDetail />} />
            <Route path="/customer/profile" element={<CustomerProfile />} />
            <Route path="/customer/cart" element={<CustomerCart />} />
            <Route path="/customer/checkout" element={<CustomerCheckout />} />
            <Route path="/customer/tracking/:orderId" element={<CustomerOrderTracking />} />
            
            {/* Retailer Routes */}
            <Route path="/retailer/dashboard" element={<RetailerDashboard />} />
            <Route path="/retailer/products" element={<RetailerProducts />} />
            <Route path="/retailer/order-management" element={<RetailerOrderManagement />} />
            <Route path="/retailer/orders" element={<RetailerOrders />} />
            <Route path="/retailer/order/:orderId" element={<RetailerOrderDetail />} />
            <Route path="/retailer/wholesalers" element={<RetailerWholesalers />} />
            <Route path="/retailer/wholesaler/:wholesalerId/products" element={<RetailerWholesalerProducts />} />
            <Route path="/retailer/pending-products" element={<RetailerPendingProducts />} />
            <Route path="/retailer/profile" element={<RetailerProfile />} />
            
            {/* Wholesaler Routes */}
            <Route path="/wholesaler/dashboard" element={<WholesalerDashboard />} />
            <Route path="/wholesaler/products" element={<WholesalerProducts />} />
            <Route path="/wholesaler/orders" element={<WholesalerOrders />} />
            <Route path="/wholesaler/order-management/:orderId" element={<WholesalerOrderManagement />} />
            <Route path="/wholesaler/profile" element={<WholesalerProfile />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
