"use client";

import { SummaryChart } from "@/components/summary-chart";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { subDays } from "date-fns";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Rate, CBSLRate, CombinedRate } from "@/types";
import Loading from "./loading";
import { RecentTimeChart } from "@/components/recent-time-chart";

export default function Page() {
  const [rates, setRates] = useState<CombinedRate[]>([]);
  const [allRates, setAllRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30d");

  const fetchCBSLRates = async (startDate: Date): Promise<CBSLRate[]> => {
    try {
      const ratesRef = collection(db, "cbslRates");
      const q = query(
        ratesRef,
        where("timestamp", ">=", startDate.toISOString()),
        orderBy("timestamp", "desc")
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        date: doc.data().date,
        rate: doc.data().rate,
        timestamp: doc.data().timestamp
      })) as CBSLRate[];
    } catch (error) {
      console.error('Error fetching CBSL rates:', error);
      return [];
    }
  };

  const fetchRates = async (days: number) => {
    const startDate = subDays(new Date(), days);
    const ratesRef = collection(db, "usdRates");
    const q = query(
      ratesRef,
      where("timestamp", ">=", startDate.toISOString()),
      orderBy("timestamp", "desc")
    );

    const [snapshot, cbslRates] = await Promise.all([
      getDocs(q),
      fetchCBSLRates(startDate)
    ]);

    const allRates = snapshot.docs.map((doc) => doc.data() as Rate);
    setAllRates(allRates);

    // Process commercial bank rates
    const ratesByDate: Record<string, Rate> = {};
    allRates.forEach((rate) => {
      if (!ratesByDate[rate.date] || ratesByDate[rate.date].rate < rate.rate) {
        ratesByDate[rate.date] = rate;
      }
    });

    // Create a map of CBSL rates by date
    const cbslRatesByDate = new Map(
      cbslRates.map(rate => [rate.date, rate.rate])
    );

    // Combine both rates
    const maxRates = Object.values(ratesByDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(rate => ({
        date: rate.date,
        rate: rate.rate,
        cbslRate: cbslRatesByDate.get(rate.date),
        timestamp: rate.timestamp
      }));

    setRates(maxRates);
  };

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

  const getTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    return "Just now";
  };

  useEffect(() => {
    const loadRates = async () => {
      setLoading(true);
      try {
        // always fetch 90d rates
        await fetchRates(90);
      } catch (error) {
        console.error("Error fetching rates:", error);
      } finally {
        setLoading(false);
      }
    };

    loadRates();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <Loading />;
  }

  const filteredRates = rates.filter((item) => {
    const date = new Date(item.date);
    let daysToSubtract = 90;
    if (dateRange === "30d") {
      daysToSubtract = 30;
    } else if (dateRange === "7d") {
      daysToSubtract = 7;
    }
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysToSubtract);
    return date >= startDate;
  });

  const latestRate = rates[rates.length - 1]?.rate || 0;
  const latestTimestamp = rates[rates.length - 1]?.timestamp;
  const lastUpdated = latestTimestamp ? getTimeAgo(latestTimestamp) : "N/A";

  // Calculate rate change from previous day
  const previousDayRate = rates[rates.length - 2]?.rate || latestRate;
  const rateChange = (latestRate - previousDayRate).toFixed(2);
  const rateChangePercent = (
    ((latestRate - previousDayRate) / previousDayRate) *
    100
  ).toFixed(2);
  const isPositiveChange = Number(rateChange) >= 0;
  const changeText = `${isPositiveChange ? "+" : ""}${rateChange} (${
    isPositiveChange ? "+" : ""
  }${rateChangePercent}%)`;

  // calculate using filteredRates
  const oldestRate = filteredRates[0]?.rate || 0;
  const overallChange = (latestRate - oldestRate).toFixed(2);
  const highestRate = Math.max(...filteredRates.map((r) => r.rate));
  const lowestRate = Math.min(...filteredRates.map((r) => r.rate));
  const rateVolatility = (highestRate - lowestRate).toFixed(2);

  return (
    <SidebarProvider>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">KeepRates</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Commercial Bank</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex flex-col items-start justify-between gap-1 mb-4">
            <div className="text-2xl font-bold">
              Commercial Bank | Sri Lanka
            </div>
            <Link
              href="https://www.combank.lk/rates-tariff#exchange-rates"
              className="text-sm text-muted-foreground"
            >
              Visit Bank Website
            </Link>
          </div>
          <div className="grid auto-rows-min gap-4 grid-cols-1 md:grid-cols-4">
            <div className="col-span-full md:col-span-2 rounded-xl bg-muted/50">
              <Card className="h-full flex flex-col justify-between">
                <CardHeader className="pb-4 lg:p-6">
                  <CardTitle>USD/LKR</CardTitle>
                  <CardDescription>Last updated {lastUpdated}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <div className="text-sm text-muted-foreground">
                      {changeText}
                    </div>
                    <div className="text-6xl font-bold">{latestRate}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="col-span-full md:col-span-2 grid grid-cols-2 gap-4">
              <div className="col-span-1 rounded-xl bg-muted/50">
                <Card className="flex flex-col lg:flex-row items-center lg:items-end justify-between h-full">
                  <CardHeader className="pb-2 lg:p-6">
                    <CardTitle>Overall Change</CardTitle>
                    <CardDescription>
                      In the last {getTimeRangeText(dateRange)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{overallChange}</div>
                  </CardContent>
                </Card>
              </div>
              <div className="col-span-1 rounded-xl bg-muted/50">
                <Card className="flex flex-col lg:flex-row items-center lg:items-end justify-between h-full">
                  <CardHeader className="pb-2 lg:p-6 items-center lg:items-start">
                    <CardTitle>Highest Rate</CardTitle>
                    <CardDescription>
                      In the last {getTimeRangeText(dateRange)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{highestRate}</div>
                  </CardContent>
                </Card>
              </div>
              <div className="col-span-1 rounded-xl bg-muted/50">
                <Card className="flex flex-col lg:flex-row items-center lg:items-end justify-between h-full">
                  <CardHeader className="pb-2 lg:p-6 items-center lg:items-start">
                    <CardTitle>Rate Volatility</CardTitle>
                    <CardDescription>
                      In the last {getTimeRangeText(dateRange)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{rateVolatility}</div>
                  </CardContent>
                </Card>
              </div>
              <div className="col-span-1 rounded-xl bg-muted/50">
                <Card className="flex flex-col lg:flex-row items-center lg:items-end justify-between h-full">
                  <CardHeader className="pb-2 lg:p-6 items-center lg:items-start">
                    <CardTitle>Lowest Rate</CardTitle>
                    <CardDescription>
                      In the last {getTimeRangeText(dateRange)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{lowestRate}</div>
                  </CardContent>
                </Card>
              </div>
            </div>
            <div className="col-span-full rounded-xl bg-muted/50">
              <SummaryChart
                chartData={rates}
                onTimeRangeChange={setDateRange}
              />
            </div>
            <div className="col-span-full rounded-xl bg-muted/50">
              <RecentTimeChart chartData={allRates} />
            </div>
          </div>
          <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
