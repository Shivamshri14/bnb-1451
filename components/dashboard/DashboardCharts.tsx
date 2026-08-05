"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface ChartDataPoint {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

interface BookingSourcePoint {
  name: string;
  value: number;
}

interface DashboardChartsProps {
  trendData: ChartDataPoint[];
  sourcesData: BookingSourcePoint[];
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#6366f1", "#64748b"];

export default function DashboardCharts({ trendData, sourcesData }: DashboardChartsProps) {
  // Format currency labels
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const hasSourceData = sourcesData.some(item => item.value > 0);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Monthly Financial Trend Chart */}
      <div className="rounded-2xl border border-neutral-200/50 bg-white dark:bg-neutral-900/40 dark:border-neutral-800/50 p-6 shadow-sm backdrop-blur-md lg:col-span-2">
        <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-50 mb-6">
          Monthly Financial Trend
        </h3>
        <div className="h-80 w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={trendData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-neutral-800" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#9ca3af" }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `₹${val}`}
                tick={{ fill: "#9ca3af" }}
              />
              <Tooltip
                formatter={(value: any) => [formatCurrency(Number(value || 0)), ""]}
                contentStyle={{
                  borderRadius: "12px",
                  borderColor: "rgba(0,0,0,0.1)",
                  backgroundColor: "rgba(255,255,255,0.9)",
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} />
              <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#f59e0b" name="Expenses" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" fill="#10b981" name="Net Profit" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Booking Sources Distribution Chart */}
      <div className="rounded-2xl border border-neutral-200/50 bg-white dark:bg-neutral-900/40 dark:border-neutral-800/50 p-6 shadow-sm backdrop-blur-md">
        <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-50 mb-6">
          Booking Sources
        </h3>
        <div className="h-80 w-full flex flex-col justify-center items-center">
          {hasSourceData ? (
            <>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourcesData.filter(item => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {sourcesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        borderColor: "rgba(0,0,0,0.1)",
                        backgroundColor: "rgba(255,255,255,0.9)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
                {sourcesData.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span>{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-neutral-400 dark:text-neutral-500">
              <span className="text-sm">No booking source data available yet</span>
              <span className="text-xs mt-1">Data updates when you create bookings</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
