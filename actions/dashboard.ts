"use server";

import { endOfDay, startOfMonth, endOfMonth, format, parseISO, isWithinInterval } from "date-fns";
import { connectToDatabase } from "@/lib/db";
import Booking from "@/models/Booking";
import CommissionBooking from "@/models/CommissionBooking";
import Expense from "@/models/Expense";
import { OG_ROOM } from "@/lib/constants";
import { mapBookingDoc, buildDayTimeline, filterEmptySlotsFromNow, computeGaps, parseDateTime, getISTDateString } from "@/lib/booking-store";

export async function getDashboardStats() {
  await connectToDatabase();

  const bookingDocs = await Booking.find({ bookingStatus: { $ne: "Cancelled" } })
    .sort({ createdAt: -1 })
    .lean();
  const bookings = bookingDocs.map(mapBookingDoc);

  const now = new Date();
  const todayStr = getISTDateString(now);

  const [year, month] = todayStr.split("-");
  const startOfThisMonth = parseISO(`${year}-${month}-01T00:00:00+05:30`);
  const istToday = parseISO(`${todayStr}T12:00:00+05:30`);
  const endOfThisMonthDate = endOfMonth(istToday);
  const endOfThisMonthStr = format(endOfThisMonthDate, "yyyy-MM-dd") + "T23:59:59";
  const endOfThisMonth = parseISO(`${endOfThisMonthStr}+05:30`);

  const todayHistory = bookings
    .filter((b) => b.checkInDate === todayStr)
    .sort((a, b) => a.checkInTime.localeCompare(b.checkInTime));

  const upcoming = bookings
    .filter((b) => b.checkInDate > todayStr)
    .sort((a, b) =>
      `${a.checkInDate}${a.checkInTime}`.localeCompare(`${b.checkInDate}${b.checkInTime}`)
    )
    .slice(0, 10);

  const monthBookings = bookings.filter((b) => {
    try {
      const created = b.createdAt ? parseISO(b.createdAt) : parseISO(`${b.checkInDate}T00:00:00+05:30`);
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

  const timeline = buildDayTimeline(bookings, todayStr);
  const isOccupied = bookings.some(b => {
    try {
      const ci = parseDateTime(b.checkInDate, b.checkInTime);
      const co = parseDateTime(b.checkOutDate, b.checkOutTime);
      return b.bookingStatus !== "Cancelled" && ci.getTime() <= now.getTime() && co.getTime() > now.getTime();
    } catch { return false; }
  });

  const emptySlots = computeGaps(bookings, 1, now).map(g => ({
    _id: g._id,
    checkInDate: g.checkInDate,
    checkInTime: g.checkInTime,
    checkOutDate: g.checkOutDate,
    checkOutTime: g.checkOutTime,
    totalHours: g.totalHours,
    isBooking: g.isBooking,
    isGap: g.isGap,
    via: g.via,
  }));

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
    timeline,
    isOccupied,
  };
}
