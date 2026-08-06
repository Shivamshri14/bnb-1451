"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Clock } from "lucide-react";
import { formatSlotAmPm, formatTimeAmPm } from "@/lib/time";

const QUOTES = [
  "Every second lost, is a money lost.",
];

type EmptySlot = {
  _id: string;
  checkInTime: string;
  checkOutTime: string;
  totalHours: number;
};

interface EmptySlotsPanelProps {
  slots: EmptySlot[];
  onBook: () => void;
}

export default function EmptySlotsPanel({ slots, onBook }: EmptySlotsPanelProps) {
  const [now, setNow] = useState<Date | null>(null);
  const quote = QUOTES[0];

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const nowLabel = now ? format(now, "dd-MM-yyyy · h:mm:ss a") : "";

  const currentHM = now ? format(now, "HH:mm") : "00:00";
  const validSlots = slots
    .filter((s) => s.checkOutTime > currentHM)
    .map((s) => {
      if (s.checkInTime < currentHM) {
        return { ...s, checkInTime: currentHM };
      }
      return s;
    });

  return (
    <div className="rounded-2xl border border-rose-500/40 bg-rose-500/15 p-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-rose-600" />
            <h2 className="font-bold text-sm text-rose-700 dark:text-rose-300">
              Empty slots from now
            </h2>
          </div>
          <p className="text-[11px] text-rose-700/90 dark:text-rose-300/90 mt-1 italic">
            &ldquo;{quote}&rdquo;
          </p>
        </div>
        {nowLabel && (
          <div className="rounded-xl bg-rose-600 text-white px-3 py-2 text-center shrink-0">
            <div className="text-[9px] uppercase font-bold opacity-80">Now</div>
            <div className="text-sm font-black tabular-nums">{nowLabel.split(" · ")[1]}</div>
            <div className="text-[10px] opacity-90">{nowLabel.split(" · ")[0]}</div>
          </div>
        )}
      </div>

      {validSlots.length === 0 ? (
        <p className="text-xs text-rose-700/80 dark:text-rose-300/80">
          No bookable gaps left today from current time (or fully booked).
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {validSlots.map((slot) => (
            <button
              key={slot._id}
              type="button"
              onClick={onBook}
              className="rounded-xl bg-rose-600 text-white px-3 py-2 text-xs font-bold cursor-pointer hover:bg-rose-700 text-left"
            >
              <span className="block opacity-90 text-[10px]">From {formatTimeAmPm(slot.checkInTime)}</span>
              <span>{formatSlotAmPm(slot.checkInTime, slot.checkOutTime)}</span>
              <span className="opacity-80 font-semibold"> · {slot.totalHours}h free</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
