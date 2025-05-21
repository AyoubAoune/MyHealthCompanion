
"use client"

import * as React from "react";
import type { WeightLog } from "./types";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { CartesianGrid, Line, LineChart as RechartsLineChart, XAxis, YAxis } from "recharts";
import { format } from "date-fns";
import { parseDate } from "./date-utils";

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
  const chartData = React.useMemo(() => {
    if (!weightLogs || weightLogs.length === 0) return [];
    return weightLogs
      .map(log => ({
        date: log.date,
        weight: typeof log.weight === 'string' ? parseFloat(log.weight) : log.weight, 
      }))
      .filter(log => {
        let dateObj;
        try {
            dateObj = parseDate(log.date);
        } catch (e) {
            return false;
        }
        const dateValid = dateObj && !isNaN(dateObj.getTime());
        const weightValid = typeof log.weight === 'number' && !isNaN(log.weight) && isFinite(log.weight);
        return dateValid && weightValid;
      })
      .sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());
  }, [weightLogs]);

  if (chartData.length < 2) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Log at least two valid weight entries on different dates to see the trend.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          (Received {weightLogs?.length || 0} log entry/entries. After filtering for valid dates and weights, {chartData.length} point(s) are available for the chart. Ensure weights are logged on at least two distinct, valid dates.)
        </p>
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
      <RechartsLineChart
        accessibilityLayer
        data={chartData}
        margin={{
          top: 5,
          right: 20,
          left: -10,
          bottom: 5,
        }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value: string) => format(parseDate(value), "MMM d")}
          allowDuplicatedCategory={false}
          minTickGap={20} // Add a minimum gap between ticks
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
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
