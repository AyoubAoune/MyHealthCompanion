
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
        date: log.date, // This is 'yyyy-MM-dd' string
        // Ensure weight is a number, parsing if it's a string
        weight: typeof log.weight === 'string' ? parseFloat(log.weight) : log.weight, 
      }))
      .filter(log => {
        let dateObj;
        try {
            // Ensure parseDate is robust or handle its potential errors
            dateObj = parseDate(log.date);
        } catch (e) {
            // console.warn(`[WeightTrendChartClient] Invalid date string encountered during parseDate: ${log.date}`, e);
            return false;
        }
        // Check if date parsing was successful and it's a valid date
        const dateValid = dateObj && !isNaN(dateObj.getTime());
        // Check if weight is a valid, finite number
        const weightValid = typeof log.weight === 'number' && !isNaN(log.weight) && isFinite(log.weight);
        
        if (!dateValid) {
            // console.warn(`[WeightTrendChartClient] Filtered out log due to invalid date object for: ${log.date}`);
        }
        if (!weightValid) {
            // console.warn(`[WeightTrendChartClient] Filtered out log due to invalid weight: ${JSON.stringify(log)}`);
        }
        return dateValid && weightValid;
      })
      .sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());
      
    // console.log("[WeightTrendChartClient] Computed chartData:", JSON.stringify(processedData));
    return processedData;
  }, [weightLogs]);

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
          left: -10, // Adjusted to prevent Y-axis labels from being cut off
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
              // console.warn(`[WeightTrendChartClient] Error formatting date for XAxis tick: ${value}`, e);
              return value; // Fallback to raw value
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
          // domain={['dataMin - 2', 'dataMax + 2']} // Keeping domain auto for now
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
