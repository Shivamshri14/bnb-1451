"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Clock, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { formatSlotAmPm, formatTimeAmPm } from "@/lib/time";

const QUOTES = [
  "Every second lost, is a money lost.",
];

type EmptySlot = {
  _id: string;
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  totalHours: number;
  isBooking?: boolean;
  customerName?: string;
  via?: string;
};

interface EmptySlotsPanelProps {
  slots: EmptySlot[];
  isOccupied?: boolean;
  onBook: () => void;
}

export default function EmptySlotsPanel({ slots, isOccupied = false, onBook }: EmptySlotsPanelProps) {
  const quote = QUOTES[0];

  return (
    <div
      className={`rounded-2xl border p-5 relative overflow-hidden transition-all duration-300 shadow-sm ${
        isOccupied
          ? "border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-teal-500/5"
          : "border-rose-500/20 bg-gradient-to-br from-rose-500/10 to-rose-500/5"
      }`}
    >
      <div className="absolute top-0 right-0 p-32 bg-white/5 blur-3xl rounded-full pointer-events-none -mr-16 -mt-16" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 relative">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {isOccupied ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-500 animate-pulse" />
            )}
            <h2
              className={`font-black text-sm uppercase tracking-widest ${
                isOccupied ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {isOccupied ? "Occupied" : "Empty"}
            </h2>
          </div>
          {!isOccupied && (
            <p className="text-xs text-rose-700/80 dark:text-rose-300/80 font-medium italic mt-0.5">
              &ldquo;{quote}&rdquo;
            </p>
          )}
        </div>
      </div>

      <div className="relative">
        <div className="flex flex-col gap-2">
          {slots.map((slot, index) => {
            const isLifelong = slot.totalHours === -1;
            const isBooking = slot.isBooking;
            const startStr = `${slot.checkInDate}T${slot.checkInTime}:00`;
            
            let startFmt = `${slot.checkInDate} ${slot.checkInTime}`;
            try {
              const sDate = new Date(startStr);
              startFmt = format(sDate, "dd MMM, h:mm a");
            } catch (e) {}

            let endFmt = isLifelong ? "Indefinite" : `${slot.checkOutDate} ${slot.checkOutTime}`;
            try {
              if (!isLifelong) {
                const endStr = `${slot.checkOutDate}T${slot.checkOutTime}:00`;
                const eDate = new Date(endStr);
                endFmt = format(eDate, "dd MMM, h:mm a");
              }
            } catch (e) {}

            if (isLifelong) {
              if (slots.length === 1) {
                if (isOccupied) {
                  return (
                    <div key={slot._id} className="mt-2 text-center p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <h3 className="font-bold text-sm text-emerald-700 dark:text-emerald-400 mb-1">Currently occupied.</h3>
                      <p className="text-xs font-medium text-emerald-700/80 dark:text-emerald-400/80">Free after {startFmt}. Booking lao!</p>
                    </div>
                  );
                } else {
                  return (
                    <div key={slot._id} className="mt-2 text-center p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                      <h3 className="font-bold text-sm text-rose-700 dark:text-rose-400 mb-1">Room is empty.</h3>
                      <p className="text-xs font-medium text-rose-700/80 dark:text-rose-400/80">No upcoming bookings. Booking lao!</p>
                    </div>
                  );
                }
              } else {
                return (
                  <button
                    key={slot._id}
                    type="button"
                    onClick={onBook}
                    className="group relative overflow-hidden rounded-xl px-4 py-2.5 text-xs font-bold cursor-pointer text-left transition-all hover:-translate-y-0.5 hover:shadow-md bg-rose-600 text-white hover:bg-rose-500"
                  >
                    <div className="flex items-center justify-between gap-3 relative z-10">
                      <div>
                        <span className="block opacity-80 text-[10px] uppercase tracking-wider mb-0.5">
                          Free Slot
                        </span>
                        <span className="text-sm">
                          {startFmt} <ArrowRight className="inline h-3 w-3 opacity-70 mx-0.5" /> Indefinite
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        {/* No duration for lifelong */}
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              }
            }

            if (isBooking) {
              return (
                <div
                  key={slot._id}
                  className="group relative overflow-hidden rounded-xl px-4 py-2.5 text-xs font-bold text-left shadow-sm bg-emerald-600 text-white"
                >
                  <div className="flex items-center justify-between gap-3 relative z-10">
                    <div>
                      <span className="block opacity-80 text-[10px] uppercase tracking-wider mb-0.5">
                        Upcoming Booking ({slot.via || "Direct"})
                      </span>
                      <span className="text-sm">
                        {startFmt} <ArrowRight className="inline h-3 w-3 opacity-70 mx-0.5" /> {endFmt}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="block text-[10px] uppercase opacity-80 mb-0.5">Duration</span>
                      <span className="text-sm font-black">
                        {Math.floor(slot.totalHours)}h {Math.round((slot.totalHours % 1) * 60)}m
                      </span>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <button
                key={slot._id}
                type="button"
                onClick={onBook}
                className={`group relative overflow-hidden rounded-xl px-4 py-2.5 text-xs font-bold cursor-pointer text-left transition-all hover:-translate-y-0.5 hover:shadow-md bg-rose-600 text-white hover:bg-rose-500`}
              >
                <div className="flex items-center justify-between gap-3 relative z-10">
                  <div>
                    <span className="block opacity-80 text-[10px] uppercase tracking-wider mb-0.5">
                      Free Slot
                    </span>
                    <span className="text-sm">
                      {startFmt} <ArrowRight className="inline h-3 w-3 opacity-70 mx-0.5" /> {endFmt}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="block text-[10px] uppercase opacity-80 mb-0.5">Duration</span>
                    <span className="text-sm font-black">
                      {isLifelong ? "Lifelong" : `${Math.floor(slot.totalHours)}h ${Math.round((slot.totalHours % 1) * 60)}m`}
                    </span>
                  </div>
                </div>
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
