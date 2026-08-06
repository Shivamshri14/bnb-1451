"use server";

import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db";
import Booking from "@/models/Booking";
import { quickRecordSchema, QuickRecordInput, bookingSchema, BookingInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { differenceInHours, format } from "date-fns";
import { OG_ROOM } from "@/lib/constants";
import { normalizeIndianPhone } from "@/lib/phone";
import {
  parseDateTime,
  isSlotOverlapping,
  computeGaps,
  buildDayTimeline,
  mapBookingDoc,
  type BookingRecord,
} from "@/lib/booking-store";
import { createCommissionAction } from "./commissions";

async function actor() {
  const session = await auth();
  return {
    name: session?.user?.name || session?.user?.email || "Owner",
    email: session?.user?.email || "",
  };
}

function revalidateAll() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard/expenses");
}

export async function getBookingsAction(filters?: {
  search?: string;
  bookingStatus?: string;
  day?: string;
}) {
  await connectToDatabase();
  const query: any = {};

  if (filters?.bookingStatus && filters.bookingStatus !== "ALL") {
    query.bookingStatus = filters.bookingStatus;
  }

  if (filters?.search) {
    const s = filters.search;
    query.$or = [
      { customerName: new RegExp(s, "i") },
      { phoneNumber: new RegExp(s, "i") },
      { createdBy: new RegExp(s, "i") },
      { via: new RegExp(s, "i") },
    ];
  }

  const docs = await Booking.find(query).sort({ createdAt: -1 }).lean();
  const list = docs.map(mapBookingDoc);
  const day = filters?.day || format(new Date(), "yyyy-MM-dd");

  return {
    success: true,
    data: list,
    gaps: computeGaps(list, 3).slice(0, 8),
    timeline: buildDayTimeline(list, day),
    day,
  };
}

export async function createQuickRecordAction(data: QuickRecordInput) {
  const parsed = quickRecordSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const who = await actor();
  const d = parsed.data;
  const start = parseDateTime(d.checkInDate, d.checkInTime);
  const end = parseDateTime(d.checkOutDate, d.checkOutTime);
  const totalHours = differenceInHours(end, start);
  if (totalHours <= 0) {
    return { success: false, error: "Check-out must be after check-in." };
  }

  const sourceRaw = d.sourceOrPhone?.trim() || "";
  const asPhone = sourceRaw ? normalizeIndianPhone(sourceRaw) : null;
  const customerName = (d.customerName || "").trim();
  const via = d.via || "";
  const roomNumber = d.roomNumber?.trim() || "1451";

  // Server-side: check-out cannot be in the past
  const now = new Date();
  if (end.getTime() <= now.getTime()) {
    return { success: false, error: "Check-out cannot be in the past." };
  }

  if (d.entryType === "commission") {
    return createCommissionAction({
      propertyName: `Room ${roomNumber}`,
      customerName,
      bookingDate: format(new Date(), "yyyy-MM-dd"),
      checkInDate: d.checkInDate,
      checkInTime: d.checkInTime,
      checkOutDate: d.checkOutDate,
      checkOutTime: d.checkOutTime,
      bookingAmount: d.amount,
      commissionPercentage: 10,
      commissionAmount: Math.round(d.amount * 0.1),
      paymentCollected: d.paymentStatus === "Received" ? "Yes" : "No",
      paymentMethod: d.paymentStatus === "Received" ? "UPI" : "",
      notes: sourceRaw && !asPhone ? `Taken from: ${sourceRaw}` : "",
      phoneNumber: asPhone || "",
      via,
      roomNumber,
    });
  }

  await connectToDatabase();
  const active = await Booking.find({ bookingStatus: { $ne: "Cancelled" } }).lean();
  const overlap = active.find((b) =>
    isSlotOverlapping(
      start,
      end,
      parseDateTime(b.checkInDate, b.checkInTime),
      parseDateTime(b.checkOutDate, b.checkOutTime)
    )
  );
  if (overlap) {
    return {
      success: false,
      error: `Slot taken by ${overlap.customerName || "another booking"} (${overlap.checkInTime}–${overlap.checkOutTime}).`,
    };
  }

  const paymentStatus = d.paymentStatus === "Received" ? "Paid" : "Pending";
  const doc = await Booking.create({
    customerName,
    phoneNumber: asPhone || "+919999999999",
    guestsCount: 1,
    roomNumber,
    via,
    bookingSource: via || (!asPhone && sourceRaw ? sourceRaw : "Direct"),
    checkInDate: d.checkInDate,
    checkInTime: d.checkInTime,
    checkOutDate: d.checkOutDate,
    checkOutTime: d.checkOutTime,
    roomPrice: Math.round(d.amount / Math.max(totalHours, 1)),
    discount: 0,
    tax: 0,
    advancePaid: paymentStatus === "Paid" ? d.amount : 0,
    finalAmount: d.amount,
    remainingAmount: paymentStatus === "Paid" ? 0 : d.amount,
    paymentStatus,
    bookingStatus: "Reserved",
    totalNights: Math.floor(totalHours / 24),
    totalHours,
    notes: sourceRaw && !asPhone ? `Taken from: ${sourceRaw}` : "",
    createdBy: who.name,
  });

  revalidateAll();
  return { success: true, data: mapBookingDoc(doc.toObject()) };
}

