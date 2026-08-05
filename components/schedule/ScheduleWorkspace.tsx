"use client";

import { useMemo, useState } from "react";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import QuickRecordModal from "@/components/home/QuickRecordModal";
import { formatSlotAmPm, formatTimeAmPm } from "@/lib/time";

type CalEvent = {
  id: string;
  kind: "booking" | "commission";
  date: string;
  startTime: string;
  endTime: string;
  endDate: string;
  title: string;
  amount: number;
  payment: string;
  via?: string;
  createdBy?: string;
  createdAt?: string;
};

interface ScheduleWorkspaceProps {
  initialBookings: any[];
  initialCommissions: any[];
  commissionTimeline?: any[];
  initialDay?: string;
}

function toEvents(bookings: any[], commissions: any[]): CalEvent[] {
  const bookingEvents: CalEvent[] = bookings
    .filter((b) => b.bookingStatus !== "Cancelled")
    .map((b) => ({
      id: b._id,
      kind: "booking" as const,
      date: b.checkInDate,
      startTime: b.checkInTime,
      endTime: b.checkOutTime,
      endDate: b.checkOutDate,
      title: b.customerName || "—",
      amount: b.finalAmount,
      payment: b.paymentStatus,
      via: b.via || "",
      createdBy: b.createdBy,
      createdAt: b.createdAt,
    }));

  const commissionEvents: CalEvent[] = commissions.map((c) => ({
    id: c._id,
    kind: "commission" as const,
    date: c.checkInDate,
    startTime: c.checkInTime,
    endTime: c.checkOutTime,
    endDate: c.checkOutDate,
    title: c.customerName || "—",
    amount: c.commissionAmount ?? c.bookingAmount,
    payment: c.paymentCollected === "Yes" ? "Received" : "Pending",
    via: c.via || "",
    createdBy: c.createdBy,
    createdAt: c.createdAt,
  }));

  return [...bookingEvents, ...commissionEvents];
}

