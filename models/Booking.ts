import mongoose, { Schema, Document, Model } from "mongoose";

export type PaymentStatus = "Paid" | "Partial" | "Pending";
export type BookingStatus = "Reserved" | "Checked In" | "Checked Out" | "Cancelled";
export type ViaChannel = "Group" | "Airbnb App" | "Instagram" | "Referer" | "";

export interface IBooking extends Document {
  customerName: string;
  phoneNumber: string;
  email?: string;
  guestsCount: number;
  roomNumber: string;
  via?: ViaChannel;
  bookingSource: string;
  checkInDate: string; // yyyy-MM-dd
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  totalHours: number;
  totalNights: number;
  roomPrice: number;
  discount: number;
  tax: number;
  finalAmount: number;
  advancePaid: number;
  remainingAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  bookingStatus: BookingStatus;
  notes?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema: Schema<IBooking> = new Schema(
  {
    customerName: { type: String, required: false, trim: true, default: "" },
    phoneNumber: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: "" },
    guestsCount: { type: Number, required: true, min: 1, default: 1 },
    roomNumber: { type: String, required: false, default: "1451", trim: true },
    via: {
      type: String,
      enum: ["Group", "Airbnb App", "Instagram", "Referer", ""],
      default: "",
    },
    bookingSource: { type: String, default: "Direct", trim: true },
    checkInDate: { type: String, required: true },
    checkInTime: { type: String, required: true },
    checkOutDate: { type: String, required: true },
    checkOutTime: { type: String, required: true },
    totalHours: { type: Number, required: true, min: 0 },
    totalNights: { type: Number, required: true, min: 0, default: 0 },
    roomPrice: { type: Number, required: true, min: 0, default: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    finalAmount: { type: Number, required: true, min: 0 },
    advancePaid: { type: Number, default: 0, min: 0 },
    remainingAmount: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: ["Paid", "Partial", "Pending"],
      default: "Pending",
    },
    paymentMethod: { type: String, trim: true },
    bookingStatus: {
      type: String,
      enum: ["Reserved", "Checked In", "Checked Out", "Cancelled"],
      default: "Reserved",
    },
    notes: { type: String, trim: true, default: "" },
    createdBy: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

BookingSchema.index({ checkInDate: 1, checkOutDate: 1 });
BookingSchema.index({ bookingStatus: 1 });
BookingSchema.index({ paymentStatus: 1 });

// Drop old model definition during hot reload so schema updates apply
if (mongoose.models.Booking) {
  delete mongoose.models.Booking;
}

const Booking: Model<IBooking> = mongoose.model<IBooking>("Booking", BookingSchema);

export default Booking;