export async function createBookingAction(data: BookingInput) {
  const who = await actor();
  const parsed = bookingSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const phone = normalizeIndianPhone(parsed.data.phoneNumber);
  if (!phone) return { success: false, error: "Invalid Indian phone number." };

  const startNew = parseDateTime(parsed.data.checkInDate, parsed.data.checkInTime);
  const endNew = parseDateTime(parsed.data.checkOutDate, parsed.data.checkOutTime);
  const totalHours = differenceInHours(endNew, startNew);
  if (totalHours <= 0) {
    return { success: false, error: "Check-out must be after Check-in time." };
  }

  await connectToDatabase();
  const active = await Booking.find({ bookingStatus: { $ne: "Cancelled" } }).lean();
  const overlap = active.find((b) =>
    isSlotOverlapping(
      startNew,
      endNew,
      parseDateTime(b.checkInDate, b.checkInTime),
      parseDateTime(b.checkOutDate, b.checkOutTime)
    )
  );
  if (overlap) {
    return { success: false, error: `Slot conflict! Already booked by ${overlap.customerName}.` };
  }

  const amount =
    parsed.data.finalAmount && parsed.data.finalAmount > 0
      ? parsed.data.finalAmount
      : parsed.data.roomPrice * totalHours - parsed.data.discount + parsed.data.tax;

  let paymentStatus: "Paid" | "Partial" | "Pending" =
    parsed.data.paymentStatus === "Received" ? "Paid" : (parsed.data.paymentStatus as "Paid" | "Partial" | "Pending");
  const advancePaid = paymentStatus === "Paid" ? amount : parsed.data.advancePaid;
  if (advancePaid >= amount) paymentStatus = "Paid";
  else if (advancePaid > 0) paymentStatus = "Partial";
  else if (parsed.data.paymentStatus !== "Received") paymentStatus = "Pending";

  const doc = await Booking.create({
    customerName: parsed.data.customerName,
    phoneNumber: phone,
    email: parsed.data.email || "",
    guestsCount: parsed.data.guestsCount,
    roomNumber: "1451",
    via: (parsed.data as any).via || "",
    bookingSource: parsed.data.bookingSource,
    checkInDate: parsed.data.checkInDate,
    checkInTime: parsed.data.checkInTime,
    checkOutDate: parsed.data.checkOutDate,
    checkOutTime: parsed.data.checkOutTime,
    roomPrice: parsed.data.roomPrice,
    discount: parsed.data.discount,
    tax: parsed.data.tax,
    advancePaid,
    finalAmount: amount,
    remainingAmount: Math.max(0, amount - advancePaid),
    paymentStatus,
    paymentMethod: parsed.data.paymentMethod,
    bookingStatus: parsed.data.bookingStatus,
    notes: parsed.data.notes || "",
    totalHours,
    totalNights: Math.floor(totalHours / 24),
    createdBy: who.name,
  });

  revalidateAll();
  return { success: true, data: mapBookingDoc(doc.toObject ? doc.toObject() : doc) };
}

