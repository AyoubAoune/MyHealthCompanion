
"use client"

import * as React from "react";
import type { BodyMeasurementLog } from "./types";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { CartesianGrid, Line, LineChart as RechartsLineChart, XAxis, YAxis } from "recharts";
import { format } from "date-fns";
import { parseDate } from "./date-utils";

interface WaistSizeTrendChartClientProps {
  bodyMeasurementLogs: BodyMeasurementLog[];
}

const chartConfig = {
  waistSize: {
    label: "Waist (cm)",
    color: "hsl(var(--chart-2))", // Using chart-2 color
  },
} satisfies ChartConfig;

export function WaistSizeTrendChartClient({ bodyMeasurementLogs }: WaistSizeTrendChartClientProps) {
  const chartData = React.useMemo(() => {
    if (!bodyMeasurementLogs || bodyMeasurementLogs.length === 0) return [];
    const processedData = bodyMeasurementLogs
      .filter(log => log.waistSizeCm !== null && log.waistSizeCm !== undefined && typeof log.waistSizeCm === 'number' && isFinite(log.waistSizeCm))
      .map(log => ({
        date: log.date, // This is 'yyyy-MM-dd' string
        waistSizeCm: log.waistSizeCm as number, // Already filtered for number
      }))
      .filter(log => {
        let dateObj;
        try {
            dateObj = parseDate(log.date);
        } catch (e) {
            // console.warn(`[WaistSizeTrendChartClient] Invalid date string encountered during parseDate: ${log.date}`, e);
            return false;
        }
        const dateValid = dateObj && !isNaN(dateObj.getTime());
        if (!dateValid) {
            // console.warn(`[WaistSizeTrendChartClient] Filtered out log due to invalid date object for: ${log.date}`);
        }
        return dateValid;
      })
      .sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());
      
    // console.log("[WaistSizeTrendChartClient] Computed chartData:", JSON.stringify(processedData));
    return processedData;
  }, [bodyMeasurementLogs]);

  if (chartData.length < 2) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Log at least two valid waist size entries on different dates to see the trend.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          (Received {bodyMeasurementLogs?.length || 0} log(s). After filtering, {chartData.length} valid point(s) are available for the chart. Ensure waist sizes are numbers and dates are valid.)
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
              // console.warn(`[WaistSizeTrendChartClient] Error formatting date for XAxis tick: ${value}`, e);
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
          tickFormatter={(value) => `${value} cm`}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="line" />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          dataKey="waistSizeCm"
          type="monotone"
          stroke="var(--color-waistSize)"
          strokeWidth={2.5}
          dot={{
            fill: "var(--color-waistSize)",
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
