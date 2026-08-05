"use client";

import { format, parseISO, addDays, subDays } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Clock, Banknote } from "lucide-react";
import { formatSlotAmPm } from "@/lib/time";

export type TimelineSegment =
  | {
      type: "booked";
      _id: string;
      checkInDate: string;
      checkInTime: string;
      checkOutDate: string;
      checkOutTime: string;
      totalHours: number;
      amount: number;
      customerName: string;
      bookingStatus: string;
      paymentStatus: string;
      bookingSource: string;
      phoneNumber?: string;
      raw?: any;
    }
  | {
      type: "empty";
      _id: string;
      checkInDate: string;
      checkInTime: string;
      checkOutDate: string;
      checkOutTime: string;
      totalHours: number;
    };

interface DayTimelineProps {
  day: string;
  segments: TimelineSegment[];
  onDayChange: (day: string) => void;
  onBookEmpty: (slot: Extract<TimelineSegment, { type: "empty" }>) => void;
  onSelectBooking?: (seg: Extract<TimelineSegment, { type: "booked" }>) => void;
  title?: string;
  subtitle?: string;
}

export default function DayTimeline({
  day,
  segments,
  onDayChange,
  onBookEmpty,
  onSelectBooking,
  title = "Today's hour board",
  subtitle = "Booked blocks vs empty gaps — tap a gap to book it",
}: DayTimelineProps) {
  const dayDate = parseISO(day);
  const isToday = format(new Date(), "yyyy-MM-dd") === day;

  const totalHoursInDay = 24;
  const bookedHours = segments
    .filter((s) => s.type === "booked")
    .reduce((sum, s) => sum + s.totalHours, 0);
  const emptyHours = segments
    .filter((s) => s.type === "empty")
    .reduce((sum, s) => sum + s.totalHours, 0);
  const revenue = segments
    .filter((s): s is Extract<TimelineSegment, { type: "booked" }> => s.type === "booked")
    .reduce((sum, s) => sum + (s.amount || 0), 0);

  return (
    <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
            {title}
          </h2>
          <p className="text-sm text-muted mt-0.5">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <button
            type="button"
            onClick={() => onDayChange(format(subDays(dayDate, 1), "yyyy-MM-dd"))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface-muted text-foreground hover:bg-brand-soft transition cursor-pointer"
            aria-label="Previous day"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="min-w-[9.5rem] text-center">
            <div className="text-sm font-bold text-foreground">
              {format(dayDate, "EEE, d MMM")}
            </div>
            {isToday && (
              <div className="text-[10px] font-semibold uppercase tracking-wider text-brand">
                Today
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => onDayChange(format(addDays(dayDate, 1), "yyyy-MM-dd"))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface-muted text-foreground hover:bg-brand-soft transition cursor-pointer"
            aria-label="Next day"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          {!isToday && (
            <button
              type="button"
              onClick={() => onDayChange(format(new Date(), "yyyy-MM-dd"))}
              className="ml-1 rounded-xl px-3 py-2 text-xs font-semibold border border-border text-muted hover:text-foreground hover:bg-surface-muted cursor-pointer"
            >
              Jump to today
            </button>
          )}
        </div>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
        <div className="rounded-xl bg-brand-soft/60 border border-border/60 px-3 py-2">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-muted">Booked</div>
          <div className="text-sm sm:text-base font-bold text-booked">{bookedHours}h</div>
        </div>
        <div className="rounded-xl bg-[color-mix(in_oklab,var(--empty)_12%,transparent)] border border-border/60 px-3 py-2">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-muted">Empty</div>
          <div className="text-sm sm:text-base font-bold text-empty">{emptyHours}h</div>
        </div>
        <div className="rounded-xl bg-accent-soft/70 border border-border/60 px-3 py-2">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-muted">Day revenue</div>
          <div className="text-sm sm:text-base font-bold text-accent">₹{revenue.toLocaleString("en-IN")}</div>
        </div>
      </div>

      {/* Horizontal proportion bar */}
      <div className="mb-4 h-3 w-full overflow-hidden rounded-full bg-surface-muted flex">
        {segments.map((seg) => {
          const width = Math.max(2, (seg.totalHours / totalHoursInDay) * 100);
          return (
            <div
              key={`bar-${seg._id}`}
              title={`${formatSlotAmPm(seg.checkInTime, seg.checkOutTime)}`}
              style={{ width: `${width}%` }}
              className={
                seg.type === "booked"
                  ? "bg-booked"
                  : "bg-empty/40 border-x border-dashed border-empty/50"
              }
            />
          );
        })}
      </div>

      {/* Slot cards */}
      <div className="space-y-2.5">
        {segments.length === 0 && (
          <p className="text-sm text-muted text-center py-8">No slots for this day yet.</p>
        )}

        {segments.map((seg) => {
          if (seg.type === "empty") {
            return (
              <button
                key={seg._id}
                type="button"
                onClick={() => onBookEmpty(seg)}
                className="w-full text-left group rounded-2xl border border-dashed border-empty/50 bg-[color-mix(in_oklab,var(--empty)_8%,transparent)] hover:bg-[color-mix(in_oklab,var(--empty)_14%,transparent)] px-4 py-3.5 transition cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-empty font-bold text-sm">
                      <Clock className="h-4 w-4" />
                      {formatSlotAmPm(seg.checkInTime, seg.checkOutTime)}
                      <span className="text-xs font-semibold opacity-80">
                        ({seg.totalHours}h empty)
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-1">
                      Vacant — tap to book this gap or note a future booking
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-empty text-white text-xs font-bold px-2.5 py-1.5 group-hover:scale-[1.02] transition">
                    <Plus className="h-3.5 w-3.5" /> Book
                  </span>
                </div>
              </button>
            );
          }

          return (
            <button
              key={seg._id}
              type="button"
              onClick={() => onSelectBooking?.(seg)}
              className="w-full text-left rounded-2xl border border-border bg-brand-soft/40 hover:bg-brand-soft/70 px-4 py-3.5 transition cursor-pointer"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-foreground">{seg.customerName || "—"}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wide rounded-md px-1.5 py-0.5 bg-surface text-muted border border-border">
                      {seg.bookingStatus}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wide rounded-md px-1.5 py-0.5 bg-surface text-muted border border-border">
                      {seg.bookingSource}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-booked font-semibold">
                    <Clock className="h-3.5 w-3.5" />
                    {formatSlotAmPm(seg.checkInTime, seg.checkOutTime)}
                    <span className="text-xs text-muted font-medium">· {seg.totalHours}h</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-foreground font-black">
                  <Banknote className="h-4 w-4 text-accent" />
                  ₹{seg.amount.toLocaleString("en-IN")}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
