import { z } from "zod";
import { indianPhoneMessage, normalizeIndianPhone } from "./phone";
import { normalizeDateInput } from "./time";

const indianPhone = z
  .string()
  .trim()
  .refine((v) => !v || normalizeIndianPhone(v) !== null, { message: indianPhoneMessage });

const indianPhoneRequired = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .refine((v) => normalizeIndianPhone(v) !== null, { message: indianPhoneMessage });

export const roomSchema = z.object({
  roomNumber: z.string().min(1, "Room number is required").trim(),
  name: z.string().min(1, "Room name is required").trim(),
  roomType: z.string().min(1, "Room type is required").trim(),
  floor: z.string().optional().default(""),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  pricePerNight: z.coerce.number().min(0, "Price must be greater than or equal to 0"),
  status: z.enum(["Available", "Occupied", "Maintenance", "Cleaning"]).default("Available"),
  description: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

export type RoomInput = z.infer<typeof roomSchema>;

export const bookingSchema = z
  .object({
  customerName: z.string().trim().optional().default(""),
  phoneNumber: indianPhoneRequired,
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  guestsCount: z.coerce.number().min(1, "Guests count must be at least 1").default(1),
  idProof: z.string().optional().default(""),
  room: z.string().optional().default("1451"),
  bookingSource: z.enum(["Direct", "Airbnb", "Booking.com", "Agoda", "Other"]).default("Direct"),
  checkInDate: z.string().min(1, "Check-in date is required").transform(normalizeDateInput),
  checkInTime: z.string().min(1, "Check-in time is required"),
  checkOutDate: z.string().min(1, "Check-out date is required").transform(normalizeDateInput),
  checkOutTime: z.string().min(1, "Check-out time is required"),
  roomPrice: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
  tax: z.coerce.number().min(0).default(0),
  advancePaid: z.coerce.number().min(0).default(0),
  paymentStatus: z.enum(["Paid", "Partial", "Pending", "Received"]).default("Pending"),
  paymentMethod: z.enum(["Cash", "UPI", "Card", "Bank Transfer"]).optional(),
  bookingStatus: z.enum(["Reserved", "Checked In", "Checked Out", "Cancelled"]).default("Reserved"),
  notes: z.string().optional().default(""),
  finalAmount: z.coerce.number().min(0).optional(),
}).superRefine((data, ctx) => {
  const checkIn = new Date(`${data.checkInDate}T${data.checkInTime}:00+05:30`);
  const checkOut = new Date(`${data.checkOutDate}T${data.checkOutTime}:00+05:30`);
  if (
    !Number.isNaN(checkIn.getTime()) &&
    !Number.isNaN(checkOut.getTime()) &&
    checkOut.getTime() <= checkIn.getTime()
  ) {
    ctx.addIssue({
      code: "custom",
      message: "Check-out must be after check-in",
      path: ["checkOutTime"],
    });
  }
});

export type BookingInput = z.infer<typeof bookingSchema>;

export const commissionSchema = z.object({
  propertyName: z.string().min(1).trim().default("Og Stays (Room 1451)"),
  customerName: z.string().trim().optional().default(""),
  bookingDate: z.string().min(1).transform(normalizeDateInput),
  checkInDate: z.string().min(1).transform(normalizeDateInput),
  checkInTime: z.string().min(1).default("10:00"),
  checkOutDate: z.string().min(1).transform(normalizeDateInput),
  checkOutTime: z.string().min(1).default("16:00"),
  bookingAmount: z.coerce.number().min(0),
  commissionPercentage: z.coerce.number().min(0).max(100).default(10),
  commissionAmount: z.coerce.number().min(0).default(0),
  paymentCollected: z.enum(["Yes", "No"]).default("No"),
  paymentMethod: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  phoneNumber: indianPhone.optional().or(z.literal("")),
  via: z.enum(["", "Group", "Airbnb App", "Instagram", "Referer"]).optional().default(""),
});

export type CommissionInput = z.infer<typeof commissionSchema>;

export const quickRecordSchema = z
  .object({
    entryType: z.enum(["booking", "commission"]),
    checkInDate: z.string().min(1, "Check-in date required").transform(normalizeDateInput),
    checkInTime: z.string().min(1, "Check-in time required"),
    checkOutDate: z.string().min(1, "Check-out date required").transform(normalizeDateInput),
    checkOutTime: z.string().min(1, "Check-out time required"),
    amount: z.coerce.number().min(1, "Amount is required"),
    paymentStatus: z.enum(["Received", "Pending"]),
    sourceOrPhone: z.string().optional().default(""),
    roomNumber: z.string().optional().default(""),
    customerName: z.string().trim().optional().default(""),
    via: z.enum(["", "Group", "Airbnb App", "Instagram", "Referer"]).optional().default(""),
  })
  .superRefine((data, ctx) => {
    const checkIn = new Date(`${data.checkInDate}T${data.checkInTime}:00+05:30`);
    const checkOut = new Date(`${data.checkOutDate}T${data.checkOutTime}:00+05:30`);

    if (Number.isNaN(checkOut.getTime())) {
      ctx.addIssue({
        code: "custom",
        message: "Invalid check-out date/time",
        path: ["checkOutDate"],
      });
    } else {
      if (!Number.isNaN(checkIn.getTime()) && checkOut.getTime() <= checkIn.getTime()) {
        ctx.addIssue({
          code: "custom",
          message: "Check-out must be after check-in",
          path: ["checkOutTime"],
        });
      }
    }

    const raw = data.sourceOrPhone?.trim();
    if (raw) {
      if (/\d/.test(raw) && normalizeIndianPhone(raw) === null && !/[a-zA-Z]{2,}/.test(raw)) {
        ctx.addIssue({
          code: "custom",
          message: indianPhoneMessage,
          path: ["sourceOrPhone"],
        });
      }
    }
  });

export type QuickRecordInput = z.infer<typeof quickRecordSchema>;

export const expenseSchema = z.object({
  title: z.string().min(1, "Title is required").trim(),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
