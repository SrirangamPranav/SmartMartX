import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartCount } from "@/hooks/useCartCount";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MiniCart } from "./MiniCart";
import { useState } from "react";

export const CartIcon = () => {
  const { data: cartCount } = useCartCount();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
        >
          <ShoppingCart className="h-5 w-5" />
          {cartCount && cartCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {cartCount > 99 ? "99+" : cartCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[380px] p-0 bg-card border-border shadow-lg" 
        align="end"
        sideOffset={8}
      >
        <MiniCart onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
};
