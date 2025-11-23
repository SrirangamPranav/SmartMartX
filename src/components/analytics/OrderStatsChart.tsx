import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { OrderStats } from "@/hooks/useOrderAnalytics";

interface OrderStatsChartProps {
  stats: OrderStats;
}

export const OrderStatsChart = ({ stats }: OrderStatsChartProps) => {
  const data = [
    { status: "Pending", count: stats.pending },
    { status: "Confirmed", count: stats.confirmed },
    { status: "Processing", count: stats.processing },
    { status: "Shipped", count: stats.shipped },
    { status: "Delivered", count: stats.delivered },
    { status: "Cancelled", count: stats.cancelled },
  ];

  const chartConfig = {
    count: {
      label: "Orders",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Status Distribution</CardTitle>
        <CardDescription>Breakdown of orders by current status</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="status" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
