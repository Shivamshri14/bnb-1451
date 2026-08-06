"use server";

import { endOfDay, startOfMonth, endOfMonth, format, parseISO, isWithinInterval } from "date-fns";
import { connectToDatabase } from "@/lib/db";
import Booking from "@/models/Booking";
import CommissionBooking from "@/models/CommissionBooking";
import Expense from "@/models/Expense";
import { OG_ROOM } from "@/lib/constants";
import { mapBookingDoc, buildDayTimeline, filterEmptySlotsFromNow } from "@/lib/booking-store";

export async function getDashboardStats() {
  await connectToDatabase();

  const bookingDocs = await Booking.find({ bookingStatus: { $ne: "Cancelled" } })
    .sort({ createdAt: -1 })
    .lean();
  const bookings = bookingDocs.map(mapBookingDoc);

  const now = new Date();
  const todayStr = format(now, "yyyy-MM-dd");
  const startOfThisMonth = startOfMonth(now);
  const endOfThisMonth = endOfMonth(now);

  const todayHistory = bookings
    .filter((b) => b.checkInDate === todayStr)
    .sort((a, b) => a.checkInTime.localeCompare(b.checkInTime));

  const upcoming = bookings
    .filter((b) => {
      try {
        return parseISO(b.checkInDate) > endOfDay(now);
      } catch {
        return b.checkInDate > todayStr;
      }
    })
    .sort((a, b) =>
      `${a.checkInDate}${a.checkInTime}`.localeCompare(`${b.checkInDate}${b.checkInTime}`)
    )
    .slice(0, 10);

  const monthBookings = bookings.filter((b) => {
    try {
      const created = b.createdAt ? parseISO(b.createdAt) : parseISO(b.checkInDate);
      return isWithinInterval(created, { start: startOfThisMonth, end: endOfThisMonth });
    } catch {
      return b.checkInDate >= format(startOfThisMonth, "yyyy-MM-dd");
    }
  });

  const monthlyCollected = monthBookings.reduce((s, b) => s + (b.advancePaid || 0), 0);
  const monthlyPending = monthBookings.reduce((s, b) => s + (b.remainingAmount || 0), 0);

  const todayCollection = todayHistory.reduce((s, b) => {
    if (b.paymentStatus === "Paid") return s + b.finalAmount;
    return s + (b.advancePaid || 0);
  }, 0);

  const pendingPayments = bookings
    .filter(
      (b) =>
        b.remainingAmount > 0 || b.paymentStatus === "Pending" || b.paymentStatus === "Partial"
    )
    .sort((a, b) => b.remainingAmount - a.remainingAmount);

  const emptySlots = filterEmptySlotsFromNow(
    buildDayTimeline(bookings, todayStr).filter((s) => s.type === "empty") as any[],
    now
  );

  const commissionDocs = await CommissionBooking.find().lean();
  const commissionPaid = commissionDocs
    .filter((c) => c.paymentCollected === "Yes")
    .reduce((s, c) => s + c.commissionAmount, 0);
  const commissionPending = commissionDocs
    .filter((c) => c.paymentCollected !== "Yes")
    .reduce((s, c) => s + c.commissionAmount, 0);

  const expenseDocs = await Expense.find({
    createdAt: { $gte: startOfThisMonth, $lte: endOfThisMonth },
  }).lean();
  const monthExpenses = expenseDocs.reduce((s, e) => s + e.amount, 0);

  const earnings = monthlyCollected + commissionPaid;

  return {
    todayHistory,
    todayBookings: todayHistory,
    upcoming,
    emptySlots,
    gaps: [],
    todayCollection,
    pendingPayments,
    earnings,
    monthlyCollected,
    monthlyPending,
    commissionPaid,
    commissionPending,
    monthExpenses,
    netProfit: earnings - monthExpenses,
    roomLabel: `${OG_ROOM.name} · Room ${OG_ROOM.roomNumber}`,
  };
}
