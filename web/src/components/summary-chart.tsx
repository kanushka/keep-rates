"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CombinedRate } from "@/types";

const chartConfig = {
  rate: {
    label: "Commercial Bank Rate",
    color: "hsl(var(--chart-1))",
  },
  cbslRate: {
    label: "Central Bank Rate",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

interface SummaryChartProps {
  chartData: CombinedRate[];
  onTimeRangeChange: (range: string) => void;
}

export function SummaryChart({
  chartData,
  onTimeRangeChange,
}: SummaryChartProps) {
  const [timeRange, setTimeRange] = React.useState("30d");

  const getTimeRangeText = (range: string) => {
    switch (range) {
      case "7d":
        return "7 days";
      case "30d":
        return "30 days";
      default:
        return "3 months";
    }
  };

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
    onTimeRangeChange(range);
  };

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date);
    let daysToSubtract = 90;
    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "7d") {
      daysToSubtract = 7;
    }
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysToSubtract);
    return date >= startDate;
  });

  // Calculate min and max considering both commercial bank and CBSL rates
  const allRates = filteredData.flatMap((item) => {
    const rates = [item.rate];
    if (item.cbslRate !== undefined) {
      rates.push(item.cbslRate);
    }
    return rates;
  });

  const minRate = Math.min(...allRates);
  const maxRate = Math.max(...allRates);
  const padding = (maxRate - minRate) * 0.1;
  const yAxisDomain = [minRate - padding, maxRate + padding];

  return (
    <Card>
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>Exchange Rates Per Day</CardTitle>
          <CardDescription>
            Showing maximum rates per day for the last{" "}
            {getTimeRangeText(timeRange)}
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={handleTimeRangeChange}>
          <SelectTrigger
            className="w-[160px] rounded-lg sm:ml-auto"
            aria-label="Select a value"
          >
            <SelectValue placeholder="Last 3 months" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="90d" className="rounded-lg">
              Last 3 months
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Last 30 days
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              Last 7 days
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart
            data={filteredData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillRate" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="hsl(var(--chart-1))"
                  stopOpacity={0.8}
                />
                <stop
                  offset="100%"
                  stopColor="hsl(var(--chart-1))"
                  stopOpacity={0.0}
                />
              </linearGradient>
              <linearGradient id="fillCBSLRate" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="hsl(var(--chart-2))"
                  stopOpacity={0.8}
                />
                <stop
                  offset="80%"
                  stopColor="hsl(var(--chart-2))"
                  stopOpacity={0.0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <YAxis
              dataKey="rate"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              domain={yAxisDomain}
              tickFormatter={(value) => {
                return value.toFixed(2);
              }}
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="cbslRate"
              name="CBSL Rate"
              type="monotone"
              fill="url(#fillCBSLRate)"
              stroke="hsl(var(--chart-2))"
              strokeWidth={1}
              baseLine={minRate}
              connectNulls={true}
            />
            <Area
              dataKey="rate"
              name="Com Bank Rate"
              type="monotone"
              fill="url(#fillRate)"
              stroke="hsl(var(--chart-1))"
              strokeWidth={1}
              baseLine={minRate}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