export default function ScheduleWorkspace({
  initialBookings,
  initialCommissions,
  initialDay,
}: ScheduleWorkspaceProps) {
  const seedDay = initialDay || format(new Date(), "yyyy-MM-dd");
  const [bookings, setBookings] = useState(initialBookings);
  const [commissions, setCommissions] = useState(initialCommissions);
  const [cursor, setCursor] = useState(() => startOfMonth(parseISO(seedDay)));
  const [selected, setSelected] = useState(seedDay);
  const [open, setOpen] = useState(false);

  const events = useMemo(() => toEvents(bookings, commissions), [bookings, commissions]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const ev of events) {
      // count on check-in day primarily; also mark end day if multi-day
      const keys = new Set([ev.date, ev.endDate]);
      keys.forEach((k) => {
        const list = map.get(k) || [];
        list.push(ev);
        map.set(k, list);
      });
    }
    return map;
  }, [events]);

  const dayEvents = (eventsByDay.get(selected) || []).sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );

  const refresh = async () => {
    const [{ getBookingsAction }, { getCommissionsAction }] = await Promise.all([
      import("@/actions/bookings"),
      import("@/actions/commissions"),
    ]);
    const [b, c] = await Promise.all([getBookingsAction(), getCommissionsAction()]);
    if (b.data) setBookings(b.data);
    if (c.data) setCommissions(c.data);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Og Stays (1451)</p>
          <h1 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-semibold mt-1">
            Monthly calendar
          </h1>
          <div className="flex items-center gap-3 mt-2 text-[11px] font-semibold">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-brand" /> Booking
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-accent" /> Commission
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white self-start cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Record entry
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={() => setCursor(subMonths(cursor, 1))}
            className="h-9 w-9 rounded-xl border border-border hover:bg-surface-muted cursor-pointer inline-flex items-center justify-center"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="font-bold text-sm sm:text-base">{format(cursor, "MMMM yyyy")}</div>
          <button
            type="button"
            onClick={() => setCursor(addMonths(cursor, 1))}
            className="h-9 w-9 rounded-xl border border-border hover:bg-surface-muted cursor-pointer inline-flex items-center justify-center"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted mb-1">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const inMonth = isSameMonth(day, cursor);
            const selectedDay = isSameDay(day, parseISO(selected));
            const dayEv = eventsByDay.get(key) || [];
            const hasBooking = dayEv.some((e) => e.kind === "booking");
            const hasCommission = dayEv.some((e) => e.kind === "commission");

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(key)}
                className={`min-h-[3.25rem] sm:min-h-[4.25rem] rounded-xl border p-1 text-left transition cursor-pointer ${
                  selectedDay
                    ? "border-brand bg-brand-soft/70 ring-1 ring-brand/40"
                    : "border-border/60 bg-surface-muted/20 hover:bg-surface-muted/50"
                } ${!inMonth ? "opacity-35" : ""} ${isToday(day) && !selectedDay ? "border-brand/50" : ""}`}
              >
                <div className={`text-[11px] font-bold ${isToday(day) ? "text-brand" : ""}`}>
                  {format(day, "d")}
                </div>
                <div className="mt-1 flex flex-wrap gap-0.5">
                  {hasBooking && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
                  {hasCommission && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                </div>
                <div className="hidden sm:block mt-1 space-y-0.5">
                  {dayEv.slice(0, 2).map((e) => (
                    <div
                      key={`${e.id}-${key}`}
                      className={`truncate text-[9px] font-semibold px-1 rounded ${
                        e.kind === "booking"
                          ? "bg-brand/15 text-brand"
                          : "bg-accent/15 text-accent"
                      }`}
                    >
                      {formatTimeAmPm(e.startTime)} {e.title}
                    </div>
                  ))}
                  {dayEv.length > 2 && (
                    <div className="text-[9px] text-muted">+{dayEv.length - 2}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="font-bold text-sm mb-3">
          {format(parseISO(selected), "EEE, d MMM yyyy")} · {dayEvents.length} record
          {dayEvents.length === 1 ? "" : "s"}
        </h2>

        {dayEvents.length === 0 ? (
          <p className="text-sm text-muted text-center py-6">No bookings or commissions this day.</p>
        ) : (
          <>
            <div className="space-y-2 md:hidden">
              {dayEvents.map((e) => (
                <div
                  key={e.id}
                  className={`rounded-xl border px-3 py-2.5 ${
                    e.kind === "booking"
                      ? "border-brand/30 bg-brand-soft/40"
                      : "border-accent/30 bg-accent-soft/40"
                  }`}
                >
                  <div className="flex justify-between gap-2">
                    <div className="font-bold text-sm">{e.title}</div>
                    <div className="font-black text-sm">₹{e.amount.toLocaleString("en-IN")}</div>
                  </div>
                  <div className="text-[11px] text-muted mt-1">
                    {e.kind} · {formatSlotAmPm(e.startTime, e.endTime)}
                    {e.via ? ` · via ${e.via}` : ""}
                  </div>
                  <div className="text-[11px] text-muted mt-0.5">
                    By {e.createdBy || "—"}
                    {e.createdAt ? ` · ${format(parseISO(e.createdAt), "dd MMM, hh:mm a")}` : ""}
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden md:block -mx-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-muted/60 text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Guest</th>
                    <th className="px-4 py-3">Slot</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Created by</th>
                    <th className="px-4 py-3">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {dayEvents.map((e) => (
                    <tr key={e.id} className="hover:bg-surface-muted/40">
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] uppercase font-black px-1.5 py-0.5 rounded ${
                            e.kind === "booking" ? "bg-brand text-white" : "bg-accent text-white"
                          }`}
                        >
                          {e.kind}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold">{e.title}</td>
                      <td className="px-4 py-3 text-xs">
                        {formatSlotAmPm(e.startTime, e.endTime)}
                        {e.endDate !== e.date ? ` (${e.endDate})` : ""}
                      </td>
                      <td className="px-4 py-3 font-bold">₹{e.amount.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-xs">
                        {e.payment}
                        {e.via ? ` · ${e.via}` : ""}
                      </td>
                      <td className="px-4 py-3 text-xs">{e.createdBy || "—"}</td>
                      <td className="px-4 py-3 text-xs text-muted">
                        {e.createdAt
                          ? format(parseISO(e.createdAt), "dd MMM yyyy, hh:mm a")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <QuickRecordModal open={open} onClose={() => setOpen(false)} onSaved={refresh} />
    </div>
  );
}
