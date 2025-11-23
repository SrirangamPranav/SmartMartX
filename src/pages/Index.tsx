import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { ShoppingCart, Store, Warehouse } from "lucide-react";
import { NavBar } from "@/components/NavBar";

const Index = () => {
  const navigate = useNavigate();
  const { user, roles, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && roles.length > 0) {
      // Redirect authenticated users to their dashboard
      if (roles.includes('customer')) {
        navigate('/customer/dashboard');
      } else if (roles.includes('retailer')) {
        navigate('/retailer/dashboard');
      } else if (roles.includes('wholesaler')) {
        navigate('/wholesaler/dashboard');
      }
    }
  }, [user, roles, loading, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <NavBar />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold mb-6 text-foreground">
          Connect. Trade. Grow.
        </h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Your local marketplace connecting customers, retailers, and wholesalers
          in one seamless platform.
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" onClick={() => navigate('/auth/register')}>
            Create Account
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/auth/login')}>
            Already have an account?
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12 text-foreground">
          Built for Everyone
        </h3>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <ShoppingCart className="w-12 h-12 mb-4 text-primary" />
            <h4 className="text-xl font-semibold mb-2">For Customers</h4>
            <p className="text-muted-foreground">
              Browse local retailers, place orders, and get products delivered
              to your doorstep with ease.
            </p>
          </div>
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <Store className="w-12 h-12 mb-4 text-primary" />
            <h4 className="text-xl font-semibold mb-2">For Retailers</h4>
            <p className="text-muted-foreground">
              Manage your inventory, reach local customers, and source products
              from trusted wholesalers.
            </p>
          </div>
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <Warehouse className="w-12 h-12 mb-4 text-primary" />
            <h4 className="text-xl font-semibold mb-2">For Wholesalers</h4>
            <p className="text-muted-foreground">
              Distribute your products to multiple retailers and expand your
              business reach effortlessly.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>&copy; 2025 SmartMartX. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
