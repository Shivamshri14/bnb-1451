"use server";

import { startOfDay, endOfDay, parseISO, differenceInDays } from "date-fns";

export async function getReportDataAction(filters: {
  startDate: string;
  endDate: string;
}) {
  // Compute dummy reporting data for the UI
  const start = parseISO(filters.startDate);
  const end = parseISO(filters.endDate);
  const daysCount = Math.max(1, differenceInDays(end, start));

  // Generate mock operational report stats based on date length
  const totalBookings = Math.round(daysCount * 1.8);
  const roomRentCollected = totalBookings * 4500;
  const roomRentPending = Math.round(roomRentCollected * 0.12);
  const commissionCollected = Math.round(daysCount * 850);
  const commissionPending = Math.round(commissionCollected * 0.15);

  const expensesCleaning = Math.round(daysCount * 300);
  const expensesUtilities = Math.round(daysCount * 600);
  const expensesSalaries = Math.round(daysCount * 1000);
  const expensesMaintenance = Math.round(daysCount * 500);
  const expensesMisc = Math.round(daysCount * 200);
  const totalExpenses = expensesCleaning + expensesUtilities + expensesSalaries + expensesMaintenance + expensesMisc;

  const totalRevenue = roomRentCollected + commissionCollected;
  const netProfit = totalRevenue - totalExpenses;
  const occupancyRate = totalBookings > 0 ? Math.min(95, Math.round(65 + (daysCount % 25))) : 0;

  const dailyBreakdown = Array.from({ length: Math.min(daysCount, 15) }).map((_, index) => {
    const currentDate = new Date(start.getTime() + index * 86400000);
    const dayRent = Math.round(3500 + Math.sin(index) * 1500);
    const dayExpense = Math.round(1000 + Math.cos(index) * 600);
    const dayOccupancy = Math.min(100, Math.round(55 + Math.sin(index) * 35));
    return {
      date: currentDate.toISOString().split("T")[0],
      bookingsCount: Math.round(1 + Math.sin(index) * 1),
      revenue: dayRent,
      expenses: dayExpense,
      profit: dayRent - dayExpense,
      occupancy: dayOccupancy,
    };
  });

  const categoryExpenses = [
    { name: "Salaries", value: expensesSalaries },
    { name: "Utilities", value: expensesUtilities },
    { name: "Maintenance", value: expensesMaintenance },
    { name: "Cleaning", value: expensesCleaning },
    { name: "Miscellaneous", value: expensesMisc },
  ];

  return {
    success: true,
    data: {
      summary: {
        totalBookings,
        occupancyRate,
        roomRentCollected,
        roomRentPending,
        commissionCollected,
        commissionPending,
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin: totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0,
      },
      categoryExpenses,
      dailyBreakdown,
    },
  };
}
