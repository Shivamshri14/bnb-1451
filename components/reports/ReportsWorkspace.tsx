"use client";

import { useState, useTransition, useEffect } from "react";
import { getReportDataAction } from "@/actions/reports";
import { format, subDays, startOfMonth, endOfMonth, startOfYear } from "date-fns";
import {
  Printer,
  Download,
  Calendar,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
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

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function ReportsWorkspace() {
  const [startDate, setStartDate] = useState(
    format(startOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(
    format(endOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [report, setReport] = useState<any>(null);
  const [isPending, startTransition] = useTransition();

  const fetchReport = (startStr: string, endStr: string) => {
    startTransition(async () => {
      const res = await getReportDataAction({
        startDate: startStr,
        endDate: endStr,
      });
      if (res.success && res.data) {
        setReport(res.data);
      } else {
        toast.error("Failed to generate report.");
      }
    });
  };

  useEffect(() => {
    fetchReport(startDate, endDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePreset = (preset: string) => {
    const today = new Date();
    let start = today;
    let end = today;

    if (preset === "WEEK") {
      start = subDays(today, 7);
    } else if (preset === "MONTH") {
      start = startOfMonth(today);
      end = endOfMonth(today);
    } else if (preset === "LAST_MONTH") {
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      start = startOfMonth(lastMonth);
      end = endOfMonth(lastMonth);
    } else if (preset === "YEAR") {
      start = startOfYear(today);
    }

    const startStr = format(start, "yyyy-MM-dd");
    const endStr = format(end, "yyyy-MM-dd");
    setStartDate(startStr);
    setEndDate(endStr);
    fetchReport(startStr, endStr);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!report) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Operational Financial Report Summary\n";
    csvContent += `Period: ${startDate} to ${endDate}\n\n`;

    csvContent += "Metric,Value\n";
    csvContent += `Total Bookings,${report.summary.totalBookings}\n`;
    csvContent += `Room Occupancy Rate,${report.summary.occupancyRate}%\n`;
    csvContent += `Room Rent Collected (₹),${report.summary.roomRentCollected}\n`;
    csvContent += `Room Rent Pending (₹),${report.summary.roomRentPending}\n`;
    csvContent += `Commission Revenue Collected (₹),${report.summary.commissionCollected}\n`;
    csvContent += `Commission Revenue Pending (₹),${report.summary.commissionPending}\n`;
    csvContent += `Total Revenue (₹),${report.summary.totalRevenue}\n`;
    csvContent += `Total Expenses (₹),${report.summary.totalExpenses}\n`;
    csvContent += `Net Profit (₹),${report.summary.netProfit}\n`;
    csvContent += `Profit Margin,${report.summary.profitMargin}%\n\n`;

    csvContent += "Operational Expenses by Category\n";
    csvContent += "Category,Amount (₹)\n";
    report.categoryExpenses.forEach((item: any) => {
      csvContent += `${item.name},${item.value}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV file downloaded successfully!");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header controls (Hidden during print) */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50">
            Operational Reports
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Aggregate revenue collections, agent commission payouts, and net profits.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 cursor-pointer"
          >
            <Printer className="h-4 w-4" /> Print / Save PDF
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 cursor-pointer"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Date Range Selector Presets (Hidden during print) */}
      <div className="print:hidden flex flex-wrap gap-2 items-center bg-white dark:bg-neutral-900/40 p-4 rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm">
        <div className="flex items-center gap-2 mr-4">
          <Calendar className="h-4 w-4 text-neutral-400" />
          <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            Presets:
          </span>
        </div>
        <button
          onClick={() => handlePreset("WEEK")}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 cursor-pointer"
        >
          Last 7 Days
        </button>
        <button
          onClick={() => handlePreset("MONTH")}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 cursor-pointer"
        >
          This Month
        </button>
        <button
          onClick={() => handlePreset("LAST_MONTH")}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 cursor-pointer"
        >
          Last Month
        </button>
        <button
          onClick={() => handlePreset("YEAR")}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 cursor-pointer"
        >
          Year to Date
        </button>

        <div className="flex items-center gap-2.5 ml-auto pl-4 border-l border-neutral-200 dark:border-neutral-800">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded border border-neutral-200 dark:border-neutral-800 focus:outline-none"
          />
          <span className="text-xs text-neutral-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded border border-neutral-200 dark:border-neutral-800 focus:outline-none"
          />
          <button
            onClick={() => fetchReport(startDate, endDate)}
            disabled={isPending}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
          >
            {isPending && <Loader2 className="h-3 w-3 animate-spin" />} Run
          </button>
        </div>
      </div>

      {/* Print-Only Title Header */}
      <div className="hidden print:block text-center border-b pb-6 mb-6">
        <h1 className="text-2xl font-bold uppercase tracking-wide">
          BnB Property Manager - Operational Report
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Statement Period: {format(new Date(startDate), "dd MMM yyyy")} to{" "}
          {format(new Date(endDate), "dd MMM yyyy")}
        </p>
      </div>

      {report ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <div className="p-5 bg-white dark:bg-neutral-900/40 rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm">
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Total Revenue
              </div>
              <div className="text-2xl font-black text-neutral-900 dark:text-white mt-1">
                {formatCurrency(report.summary.totalRevenue)}
              </div>
              <div className="text-[10px] text-neutral-400 mt-1 uppercase">
                Rent: {formatCurrency(report.summary.roomRentCollected)} | Comm:{" "}
                {formatCurrency(report.summary.commissionCollected)}
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-neutral-900/40 rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm">
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider text-rose-500">
                Total Expenses
              </div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                {formatCurrency(report.summary.totalExpenses)}
              </div>
              <div className="text-[10px] text-neutral-400 mt-1 uppercase">
                All operational category costs
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-neutral-900/40 rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm">
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider text-emerald-500">
                Net Profit
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {formatCurrency(report.summary.netProfit)}
              </div>
              <div className="text-[10px] text-neutral-400 mt-1 uppercase">
                Margin: {report.summary.profitMargin}%
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-neutral-900/40 rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm">
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider text-blue-500">
                Occupancy Rate
              </div>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                {report.summary.occupancyRate}%
              </div>
              <div className="text-[10px] text-neutral-400 mt-1 uppercase">
                Total Bookings: {report.summary.totalBookings}
              </div>
            </div>
          </div>

          {/* Detailed Financial Ledger Grid */}
          <div className="bg-white dark:bg-neutral-900/40 rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-50 uppercase tracking-wider">
              Financial Breakdown Ledger
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
              {/* Income Ledger */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase text-neutral-400 border-b pb-1.5 flex justify-between">
                  <span>Revenue Channels</span>
                  <span>Amount (₹)</span>
                </h4>
                <div className="flex justify-between font-medium">
                  <span className="text-neutral-600 dark:text-neutral-400">
                    Room Rent Collected:
                  </span>
                  <span className="text-neutral-900 dark:text-white">
                    {formatCurrency(report.summary.roomRentCollected)}
                  </span>
                </div>
                <div className="flex justify-between font-medium text-xs text-neutral-400">
                  <span>Room Rent Dues (Pending):</span>
                  <span>{formatCurrency(report.summary.roomRentPending)}</span>
                </div>
                <div className="flex justify-between font-medium pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <span className="text-neutral-600 dark:text-neutral-400">
                    Commission Payouts Collected:
                  </span>
                  <span className="text-neutral-900 dark:text-white">
                    {formatCurrency(report.summary.commissionCollected)}
                  </span>
                </div>
                <div className="flex justify-between font-medium text-xs text-neutral-400">
                  <span>Commission Payouts Dues:</span>
                  <span>{formatCurrency(report.summary.commissionPending)}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-3 border-t border-neutral-200 dark:border-neutral-800">
                  <span>Total Revenue:</span>
                  <span className="text-neutral-900 dark:text-white">
                    {formatCurrency(report.summary.totalRevenue)}
                  </span>
                </div>
              </div>

              {/* Expense Ledger */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase text-rose-400 border-b pb-1.5 flex justify-between">
                  <span>Operational Expense Category</span>
                  <span>Amount (₹)</span>
                </h4>
                {report.categoryExpenses.map((expense: any) => (
                  <div
                    key={expense.name}
                    className="flex justify-between font-medium"
                  >
                    <span className="text-neutral-600 dark:text-neutral-400">
                      {expense.name}:
                    </span>
                    <span className="text-neutral-900 dark:text-white">
                      {formatCurrency(expense.value)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-base pt-3 border-t border-neutral-200 dark:border-neutral-800">
                  <span>Total Expenses:</span>
                  <span className="text-rose-600 dark:text-rose-400">
                    {formatCurrency(report.summary.totalExpenses)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Graphs section (Hidden during print) */}
          <div className="print:hidden grid gap-6 grid-cols-1 lg:grid-cols-3">
            {/* Category Expenses distribution */}
            <div className="lg:col-span-1 bg-white dark:bg-neutral-900/40 rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm p-6 flex flex-col justify-between">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-50 uppercase tracking-wider mb-4">
                Expense Distribution
              </h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={report.categoryExpenses}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {report.categoryExpenses.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "rgba(23, 23, 23, 0.85)",
                        border: "none",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 text-xs justify-center mt-4">
                {report.categoryExpenses.map((entry: any, index: number) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-neutral-500">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Operational Trends */}
            <div className="lg:col-span-2 bg-white dark:bg-neutral-900/40 rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm p-6">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-50 uppercase tracking-wider mb-4">
                Daily Operational Trends (Max 15 Days)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.dailyBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(23, 23, 23, 0.85)",
                        border: "none",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar
                      dataKey="revenue"
                      name="Revenue (₹)"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="expenses"
                      name="Expenses (₹)"
                      fill="#ef4444"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        </div>
      )}
    </div>
  );
}
