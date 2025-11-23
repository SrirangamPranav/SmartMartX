import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { Package, TrendingDown, TrendingUp } from "lucide-react";

interface StockBadgeProps {
  stockQuantity: number;
  isAvailable?: boolean;
  updatedAt?: string;
  showIcon?: boolean;
  className?: string;
}

export const StockBadge = ({ 
  stockQuantity, 
  isAvailable = true, 
  updatedAt,
  showIcon = false,
  className = ""
}: StockBadgeProps) => {
  const getStockStatus = () => {
    if (!isAvailable || stockQuantity === 0) {
      return {
        variant: "destructive" as const,
        label: "Out of Stock",
        icon: <Package className="h-3 w-3" />,
        className: "border-red-500 text-red-600 bg-red-50 dark:bg-red-950/20"
      };
    }

    if (stockQuantity < 10) {
      return {
        variant: "outline" as const,
        label: `Low Stock (${stockQuantity})`,
        icon: <TrendingDown className="h-3 w-3" />,
        className: "border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20 animate-pulse"
      };
    }

    return {
      variant: "outline" as const,
      label: `In Stock (${stockQuantity})`,
      icon: <TrendingUp className="h-3 w-3" />,
      className: "border-green-500 text-green-600 bg-green-50 dark:bg-green-950/20"
    };
  };

  const status = getStockStatus();
  
  const badge = (
    <Badge 
      variant={status.variant} 
      className={`flex items-center gap-1 ${status.className} ${className}`}
    >
      {showIcon && status.icon}
      {status.label}
    </Badge>
  );

  if (updatedAt) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              Last updated: {format(new Date(updatedAt), "PPp")}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
};
