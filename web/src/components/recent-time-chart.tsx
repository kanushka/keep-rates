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
import { Rate } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DotProps {
  cx: number;
  cy: number;
  payload: {
    timestamp: string;
  };
}

const chartConfig = {
  rate: {
    label: "Rate",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

interface RecentTimeChartProps {
  chartData: Rate[];
}

export function RecentTimeChart({
  chartData,
}: RecentTimeChartProps) {
  const [timeRange, setTimeRange] = React.useState("3d");

  const getTimeRangeText = (range: string) => {
    switch (range) {
      case "30d":
        return "30 days";
      case "7d":
        return "7 days";
      default:
        return "3 days";
    }
  };

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
  };

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.timestamp);
    const startDate = new Date();
    let daysToSubtract = 3;
    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "7d") {
      daysToSubtract = 7;
    }
    startDate.setDate(startDate.getDate() - daysToSubtract);
    return date >= startDate;
  });

  const minRate = Math.min(...filteredData.map((item) => item.rate));
  const maxRate = Math.max(...filteredData.map((item) => item.rate));
  const padding = (maxRate - minRate) * 0.1;
  const yAxisDomain = [minRate - padding, maxRate + padding];

  // reverse data to show newest first
  const reversedData = [...filteredData].reverse();

  // Function to check if timestamp is at midnight (00:00)
  const isDayStart = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.getHours() === 0 || date.getHours() === 7;
  };

  return (
    <Card>
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>Exchange Rates Over Time</CardTitle>
          <CardDescription>
            Showing all rate changes in the last {getTimeRangeText(timeRange)}
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={handleTimeRangeChange}>
          <SelectTrigger
            className="w-[160px] rounded-lg sm:ml-auto"
            aria-label="Select time range"
          >
            <SelectValue placeholder="Last 3 days" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="30d" className="rounded-lg">
              Last 30 days
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              Last 7 days
            </SelectItem>
            <SelectItem value="3d" className="rounded-lg">
              Last 3 days
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
            data={reversedData}
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
              dataKey="timestamp"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="rate"
              type="monotone"
              fill="url(#fillRate)"
              stroke="hsl(var(--chart-1))"
              strokeWidth={1}
              baseLine={minRate}
              dot={(props: DotProps) => {
                const timestamp = props.payload.timestamp;
                if (isDayStart(timestamp)) {
                  return (
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={4}
                      fill="hsl(var(--chart-1))"
                      stroke="white"
                      strokeWidth={2}
                    />
                  );
                }
                return (
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={0}
                    fill="none"
                    stroke="none"
                  />
                );
              }}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
