"use server";

import { OG_ROOM } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import { roomSchema, RoomInput } from "@/lib/validations";

type RoomStatus = "Available" | "Occupied" | "Maintenance" | "Cleaning";

type RoomRecord = Omit<typeof OG_ROOM, "status"> & { status: RoomStatus };

declare global {
  // eslint-disable-next-line no-var
  var __bnbRoom: RoomRecord | undefined;
}

function getRoom(): RoomRecord {
  if (!global.__bnbRoom) {
    global.__bnbRoom = { ...OG_ROOM };
  }
  return global.__bnbRoom;
}

export async function getRoomsAction(_filters?: {
  search?: string;
  status?: string;
  roomType?: string;
}) {
  return { success: true as const, data: [getRoom()] };
}

export async function createRoomAction(_data: RoomInput) {
  return {
    success: false as const,
    error: "This portal manages a single flat: Og Stays · Room 1451.",
  };
}

export async function updateRoomAction(_id: string, data: RoomInput) {
  const parsed = roomSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0].message };
  }

  global.__bnbRoom = {
    ...getRoom(),
    ...parsed.data,
    roomNumber: "1451",
    name: "Og Stays",
    _id: "room-1451",
    isActive: true,
    images: [],
    pricePerHour: 200,
    status: parsed.data.status as RoomStatus,
  };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/rooms");
  return { success: true as const, data: getRoom() };
}

export async function deleteRoomAction(_id: string) {
  return {
    success: false as const,
    error: "Cannot remove the only flat (Og Stays · 1451).",
  };
}

export async function updateRoomStatusAction(_id: string, status: RoomStatus) {
  global.__bnbRoom = { ...getRoom(), status };
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/rooms");
  return { success: true as const, data: getRoom() };
}
