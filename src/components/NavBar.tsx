import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { Moon, Sun, User, LogOut, Package, ShoppingBag, Store } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { CartIcon } from "@/components/customer/CartIcon";
import { useProfile } from "@/hooks/useProfile";
import { NotificationBell } from "@/components/NotificationBell";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const NavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const queryClient = useQueryClient();

  // Fetch pending B2B orders count for retailers
  const { data: retailerPendingCount } = useQuery({
    queryKey: ["retailer-pending-count", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("buyer_id", user?.id)
        .eq("order_type", "retailer_to_wholesaler")
        .eq("status", "pending");

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user && profile?.role === "retailer",
  });

  // Fetch pending B2B orders count for wholesalers
  const { data: wholesalerPendingCount } = useQuery({
    queryKey: ["wholesaler-pending-count", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("seller_id", user?.id)
        .eq("order_type", "retailer_to_wholesaler")
        .eq("status", "pending");

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user && profile?.role === "wholesaler",
  });

  // Real-time subscription for order updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `order_type=eq.retailer_to_wholesaler`,
        },
        () => {
          // Invalidate queries when orders change
          queryClient.invalidateQueries({ queryKey: ["retailer-pending-count"] });
          queryClient.invalidateQueries({ queryKey: ["wholesaler-pending-count"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  useEffect(() => {
    // Check for saved theme preference or default to dark
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else {
      // Default to dark mode
      setTheme("dark");
      localStorage.setItem("theme", "dark");
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth/login");
  };

  const isAuthPage = location.pathname.startsWith("/auth");

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 
          className="text-2xl font-bold text-primary cursor-pointer" 
          onClick={() => navigate('/')}
        >
          SmartMartX
        </h1>
        
        {/* Navigation Links */}
        {user && (
          <nav className="hidden md:flex items-center gap-1">
            {profile?.role === "customer" && (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/customer/dashboard")}
                  className={location.pathname === "/customer/dashboard" ? "bg-accent" : ""}
                >
                  <Store className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/customer/retailers")}
                  className={location.pathname === "/customer/retailers" ? "bg-accent" : ""}
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Retailers
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/customer/orders")}
                  className={location.pathname === "/customer/orders" ? "bg-accent" : ""}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Orders
                </Button>
              </>
            )}

            {profile?.role === "retailer" && (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/retailer/dashboard")}
                  className={location.pathname === "/retailer/dashboard" ? "bg-accent" : ""}
                >
                  <Store className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/retailer/products")}
                  className={location.pathname === "/retailer/products" ? "bg-accent" : ""}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Products
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/retailer/pending-products")}
                  className={`relative ${location.pathname === "/retailer/pending-products" ? "bg-accent" : ""}`}
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Pending Requests
                  {retailerPendingCount && retailerPendingCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {retailerPendingCount}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/retailer/wholesalers")}
                  className={location.pathname === "/retailer/wholesalers" ? "bg-accent" : ""}
                >
                  <Store className="h-4 w-4 mr-2" />
                  Wholesalers
                </Button>
              </>
            )}

            {profile?.role === "wholesaler" && (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/wholesaler/dashboard")}
                  className={location.pathname === "/wholesaler/dashboard" ? "bg-accent" : ""}
                >
                  <Store className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/wholesaler/products")}
                  className={location.pathname === "/wholesaler/products" ? "bg-accent" : ""}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Products
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/wholesaler/orders")}
                  className={`relative ${location.pathname.startsWith("/wholesaler/order") ? "bg-accent" : ""}`}
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Orders
                  {wholesalerPendingCount && wholesalerPendingCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {wholesalerPendingCount}
                    </Badge>
                  )}
                </Button>
              </>
            )}
          </nav>
        )}

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>
          {user ? (
            <div className="flex items-center gap-2">
              {profile?.role === "customer" && <CartIcon />}
              <NotificationBell />
              <Button variant="ghost" size="icon" onClick={() => {
                if (profile?.role === "customer") navigate("/customer/profile");
                else if (profile?.role === "retailer") navigate("/retailer/profile");
                else if (profile?.role === "wholesaler") navigate("/wholesaler/profile");
              }}>
                <User className="h-5 w-5" />
              </Button>
              <Button variant="ghost" onClick={handleSignOut}>
                <LogOut className="h-5 w-5 mr-2" />
                Sign Out
              </Button>
            </div>
          ) : (
            <>
              {isAuthPage ? (
                <>
                  {location.pathname === "/auth/login" ? (
                    <Button onClick={() => navigate('/auth/register')}>
                      Sign Up
                    </Button>
                  ) : (
                    <Button variant="ghost" onClick={() => navigate('/auth/login')}>
                      Login
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => navigate('/auth/login')}>
                    Login
                  </Button>
                  <Button onClick={() => navigate('/auth/register')}>
                    Sign Up
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};