export async function updateBookingAction(id: string, data: BookingInput) {
  const who = await actor();
  const parsed = bookingSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const phone = normalizeIndianPhone(parsed.data.phoneNumber);
  if (!phone) return { success: false, error: "Invalid Indian phone number." };

  const startNew = parseDateTime(parsed.data.checkInDate, parsed.data.checkInTime);
  const endNew = parseDateTime(parsed.data.checkOutDate, parsed.data.checkOutTime);
  const totalHours = differenceInHours(endNew, startNew);
  if (totalHours <= 0) {
    return { success: false, error: "Check-out must be after Check-in time." };
  }

  await connectToDatabase();
  const active = await Booking.find({
    bookingStatus: { $ne: "Cancelled" },
    _id: { $ne: id },
  }).lean();

  const overlap = active.find((b) =>
    isSlotOverlapping(
      startNew,
      endNew,
      parseDateTime(b.checkInDate, b.checkInTime),
      parseDateTime(b.checkOutDate, b.checkOutTime)
    )
  );
  if (overlap) {
    return { success: false, error: `Slot conflict with ${overlap.customerName}.` };
  }

  const amount =
    parsed.data.finalAmount && parsed.data.finalAmount > 0
      ? parsed.data.finalAmount
      : parsed.data.roomPrice * totalHours - parsed.data.discount + parsed.data.tax;
  const advancePaid = parsed.data.advancePaid;
  let paymentStatus: "Paid" | "Partial" | "Pending" =
    parsed.data.paymentStatus === "Received"
      ? "Paid"
      : (parsed.data.paymentStatus as "Paid" | "Partial" | "Pending");
  if (advancePaid >= amount) paymentStatus = "Paid";
  else if (advancePaid > 0) paymentStatus = "Partial";
  else if (parsed.data.paymentStatus !== "Received") paymentStatus = "Pending";

  const doc = await Booking.findByIdAndUpdate(
    id,
    {
      customerName: parsed.data.customerName,
      phoneNumber: phone,
      email: parsed.data.email || "",
      guestsCount: parsed.data.guestsCount,
      via: (parsed.data as any).via || "",
      bookingSource: parsed.data.bookingSource,
      checkInDate: parsed.data.checkInDate,
      checkInTime: parsed.data.checkInTime,
      checkOutDate: parsed.data.checkOutDate,
      checkOutTime: parsed.data.checkOutTime,
      roomPrice: parsed.data.roomPrice,
      discount: parsed.data.discount,
      tax: parsed.data.tax,
      advancePaid,
      finalAmount: amount,
      remainingAmount: Math.max(0, amount - advancePaid),
      paymentStatus,
      paymentMethod: parsed.data.paymentMethod,
      bookingStatus: parsed.data.bookingStatus,
      notes: parsed.data.notes || "",
      totalHours,
      totalNights: Math.floor(totalHours / 24),
      updatedBy: who.name,
    },
    { new: true }
  ).lean();

  if (!doc) return { success: false, error: "Booking not found." };
  revalidateAll();
  return { success: true, data: mapBookingDoc(doc) };
}

export async function cancelBookingAction(id: string) {
  await connectToDatabase();
  await Booking.findByIdAndUpdate(id, { bookingStatus: "Cancelled" });
  revalidateAll();
  return { success: true };
}

export async function updateBookingPaymentAction(
  id: string,
  paymentStatus: "Pending" | "Paid" | "Partial"
) {
  await connectToDatabase();
  const doc = await Booking.findById(id);
  if (!doc) return { success: false, error: "Booking not found." };

  const finalAmount = doc.finalAmount || 0;
  let advancePaid = doc.advancePaid || 0;
  let remainingAmount = doc.remainingAmount || 0;

  if (paymentStatus === "Paid") {
    advancePaid = finalAmount;
    remainingAmount = 0;
  } else if (paymentStatus === "Pending") {
    advancePaid = 0;
    remainingAmount = finalAmount;
  } else {
    // Partial — keep advance if any, else half as default
    if (advancePaid <= 0 || advancePaid >= finalAmount) {
      advancePaid = Math.round(finalAmount / 2);
    }
    remainingAmount = Math.max(0, finalAmount - advancePaid);
  }

  doc.paymentStatus = paymentStatus;
  doc.advancePaid = advancePaid;
  doc.remainingAmount = remainingAmount;
  await doc.save();

  revalidateAll();
  return { success: true, data: mapBookingDoc(doc.toObject()) };
}

export async function getRoomsAction() {
  return { success: true, data: [OG_ROOM] };
}
