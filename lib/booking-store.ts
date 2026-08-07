import {
  parseISO,
  differenceInHours,
  addDays,
  format,
  isAfter,
  isBefore,
  startOfDay,
  endOfDay,
} from "date-fns";
import { OG_ROOM } from "./constants";

export type BookingRecord = {
  _id: string;
  customerName: string;
  phoneNumber: string;
  email?: string;
  guestsCount: number;
  room: typeof OG_ROOM;
  roomNumber?: string;
  via?: string;
  bookingSource: string;
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  roomPrice: number;
  discount: number;
  tax: number;
  advancePaid: number;
  finalAmount: number;
  remainingAmount: number;
  paymentStatus: string;
  paymentMethod?: string;
  bookingStatus: string;
  totalNights: number;
  totalHours: number;
  notes?: string;
  createdAt?: string;
  createdBy?: string;
};

export function parseDateTime(dateStr: string, timeStr: string): Date {
  return parseISO(`${dateStr}T${timeStr}:00`);
}

export function isSlotOverlapping(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return isBefore(start1, end2) && isAfter(end1, start2);
}

export type GapSlot = {
  _id: string;
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  totalHours: number;
  isGap?: boolean;
  isBooking?: boolean;
  customerName?: string;
  via?: string;
};

export function computeGaps(
  bookings: BookingRecord[],
  daysAhead = 3,
  fromDate?: Date
): GapSlot[] {
  const sortedActive = [...bookings]
    .filter((b) => b.bookingStatus !== "Cancelled")
    .sort(
      (a, b) =>
        parseDateTime(a.checkInDate, a.checkInTime).getTime() -
        parseDateTime(b.checkInDate, b.checkInTime).getTime()
    );

  let currentPointer = fromDate ? new Date(fromDate) : new Date();
  const gaps: GapSlot[] = [];

  for (const b of sortedActive) {
    const start = parseDateTime(b.checkInDate, b.checkInTime);
    const end = parseDateTime(b.checkOutDate, b.checkOutTime);

    if (start.getTime() > currentPointer.getTime()) {
      const exactMs = start.getTime() - currentPointer.getTime();
      const exactHours = exactMs / (1000 * 60 * 60);
      gaps.push({
        _id: `gap-${currentPointer.getTime()}`,
        checkInDate: format(currentPointer, "yyyy-MM-dd"),
        checkInTime: format(currentPointer, "HH:mm"),
        checkOutDate: format(start, "yyyy-MM-dd"),
        checkOutTime: format(start, "HH:mm"),
        totalHours: exactHours,
        isGap: true,
      });
    }

    if (end.getTime() > currentPointer.getTime()) {
      // If the booking is in the future, push it into the timeline as well!
      if (start.getTime() >= currentPointer.getTime()) {
        const exactMs = end.getTime() - start.getTime();
        const exactHours = exactMs / (1000 * 60 * 60);
        gaps.push({
          _id: `booking-${b._id}`,
          checkInDate: b.checkInDate,
          checkInTime: b.checkInTime,
          checkOutDate: b.checkOutDate,
          checkOutTime: b.checkOutTime,
          totalHours: exactHours,
          isBooking: true,
          customerName: b.customerName,
          via: b.via || b.bookingSource,
        });
      }
      currentPointer = end;
    }
  }

  gaps.push({
    _id: `gap-lifelong-${currentPointer.getTime()}`,
    checkInDate: format(currentPointer, "yyyy-MM-dd"),
    checkInTime: format(currentPointer, "HH:mm"),
    checkOutDate: "",
    checkOutTime: "Indefinite",
    totalHours: -1,
    isGap: true,
  });

  return gaps;
}

