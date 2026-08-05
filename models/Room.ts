import mongoose, { Schema, Document, Model } from "mongoose";

export type RoomStatus = "Available" | "Occupied" | "Maintenance" | "Cleaning";

export interface IRoom extends Document {
  roomNumber: string;
  name: string;
  roomType: string;
  floor?: string;
  capacity: number;
  pricePerNight: number;
  status: RoomStatus;
  description?: string;
  notes?: string;
  images?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema: Schema<IRoom> = new Schema(
  {
    roomNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    roomType: {
      type: String,
      required: true,
      trim: true,
    },
    floor: {
      type: String,
      trim: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    pricePerNight: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["Available", "Occupied", "Maintenance", "Cleaning"],
      default: "Available",
    },
    description: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add index on roomNumber and status for optimized searching
RoomSchema.index({ roomNumber: 1 });
RoomSchema.index({ status: 1 });
RoomSchema.index({ isActive: 1 });

const Room: Model<IRoom> = mongoose.models.Room || mongoose.model<IRoom>("Room", RoomSchema);

export default Room;
