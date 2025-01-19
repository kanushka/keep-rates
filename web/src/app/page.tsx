"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { format, subDays } from "date-fns";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Rate {
  date: string;
  rate: number;
  time: string;
  timestamp: string;
}

const colors = [
  "rgb(59, 130, 246)", // blue
  "rgb(16, 185, 129)", // green
  "rgb(239, 68, 68)", // red
  "rgb(168, 85, 247)", // purple
  "rgb(251, 146, 60)", // orange
  "rgb(14, 165, 233)", // sky
  "rgb(236, 72, 153)", // pink
];

export default function Home() {
  const [allRates, setAllRates] = useState<Rate[]>([]);
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("14d");

  const fetchRates = async (days: number) => {
    const startDate = subDays(new Date(), days);
    const ratesRef = collection(db, "usdRates");
    const q = query(
      ratesRef,
      where("timestamp", ">=", startDate.toISOString()),
      orderBy("timestamp", "desc")
    );

    const snapshot = await getDocs(q);
    const allRates = snapshot.docs.map((doc) => doc.data() as Rate);

    // Continue with existing logic for daily max rates
    const ratesByDate: Record<string, Rate> = {};
    allRates.forEach((rate) => {
      if (!ratesByDate[rate.date] || ratesByDate[rate.date].rate < rate.rate) {
        ratesByDate[rate.date] = rate;
      }
    });

    const maxRates = Object.values(ratesByDate).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    setRates(maxRates);

    // get all rates in last 7 days
    const allRatesInLast3Days = allRates
      .filter((rate) => new Date(rate.date) >= subDays(new Date(), 7))
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    setAllRates(allRatesInLast3Days);
  };

  useEffect(() => {
    const loadRates = async () => {
      setLoading(true);
      try {
        const days =
          dateRange === "14d"
            ? 14
            : dateRange === "30d"
            ? 30
            : dateRange === "60d"
            ? 60
            : 365;
        await fetchRates(days);
      } catch (error) {
        console.error("Error fetching rates:", error);
      } finally {
        setLoading(false);
      }
    };

    loadRates();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const latestRate = rates[rates.length - 1]?.rate || 0;
  const oldestRate = rates[0]?.rate || 0;
  const overallChange = (latestRate - oldestRate).toFixed(2);
  const overallPercentage = (
    (Number(overallChange) / oldestRate) *
    100
  ).toFixed(2);
  const highestRate = Math.max(...rates.map((r) => r.rate));
  const lowestRate = Math.min(...rates.map((r) => r.rate));
  const rateVolatility = (highestRate - lowestRate).toFixed(2);

  const maxRateChartData = {
    labels: rates.map((r) => format(new Date(r.date), "MMM dd")),
    datasets: [
      {
        label: "USD Rate (LKR)",
        data: rates.map((r) => r.rate),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        tension: 0.1,
      },
    ],
  };

  const allRatesChartData = {
    labels: Array.from(
      new Set(allRates.map((r) => format(new Date(r.timestamp), "HH:mm")))
    ),
    datasets: Object.entries(
      allRates.reduce((acc, rate) => {
        const day = format(new Date(rate.date), "MMM dd");
        if (!acc[day]) {
          acc[day] = {
            rates: [],
            timestamps: {},
          };
        }
        // Store rate at specific time slot
        acc[day].timestamps[format(new Date(rate.timestamp), "HH:mm")] =
          rate.rate;
        return acc;
      }, {} as Record<string, { rates: number[]; timestamps: Record<string, number> }>)
    ).map(([day, data]) => ({
      label: day,
      data: Array.from(
        new Set(allRates.map((r) => format(new Date(r.timestamp), "HH:mm")))
      ).map((timeSlot) => data.timestamps[timeSlot] || null),
      borderColor:
        colors[Object.entries(data.timestamps).length % colors.length],
      backgroundColor: colors[
        Object.entries(data.timestamps).length % colors.length
      ]
        .replace("rgb", "rgba")
        .replace(")", ", 0.5)"),
      tension: 0.1,
    })),
  };

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold">USD/LKR Exchange Rate Summary</h1>
      <h1 className="text-2xl font-bold mb-8">Commercial Bank, Sri Lanka</h1>

      {/* Latest Rate */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="text-4xl font-bold text-blue-600">
          {latestRate.toFixed(2)} LKR
        </div>
        <div className="text-sm text-gray-500 mt-1">
          Last updated:{" "}
          {format(new Date(rates[rates.length - 1]?.timestamp || ""), "PPpp")}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-gray-500 text-sm">Overall Change</h3>
          <div
            className={`text-xl font-bold ${
              Number(overallChange) > 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {overallChange} LKR ({overallPercentage}%)
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-gray-500 text-sm">Highest Rate</h3>
          <div className="text-xl font-bold text-gray-700">
            {highestRate.toFixed(2)} LKR
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-gray-500 text-sm">Lowest Rate</h3>
          <div className="text-xl font-bold text-gray-700">
            {lowestRate.toFixed(2)} LKR
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-gray-500 text-sm">Rate Volatility</h3>
          <div className="text-xl font-bold text-gray-700">
            {rateVolatility} LKR
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="flex gap-2 mb-6">
        {["14d", "30d", "60d", "1y"].map((range) => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            className={`px-4 py-2 rounded-md transition-colors ${
              dateRange === range
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            {range === "1y" ? "1 Year" : range.replace("d", " Days")}
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="bg-white rounded-lg shadow p-4 mb-8">
        <Line
          data={maxRateChartData}
          options={{
            responsive: true,
            plugins: {
              legend: {
                position: "top" as const,
              },
              title: {
                display: true,
                text: "Maximum Exchange Rate Per Day",
              },
            },
            scales: {
              y: {
                beginAtZero: false,
              },
            },
          }}
        />
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <Line
          data={allRatesChartData}
          options={{
            responsive: true,
            plugins: {
              legend: {
                position: "top" as const,
              },
              title: {
                display: true,
                text: "Daily Rate Patterns (Last 7 Days)",
              },
            },
            scales: {
              y: {
                beginAtZero: false,
              },
              x: {
                title: {
                  display: true,
                  text: "Time of Day",
                },
              },
            },
          }}
        />
      </div>
    </main>
  );
}
