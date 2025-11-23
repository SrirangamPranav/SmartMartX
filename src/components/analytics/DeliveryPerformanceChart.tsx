import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { DeliveryStats } from "@/hooks/useDeliveryAnalytics";

interface DeliveryPerformanceChartProps {
  stats: DeliveryStats;
}

export const DeliveryPerformanceChart = ({ stats }: DeliveryPerformanceChartProps) => {
  const data = [
    { name: "Pending", value: stats.pending, color: "hsl(var(--muted))" },
    { name: "Confirmed", value: stats.confirmed, color: "hsl(var(--primary))" },
    { name: "Packed", value: stats.packed, color: "hsl(var(--accent))" },
    { name: "In Transit", value: stats.in_transit, color: "hsl(220, 70%, 50%)" },
    { name: "Out for Delivery", value: stats.out_for_delivery, color: "hsl(280, 70%, 50%)" },
    { name: "Delivered", value: stats.delivered, color: "hsl(120, 70%, 50%)" },
    { name: "Cancelled", value: stats.cancelled, color: "hsl(0, 70%, 50%)" },
  ].filter(item => item.value > 0);

  const chartConfig = {
    value: {
      label: "Deliveries",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery Performance</CardTitle>
        <CardDescription>Distribution of delivery statuses</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="hsl(var(--primary))"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
