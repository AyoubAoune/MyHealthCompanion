
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
    const processedData = weightLogs
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
    return processedData;
  }, [weightLogs]);

  const yAxisDomain = React.useMemo(() => {
    if (chartData.length < 1) return ['auto', 'auto']; // Should be caught by the <2 check later, but for safety

    const values = chartData.map(d => d.weight as number);
    let dataMinVal = Math.min(...values);
    let dataMaxVal = Math.max(...values);

    if (dataMinVal === dataMaxVal) {
      // If all values are the same, add a small buffer
      return [dataMinVal - 1, dataMaxVal + 1];
    }

    // Calculate a buffer (e.g., 10% of range, or at least 2 units)
    const range = dataMaxVal - dataMinVal;
    const buffer = Math.max(range * 0.1, 2); // Ensure buffer is at least 2 kg

    return [Math.floor(dataMinVal - buffer), Math.ceil(dataMaxVal + buffer)];
  }, [chartData]);


  if (chartData.length < 2) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Log at least two valid weight entries on different dates to see the trend.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          (Received {weightLogs?.length || 0} log entry/entries. After filtering, {chartData.length} valid point(s) are available for the chart. Ensure weights are numbers and dates are valid.)
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
          tickFormatter={(value: string) => {
            try {
              return format(parseDate(value), "MMM d");
            } catch (e) {
              return value; 
            }
          }}
          allowDuplicatedCategory={false}
          minTickGap={20} 
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => `${value} kg`}
          domain={yAxisDomain as [number, number]}
          allowDataOverflow={false}
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

