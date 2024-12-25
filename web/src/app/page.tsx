'use client';

import { useEffect, useState, useRef } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format, subDays } from 'date-fns';
import { BoxPlotController, BoxAndWiskers } from '@sgratzl/chartjs-chart-boxplot';



// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BoxPlotController,
  BoxAndWiskers,
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

interface DailyStats {
  date: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  rates: number[];
}

export default function Home() {
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('14d');
  const [dailyVolatility, setDailyVolatility] = useState<DailyStats[]>([]);
  const boxplotRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<ChartJS | null>(null);

  const calculateDailyStats = (rates: Rate[]): DailyStats[] => {
    // Group rates by date
    const ratesByDate = rates.reduce((acc, rate) => {
      if (!acc[rate.date]) {
        acc[rate.date] = [];
      }
      acc[rate.date].push(rate.rate);
      return acc;
    }, {} as Record<string, number[]>);

    // Calculate statistics for each day
    return Object.entries(ratesByDate).map(([date, rates]) => {
      const sortedRates = rates.sort((a, b) => a - b);
      
      // Calculate quartiles
      const getQuartile = (arr: number[], q: number) => {
        const pos = (arr.length - 1) * q;
        const base = Math.floor(pos);
        const rest = pos - base;
        if (arr[base + 1] !== undefined) {
          return arr[base] + rest * (arr[base + 1] - arr[base]);
        } else {
          return arr[base];
        }
      };

      return {
        date,
        min: Math.min(...rates),
        q1: getQuartile(sortedRates, 0.25),
        median: getQuartile(sortedRates, 0.5),
        q3: getQuartile(sortedRates, 0.75),
        max: Math.max(...rates),
        rates: sortedRates
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const fetchRates = async (days: number) => {
    const startDate = subDays(new Date(), days);
    const ratesRef = collection(db, 'usdRates');
    const q = query(
      ratesRef,
      where('timestamp', '>=', startDate.toISOString()),
      orderBy('timestamp', 'desc')
    );

    const snapshot = await getDocs(q);
    const allRates = snapshot.docs.map(doc => doc.data() as Rate);
    
    // Calculate daily stats for volatility chart
    const dailyStats = calculateDailyStats(allRates);
    setDailyVolatility(dailyStats);

    // Continue with existing logic for daily max rates
    const ratesByDate: Record<string, Rate> = {};
    allRates.forEach(rate => {
      if (!ratesByDate[rate.date] || ratesByDate[rate.date].rate < rate.rate) {
        ratesByDate[rate.date] = rate;
      }
    });

    return Object.values(ratesByDate).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  useEffect(() => {
    const loadRates = async () => {
      setLoading(true);
      try {
        const days = dateRange === '14d' ? 14 : 
                    dateRange === '30d' ? 30 : 
                    dateRange === '60d' ? 60 : 365;
        const data = await fetchRates(days);
        setRates(data);
      } catch (error) {
        console.error('Error fetching rates:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRates();
  }, [dateRange]);

  useEffect(() => {
    if (!boxplotRef.current || !dailyVolatility.length) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Create new chart
    chartInstance.current = new ChartJS(boxplotRef.current, {
      type: 'boxplot',
      data: {
        labels: dailyVolatility.map(d => format(new Date(d.date), 'MMM dd')),
        datasets: [{
          label: 'Daily Rate Range',
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgb(59, 130, 246)',
          data: dailyVolatility.map(d => ({
            min: d.min,
            q1: d.q1,
            median: d.median,
            q3: d.q3,
            max: d.max
          }))
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Daily Rate Ranges'
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const stats = dailyVolatility[context.dataIndex];
                return [
                  `Highest: ${stats.max.toFixed(2)} LKR`,
                  `Upper Quartile: ${stats.q3.toFixed(2)} LKR`,
                  `Median: ${stats.median.toFixed(2)} LKR`,
                  `Lower Quartile: ${stats.q1.toFixed(2)} LKR`,
                  `Lowest: ${stats.min.toFixed(2)} LKR`,
                  `Number of updates: ${stats.rates.length}`
                ];
              }
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [dailyVolatility]);

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
  const overallPercentage = ((Number(overallChange) / oldestRate) * 100).toFixed(2);
  const highestRate = Math.max(...rates.map(r => r.rate));
  const lowestRate = Math.min(...rates.map(r => r.rate));
  const rateVolatility = (highestRate - lowestRate).toFixed(2);

  const chartData = {
    labels: rates.map(r => format(new Date(r.date), 'MMM dd')),
    datasets: [
      {
        label: 'USD Rate (LKR)',
        data: rates.map(r => r.rate),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.1,
      },
    ],
  };

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold">USD/LKR Exchange Rate Summary</h1>
      <h1 className="text-2xl font-bold mb-8">Commercial Bank, Sri Lanka</h1>

      
      {/* Latest Rate */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="text-4xl font-bold text-blue-600">{latestRate.toFixed(2)} LKR</div>
        <div className="text-sm text-gray-500 mt-1">
          Last updated: {format(new Date(rates[rates.length - 1]?.timestamp || ''), 'PPpp')}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-gray-500 text-sm">Overall Change</h3>
          <div className={`text-xl font-bold ${Number(overallChange) > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {overallChange} LKR ({overallPercentage}%)
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-gray-500 text-sm">Highest Rate</h3>
          <div className="text-xl font-bold text-gray-700">{highestRate.toFixed(2)} LKR</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-gray-500 text-sm">Lowest Rate</h3>
          <div className="text-xl font-bold text-gray-700">{lowestRate.toFixed(2)} LKR</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-gray-500 text-sm">Rate Volatility</h3>
          <div className="text-xl font-bold text-gray-700">{rateVolatility} LKR</div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="flex gap-2 mb-6">
        {['14d', '30d', '60d', '1y'].map((range) => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            className={`px-4 py-2 rounded-md transition-colors ${
              dateRange === range
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {range === '1y' ? '1 Year' : range.replace('d', ' Days')}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg shadow p-4">
        <Line
          data={chartData}
          options={{
            responsive: true,
            plugins: {
              legend: {
                position: 'top' as const,
              },
              title: {
                display: true,
                text: 'USD to LKR Exchange Rate Trend',
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

      <div className="bg-white rounded-lg shadow p-4 mt-8">
        <canvas ref={boxplotRef}></canvas>
      </div>
    </main>
  );
}
