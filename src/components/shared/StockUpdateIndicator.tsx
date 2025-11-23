import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StockUpdateIndicatorProps {
  currentStock: number;
  previousStock?: number;
  className?: string;
}

export const StockUpdateIndicator = ({ 
  currentStock, 
  previousStock,
  className 
}: StockUpdateIndicatorProps) => {
  if (previousStock === undefined || previousStock === currentStock) {
    return null;
  }

  const change = currentStock - previousStock;
  const isIncrease = change > 0;
  const isDecrease = change < 0;

  if (isIncrease) {
    return (
      <Badge 
        variant="outline" 
        className={cn(
          "flex items-center gap-1 border-green-500 text-green-600 bg-green-50 dark:bg-green-950/20 animate-fade-in",
          className
        )}
      >
        <TrendingUp className="h-3 w-3" />
        +{change} units added
      </Badge>
    );
  }

  if (isDecrease) {
    return (
      <Badge 
        variant="outline" 
        className={cn(
          "flex items-center gap-1 border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/20 animate-fade-in",
          className
        )}
      >
        <TrendingDown className="h-3 w-3" />
        {Math.abs(change)} units sold
      </Badge>
    );
  }

  return null;
};

interface LowStockWarningProps {
  stockQuantity: number;
  threshold?: number;
  className?: string;
}

export const LowStockWarning = ({ 
  stockQuantity, 
  threshold = 10,
  className 
}: LowStockWarningProps) => {
  if (stockQuantity >= threshold) {
    return null;
  }

  if (stockQuantity === 0) {
    return (
      <Badge 
        variant="destructive" 
        className={cn("flex items-center gap-1 animate-pulse", className)}
      >
        <AlertCircle className="h-3 w-3" />
        Out of Stock - Reorder Now
      </Badge>
    );
  }

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "flex items-center gap-1 border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20 animate-pulse",
        className
      )}
    >
      <AlertCircle className="h-3 w-3" />
      Low Stock - Only {stockQuantity} left
    </Badge>
  );
};
