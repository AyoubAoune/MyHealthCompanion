
"use client"

import type { WeightLog } from "./types";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { CartesianGrid, Line, LineChart as RechartsLineChart, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

interface WeightTrendChartClientProps {
  weightLogs: WeightLog[];
}

const chartConfig = {
  weight: {
    label: "Weight (kg)",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export function WeightTrendChartClient({ weightLogs }: WeightTrendChartClientProps) {
  if (weightLogs.length < 2) {
    return <p className="text-center text-muted-foreground py-8">Log at least two weight entries to see the trend.</p>;
  }

  const chartData = weightLogs
    .map(log => ({
      date: log.date, // Keep as string for XAxis formatting
      weight: log.weight,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
      <RechartsLineChart
        accessibilityLayer
        data={chartData}
        margin={{
          top: 5,
          right: 20,
          left: -10, // Adjust to show Y-axis labels
          bottom: 5,
        }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value: string) => format(new Date(value), "MMM d")}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          domain={['dataMin - 2', 'dataMax + 2']} // Add some padding to min/max
          tickFormatter={(value) => `${value} kg`}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="line" />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          dataKey="weight"
          type="monotone"
          stroke="var(--color-weight)"
          strokeWidth={2.5}
          dot={{
            fill: "var(--color-weight)",
            r: 4,
          }}
          activeDot={{
            r: 6,
          }}
        />
      </RechartsLineChart>
    </ChartContainer>
  );
}
