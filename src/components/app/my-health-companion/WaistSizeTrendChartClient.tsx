
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
    color: "hsl(var(--chart-2))", 
  },
} satisfies ChartConfig;

export function WaistSizeTrendChartClient({ bodyMeasurementLogs }: WaistSizeTrendChartClientProps) {
  const chartData = React.useMemo(() => {
    if (!bodyMeasurementLogs || bodyMeasurementLogs.length === 0) return [];
    const processedData = bodyMeasurementLogs
      .filter(log => log.waistSizeCm !== null && log.waistSizeCm !== undefined && typeof log.waistSizeCm === 'number' && isFinite(log.waistSizeCm))
      .map(log => ({
        date: log.date, 
        waistSizeCm: log.waistSizeCm as number, 
      }))
      .filter(log => {
        let dateObj;
        try {
            dateObj = parseDate(log.date);
        } catch (e) {
            return false;
        }
        const dateValid = dateObj && !isNaN(dateObj.getTime());
        return dateValid;
      })
      .sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());
    return processedData;
  }, [bodyMeasurementLogs]);

  const yAxisDomain = React.useMemo(() => {
    if (chartData.length < 1) return ['auto', 'auto'];

    const values = chartData.map(d => d.waistSizeCm);
    let dataMinVal = Math.min(...values);
    let dataMaxVal = Math.max(...values);

    if (dataMinVal === dataMaxVal) {
      return [dataMinVal - 2, dataMaxVal + 2]; // Buffer for single value (e.g. 2cm)
    }

    const range = dataMaxVal - dataMinVal;
    const buffer = Math.max(range * 0.1, 2); // Ensure buffer is at least 2cm

    return [Math.floor(dataMinVal - buffer), Math.ceil(dataMaxVal + buffer)];
  }, [chartData]);

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
          domain={yAxisDomain as [number, number]}
          allowDataOverflow={false}
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
