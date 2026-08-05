import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOtp extends Document {
  email: string;
  code: string;
  purpose: "reset" | "signup";
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

const OtpSchema: Schema<IOtp> = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    code: { type: String, required: true },
    purpose: { type: String, enum: ["reset", "signup"], default: "reset" },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

if (mongoose.models.Otp) {
  delete mongoose.models.Otp;
}

const Otp: Model<IOtp> = mongoose.model<IOtp>("Otp", OtpSchema);

export default Otp;
