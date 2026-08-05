import mongoose, { Schema, Document, Model } from "mongoose";

export type ViaChannel = "Group" | "Airbnb App" | "Instagram" | "Referer" | "";

export interface ICommissionBooking extends Document {
  propertyName: string;
  customerName: string;
  roomNumber: string;
  via?: ViaChannel;
  phoneNumber?: string;
  bookingDate: string;
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  commissionPercentage: number;
  commissionAmount: number;
  bookingAmount: number;
  paymentCollected: "Yes" | "No";
  paymentMethod?: string;
  notes?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommissionBookingSchema: Schema<ICommissionBooking> = new Schema(
  {
    propertyName: { type: String, required: true, trim: true },
    customerName: { type: String, required: true, trim: true },
    roomNumber: { type: String, required: true, trim: true, default: "1451" },
    via: {
      type: String,
      enum: ["Group", "Airbnb App", "Instagram", "Referer", ""],
      default: "",
    },
    phoneNumber: { type: String, trim: true, default: "" },
    bookingDate: { type: String, required: true },
    checkInDate: { type: String, required: true },
    checkInTime: { type: String, required: true, default: "10:00" },
    checkOutDate: { type: String, required: true },
    checkOutTime: { type: String, required: true, default: "16:00" },
    commissionPercentage: { type: Number, required: true, min: 0, max: 100 },
    commissionAmount: { type: Number, required: true, min: 0 },
    bookingAmount: { type: Number, required: true, min: 0 },
    paymentCollected: { type: String, enum: ["Yes", "No"], default: "No" },
    paymentMethod: { type: String, trim: true, default: "" },
    notes: { type: String, default: "" },
    createdBy: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

CommissionBookingSchema.index({ checkInDate: 1, checkOutDate: 1 });
CommissionBookingSchema.index({ paymentCollected: 1 });

if (mongoose.models.CommissionBooking) {
  delete mongoose.models.CommissionBooking;
}

const CommissionBooking: Model<ICommissionBooking> = mongoose.model<ICommissionBooking>(
  "CommissionBooking",
  CommissionBookingSchema
);

export default CommissionBooking;