export function buildDayTimeline(bookings: BookingRecord[], day: string) {
  const dayStart = startOfDay(parseISO(day));
  const dayEnd = endOfDay(parseISO(day));

  const overlapping = bookings
    .filter((b) => b.bookingStatus !== "Cancelled")
    .map((b) => {
      const start = parseDateTime(b.checkInDate, b.checkInTime);
      const end = parseDateTime(b.checkOutDate, b.checkOutTime);
      return { booking: b, start, end };
    })
    .filter(({ start, end }) => isBefore(start, dayEnd) && isAfter(end, dayStart))
    .map(({ booking, start, end }) => {
      const clippedStart = isBefore(start, dayStart) ? dayStart : start;
      const clippedEnd = isAfter(end, dayEnd) ? dayEnd : end;
      return {
        type: "booked" as const,
        _id: booking._id,
        checkInDate: format(clippedStart, "yyyy-MM-dd"),
        checkInTime: format(clippedStart, "HH:mm"),
        checkOutDate: format(clippedEnd, "yyyy-MM-dd"),
        checkOutTime: format(clippedEnd, "HH:mm"),
        totalHours: Math.max(1, differenceInHours(clippedEnd, clippedStart) || 1),
        amount: booking.finalAmount,
        customerName: booking.customerName,
        bookingStatus: booking.bookingStatus,
        paymentStatus: booking.paymentStatus,
        bookingSource: booking.via || booking.bookingSource,
        phoneNumber: booking.phoneNumber,
        raw: booking,
      };
    })
    .sort(
      (a, b) =>
        parseDateTime(a.checkInDate, a.checkInTime).getTime() -
        parseDateTime(b.checkInDate, b.checkInTime).getTime()
    );

  const segments: Array<
    | (typeof overlapping)[number]
    | {
        type: "empty";
        _id: string;
        checkInDate: string;
        checkInTime: string;
        checkOutDate: string;
        checkOutTime: string;
        totalHours: number;
      }
  > = [];

  let cursor = dayStart;
  for (const block of overlapping) {
    const blockStart = parseDateTime(block.checkInDate, block.checkInTime);
    if (isAfter(blockStart, cursor)) {
      const hours = differenceInHours(blockStart, cursor);
      if (hours >= 1 || blockStart.getTime() - cursor.getTime() >= 30 * 60 * 1000) {
        segments.push({
          type: "empty",
          _id: `empty-${cursor.getTime()}`,
          checkInDate: format(cursor, "yyyy-MM-dd"),
          checkInTime: format(cursor, "HH:mm"),
          checkOutDate: format(blockStart, "yyyy-MM-dd"),
          checkOutTime: format(blockStart, "HH:mm"),
          totalHours: Math.max(1, hours || 1),
        });
      }
    }
    segments.push(block);
    cursor = parseDateTime(block.checkOutDate, block.checkOutTime);
  }

  if (isBefore(cursor, dayEnd)) {
    const hours = differenceInHours(dayEnd, cursor);
    if (hours >= 1) {
      segments.push({
        type: "empty",
        _id: `empty-end-${cursor.getTime()}`,
        checkInDate: format(cursor, "yyyy-MM-dd"),
        checkInTime: format(cursor, "HH:mm"),
        checkOutDate: format(dayEnd, "yyyy-MM-dd"),
        checkOutTime: "23:59",
        totalHours: hours,
      });
    }
  }

  return segments;
}

/** Empty gaps for today — only from `now` onward (past slots removed). */
export function filterEmptySlotsFromNow(
  slots: Array<{
    _id: string;
    checkInDate: string;
    checkInTime: string;
    checkOutDate: string;
    checkOutTime: string;
    totalHours: number;
  }>,
  now = new Date()
) {
  return slots
    .map((slot) => {
      const slotStart = parseDateTime(slot.checkInDate, slot.checkInTime);
      const effectiveStart = slotStart.getTime() < now.getTime() ? now : slotStart;

      if (slot.totalHours === -1) {
        return {
          ...slot,
          checkInDate: format(effectiveStart, "yyyy-MM-dd"),
          checkInTime: format(effectiveStart, "HH:mm"),
        };
      }

      const slotEnd = parseDateTime(slot.checkOutDate, slot.checkOutTime);

      if (effectiveStart.getTime() >= slotEnd.getTime()) return null;

      const ms = slotEnd.getTime() - effectiveStart.getTime();
      if (ms < 30 * 60 * 1000) return null;

      const hours = Math.max(0.5, Math.round((ms / (1000 * 60 * 60)) * 10) / 10);

      return {
        ...slot,
        checkInDate: format(effectiveStart, "yyyy-MM-dd"),
        checkInTime: format(effectiveStart, "HH:mm"),
        totalHours: hours,
      };
    })
    .filter(Boolean) as typeof slots;
}

export function mapBookingDoc(doc: any): BookingRecord {
  return {
    _id: String(doc._id),
    customerName: doc.customerName,
    phoneNumber: doc.phoneNumber,
    email: doc.email || "",
    guestsCount: doc.guestsCount || 1,
    room: { ...OG_ROOM, roomNumber: doc.roomNumber || "1451" },
    roomNumber: doc.roomNumber || "1451",
    via: doc.via || "",
    bookingSource: doc.bookingSource || doc.via || "Direct",
    checkInDate: doc.checkInDate,
    checkInTime: doc.checkInTime,
    checkOutDate: doc.checkOutDate,
    checkOutTime: doc.checkOutTime,
    roomPrice: doc.roomPrice || 0,
    discount: doc.discount || 0,
    tax: doc.tax || 0,
    advancePaid: doc.advancePaid || 0,
    finalAmount: doc.finalAmount || 0,
    remainingAmount: doc.remainingAmount || 0,
    paymentStatus: doc.paymentStatus || "Pending",
    paymentMethod: doc.paymentMethod,
    bookingStatus: doc.bookingStatus || "Reserved",
    totalNights: doc.totalNights || 0,
    totalHours: doc.totalHours || 0,
    notes: doc.notes || "",
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
    createdBy: doc.createdBy || "",
  };
}
