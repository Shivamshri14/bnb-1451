"use server";

import { commissionSchema, CommissionInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { format, parseISO, differenceInHours, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db";
import CommissionBooking from "@/models/CommissionBooking";
import { getISTDateString, formatISTDate, formatISTTime } from "@/lib/booking-store";

export type CommissionRecord = {
  _id: string;
  propertyName: string;
  customerName: string;
  bookingDate: string;
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  bookingAmount: number;
  commissionPercentage: number;
  commissionAmount: number;
  paymentCollected: "Yes" | "No";
  paymentMethod: string;
  notes: string;
  phoneNumber?: string;
  roomNumber?: string;
  via?: string;
  createdAt?: string;
  createdBy?: string;
};

async function actorName() {
  const session = await auth();
  return session?.user?.name || session?.user?.email || "Owner";
}

function mapCommission(doc: any): CommissionRecord {
  return {
    _id: String(doc._id),
    propertyName: doc.propertyName,
    customerName: doc.customerName,
    bookingDate: doc.bookingDate,
    checkInDate: doc.checkInDate,
    checkInTime: doc.checkInTime,
    checkOutDate: doc.checkOutDate,
    checkOutTime: doc.checkOutTime,
    bookingAmount: doc.bookingAmount,
    commissionPercentage: doc.commissionPercentage,
    commissionAmount: doc.commissionAmount,
    paymentCollected: doc.paymentCollected,
    paymentMethod: doc.paymentMethod || "",
    notes: doc.notes || "",
    phoneNumber: doc.phoneNumber || "",
    roomNumber: doc.roomNumber || "",
    via: doc.via || "",
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
    createdBy: doc.createdBy || "",
  };
}

function parseDT(date: string, time: string) {
  const base = `${date}T${time}:00`;
  if (base.includes("+") || base.includes("Z") || /-\d{2}:\d{2}$/.test(base)) {
    return parseISO(base);
  }
  return parseISO(`${base}+05:30`);
}

function buildCommissionDayTimeline(list: CommissionRecord[], day: string) {
  const dayStart = parseDT(day, "00:00");
  const dayEnd = parseDT(day, "23:59");

  const overlapping = list
    .map((c) => {
      const start = parseDT(c.checkInDate, c.checkInTime || "14:00");
      const end = parseDT(c.checkOutDate, c.checkOutTime || "11:00");
      return { c, start, end };
    })
    .filter(({ start, end }) => isBefore(start, dayEnd) && isAfter(end, dayStart))
    .map(({ c, start, end }) => {
      const clippedStart = isBefore(start, dayStart) ? dayStart : start;
      const clippedEnd = isAfter(end, dayEnd) ? dayEnd : end;
      return {
        type: "booked" as const,
        _id: c._id,
        checkInDate: formatISTDate(clippedStart),
        checkInTime: formatISTTime(clippedStart),
        checkOutDate: formatISTDate(clippedEnd),
        checkOutTime: formatISTTime(clippedEnd),
        totalHours: Math.max(1, differenceInHours(clippedEnd, clippedStart) || 1),
        amount: c.commissionAmount,
        customerName: c.customerName,
        bookingStatus: c.paymentCollected === "Yes" ? "Collected" : "Pending",
        paymentStatus: c.paymentCollected === "Yes" ? "Paid" : "Pending",
        bookingSource: c.via || c.propertyName,
        raw: c,
      };
    })
    .sort(
      (a, b) =>
        parseDT(a.checkInDate, a.checkInTime).getTime() -
        parseDT(b.checkInDate, b.checkInTime).getTime()
    );

  const segments: any[] = [];
  let cursor = dayStart;
  for (const block of overlapping) {
    const blockStart = parseDT(block.checkInDate, block.checkInTime);
    if (isAfter(blockStart, cursor)) {
      const hours = differenceInHours(blockStart, cursor);
      if (hours >= 1 || blockStart.getTime() - cursor.getTime() >= 30 * 60 * 1000) {
        segments.push({
          type: "empty",
          _id: `c-empty-${cursor.getTime()}`,
          checkInDate: formatISTDate(cursor),
          checkInTime: formatISTTime(cursor),
          checkOutDate: formatISTDate(blockStart),
          checkOutTime: formatISTTime(blockStart),
          totalHours: Math.max(1, hours || 1),
        });
      }
    }
    segments.push(block);
    cursor = parseDT(block.checkOutDate, block.checkOutTime);
  }

  if (isBefore(cursor, dayEnd)) {
    const hours = differenceInHours(dayEnd, cursor);
    if (hours >= 1) {
      segments.push({
        type: "empty",
        _id: `c-empty-end-${cursor.getTime()}`,
        checkInDate: formatISTDate(cursor),
        checkInTime: formatISTTime(cursor),
        checkOutDate: formatISTDate(dayEnd),
        checkOutTime: "23:59",
        totalHours: hours,
      });
    }
  }

  return segments;
}

export async function getCommissionsAction(filters?: {
  search?: string;
  paymentCollected?: string;
  day?: string;
}) {
  await connectToDatabase();
  const query: any = {};

  if (filters?.paymentCollected && filters.paymentCollected !== "ALL") {
    query.paymentCollected = filters.paymentCollected;
  }

  if (filters?.search) {
    const s = filters.search;
    query.$or = [
      { customerName: new RegExp(s, "i") },
      { propertyName: new RegExp(s, "i") },
      { createdBy: new RegExp(s, "i") },
      { via: new RegExp(s, "i") },
    ];
  }

  const docs = await CommissionBooking.find(query).sort({ createdAt: -1 }).lean();
  const list = docs.map(mapCommission);
  const day = filters?.day || getISTDateString(new Date());

  return {
    success: true,
    data: list,
    timeline: buildCommissionDayTimeline(list, day),
    day,
  };
}

export async function createCommissionAction(
  data: CommissionInput & { roomNumber?: string; via?: string }
) {
  const parsed = commissionSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  await connectToDatabase();
  const who = await actorName();
  const { bookingAmount, commissionPercentage } = parsed.data;
  const commissionAmount =
    parsed.data.commissionAmount > 0
      ? parsed.data.commissionAmount
      : (bookingAmount * commissionPercentage) / 100;

  const doc = await CommissionBooking.create({
    propertyName: parsed.data.propertyName,
    customerName: parsed.data.customerName || "",
    bookingDate: parsed.data.bookingDate,
    checkInDate: parsed.data.checkInDate,
    checkInTime: parsed.data.checkInTime || "10:00",
    checkOutDate: parsed.data.checkOutDate,
    checkOutTime: parsed.data.checkOutTime || "16:00",
    bookingAmount,
    commissionPercentage,
    commissionAmount,
    paymentCollected: parsed.data.paymentCollected,
    paymentMethod: parsed.data.paymentMethod || "",
    notes: parsed.data.notes || "",
    phoneNumber: parsed.data.phoneNumber || "",
    roomNumber: data.roomNumber || "1451",
    via: data.via || parsed.data.via || "",
    createdBy: who,
  });

  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard");
  return { success: true, data: mapCommission(doc.toObject()) };
}

export async function updateCommissionAction(id: string, data: CommissionInput) {
  const parsed = commissionSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  await connectToDatabase();
  const { bookingAmount, commissionPercentage } = parsed.data;
  const commissionAmount = (bookingAmount * commissionPercentage) / 100;

  const doc = await CommissionBooking.findByIdAndUpdate(
    id,
    {
      ...parsed.data,
      checkInTime: parsed.data.checkInTime || "10:00",
      checkOutTime: parsed.data.checkOutTime || "16:00",
      commissionAmount,
      paymentMethod: parsed.data.paymentMethod || "",
      notes: parsed.data.notes || "",
    },
    { new: true }
  ).lean();

  if (!doc) return { success: false, error: "Record not found." };
  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard");
  return { success: true, data: mapCommission(doc) };
}

export async function deleteCommissionAction(id: string) {
  await connectToDatabase();
  await CommissionBooking.findByIdAndDelete(id);
  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard");
  return { success: true };
}
