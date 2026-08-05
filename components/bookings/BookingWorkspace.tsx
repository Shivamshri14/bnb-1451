"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bookingSchema, BookingInput } from "@/lib/validations";
import {
  createBookingAction,
  updateBookingAction,
  cancelBookingAction,
  getBookingsAction,
} from "@/actions/bookings";
import { toast } from "sonner";
import { format, parseISO, differenceInHours } from "date-fns";
import {
  Plus,
  Search,
  Edit2,
  XCircle,
  Loader2,
  X,
  User,
  Phone,
  Clock,
} from "lucide-react";
import DayTimeline, { TimelineSegment } from "@/components/schedule/DayTimeline";
import { formatSlotAmPm, formatTimeAmPm } from "@/lib/time";
import { buildDayTimeline } from "@/lib/booking-store";
import { OG_ROOM } from "@/lib/constants";

interface BookingWorkspaceProps {
  initialBookings: any[];
  rooms: any[];
}

export default function BookingWorkspace({ initialBookings }: BookingWorkspaceProps) {
  const [bookings, setBookings] = useState<any[]>(initialBookings);
  const [day, setDay] = useState(format(new Date(), "yyyy-MM-dd"));
  const [timeline, setTimeline] = useState<TimelineSegment[]>([]);
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<any | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      customerName: "",
      phoneNumber: "",
      email: "",
      guestsCount: 1,
      idProof: "",
      room: OG_ROOM._id,
      bookingSource: "Direct" as const,
      checkInDate: "",
      checkInTime: "10:00",
      checkOutDate: "",
      checkOutTime: "16:00",
      roomPrice: 200,
      discount: 0,
      tax: 0,
      advancePaid: 0,
      paymentStatus: "Pending" as const,
      bookingStatus: "Reserved" as const,
      notes: "",
    },
  });

  const watchedValues = useWatch({
    control: control as any,
    name: [
      "checkInDate",
      "checkInTime",
      "checkOutDate",
      "checkOutTime",
      "roomPrice",
      "discount",
      "tax",
      "advancePaid",
    ],
  });

  const [checkInD, checkInT, checkOutD, checkOutT, hourlyRate, discountVal, taxVal, advPaid] =
    watchedValues;

  let totalHours = 0;
  let finalAmount = 0;
  let remainingAmount = 0;

  if (checkInD && checkInT && checkOutD && checkOutT) {
    try {
      const start = parseISO(`${checkInD}T${checkInT}:00`);
      const end = parseISO(`${checkOutD}T${checkOutT}:00`);
      const diff = differenceInHours(end, start);
      if (diff > 0) {
        totalHours = diff;
        finalAmount = Number(hourlyRate || 0) * diff - Number(discountVal || 0) + Number(taxVal || 0);
        remainingAmount = Math.max(0, finalAmount - Number(advPaid || 0));
      }
    } catch {
      /* ignore */
    }
  }

  const refreshTimeline = useCallback(
    (list: any[], selectedDay: string) => {
      setTimeline(buildDayTimeline(list, selectedDay) as TimelineSegment[]);
    },
    []
  );

  const refreshData = useCallback(async () => {
    const res = await getBookingsAction({ search, day });
    if (res.success && res.data) {
      setBookings(res.data);
      if (res.timeline) setTimeline(res.timeline as TimelineSegment[]);
      else refreshTimeline(res.data, day);
    }
  }, [search, day, refreshTimeline]);

  useEffect(() => {
    refreshTimeline(bookings, day);
  }, [day, bookings, refreshTimeline]);

  useEffect(() => {
    const t = setTimeout(() => {
      refreshData();
    }, 250);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreateModal = (slot?: Extract<TimelineSegment, { type: "empty" }>) => {
    setEditingBooking(null);
    reset({
      customerName: "",
      phoneNumber: "",
      email: "",
      guestsCount: 1,
      idProof: "",
      room: OG_ROOM._id,
      bookingSource: "Direct",
      checkInDate: slot?.checkInDate || day,
      checkInTime: slot?.checkInTime || "10:00",
      checkOutDate: slot?.checkOutDate || day,
      checkOutTime: slot?.checkOutTime === "23:59" ? "22:00" : slot?.checkOutTime || "16:00",
      roomPrice: 200,
      discount: 0,
      tax: 0,
      advancePaid: 0,
      paymentStatus: "Pending",
      bookingStatus: "Reserved",
      notes: slot ? "Booked from empty gap." : "",
    });
    setIsFormOpen(true);
  };

  const openEditModal = (booking: any) => {
    setEditingBooking(booking);
    reset({
      customerName: booking.customerName,
      phoneNumber: booking.phoneNumber,
      email: booking.email || "",
      guestsCount: booking.guestsCount,
      idProof: booking.idProof || "",
      room: OG_ROOM._id,
      bookingSource: booking.bookingSource,
      checkInDate: booking.checkInDate,
      checkInTime: booking.checkInTime || "10:00",
      checkOutDate: booking.checkOutDate,
      checkOutTime: booking.checkOutTime || "16:00",
      roomPrice: booking.roomPrice,
      discount: booking.discount,
      tax: booking.tax,
      advancePaid: booking.advancePaid,
      paymentStatus: booking.paymentStatus,
      bookingStatus: booking.bookingStatus,
      notes: booking.notes || "",
    });
    setIsFormOpen(true);
  };

  const onSubmit = (data: BookingInput) => {
    if (totalHours <= 0) {
      toast.error("Check-out time must be after check-in time.");
      return;
    }

    startTransition(async () => {
      const res = editingBooking
        ? await updateBookingAction(editingBooking._id, data)
        : await createBookingAction(data);

      if (res.success) {
        toast.success(editingBooking ? "Booking updated" : "Slot booked");
        setIsFormOpen(false);
        refreshData();
      } else {
        toast.error(res.error || "Failed to save booking");
      }
    });
  };

  const handleCancel = async (id: string, name: string) => {
    if (!confirm(`Cancel booking for ${name}?`)) return;
    const res = await cancelBookingAction(id);
    if (res.success) {
      toast.success("Booking cancelled");
      refreshData();
    } else {
      toast.error("Failed to cancel");
    }
  };

  const filtered = bookings.filter((b) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (b.customerName || "").toLowerCase().includes(s) || b.phoneNumber.includes(s);
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
            Room 1451 · Og Stays
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-semibold tracking-tight mt-1">
            Hour board
          </h1>
          <p className="text-sm text-muted mt-1">
            See booked hours, empty gaps, and future slots in one glance.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openCreateModal()}
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white self-start sm:self-auto cursor-pointer hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Book slot
        </button>
      </div>

      <DayTimeline
        day={day}
        segments={timeline}
        onDayChange={setDay}
        onBookEmpty={(slot) => openCreateModal(slot)}
        onSelectBooking={(seg) => {
          if (seg.raw) openEditModal(seg.raw);
        }}
        title="Day schedule"
        subtitle="Example: 10am–4pm ₹1200 booked → 4–7 empty → 7pm–10am ₹1400"
      />

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder="Search guest or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      <div className="space-y-3 md:hidden">
        {filtered.map((booking) => (
          <div
            key={booking._id}
            className="rounded-2xl border border-border bg-surface p-4 space-y-2"
          >
            <div className="flex justify-between gap-2">
              <div>
                <div className="font-bold">{booking.customerName || "—"}</div>
                <div className="text-xs text-muted">{booking.phoneNumber}</div>
              </div>
              <div className="text-right text-xs font-semibold text-muted">
                {booking.bookingStatus}
              </div>
            </div>
            <div className="text-sm text-booked font-semibold flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {formatSlotAmPm(booking.checkInTime, booking.checkOutTime)} · {booking.totalHours}h
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="font-black">₹{booking.finalAmount.toLocaleString("en-IN")}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(booking)}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold cursor-pointer"
                >
                  Edit
                </button>
                {booking.bookingStatus !== "Cancelled" && (
                  <button
                    type="button"
                    onClick={() => handleCancel(booking._id, booking.customerName)}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-600 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block rounded-2xl border border-border bg-surface overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-muted/60 text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3">Guest</th>
              <th className="px-4 py-3">Slot</th>
              <th className="px-4 py-3">Hours</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((booking) => (
              <tr key={booking._id} className="hover:bg-surface-muted/40">
                <td className="px-4 py-3">
                  <div className="font-semibold">{booking.customerName || "—"}</div>
                  <div className="text-xs text-muted flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {booking.phoneNumber}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {format(parseISO(booking.checkInDate), "MMM d")} {formatTimeAmPm(booking.checkInTime)} →{" "}
                  {format(parseISO(booking.checkOutDate), "MMM d")} {formatTimeAmPm(booking.checkOutTime)}
                </td>
                <td className="px-4 py-3 font-semibold">{booking.totalHours}h</td>
                <td className="px-4 py-3 font-bold">
                  ₹{booking.finalAmount.toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-3 text-xs font-semibold">{booking.bookingStatus}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => openEditModal(booking)}
                    className="p-2 rounded-lg hover:bg-surface-muted cursor-pointer inline-flex"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  {booking.bookingStatus !== "Cancelled" && (
                    <button
                      type="button"
                      onClick={() => handleCancel(booking._id, booking.customerName)}
                      className="p-2 rounded-lg hover:bg-rose-500/10 text-rose-500 cursor-pointer inline-flex"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsFormOpen(false)}
            aria-label="Close"
          />
          <div className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xl">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="absolute right-3 top-3 p-2 rounded-lg hover:bg-surface-muted cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-brand" />
              {editingBooking ? "Edit slot" : "Book empty / future slot"}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted uppercase">Guest</label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <input
                    {...register("customerName")}
                    className="w-full pl-10 pr-3 py-2 text-sm rounded-xl border border-border bg-surface-muted/40 focus:outline-none focus:ring-2 focus:ring-brand"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted uppercase">Phone *</label>
                  <input
                    {...register("phoneNumber")}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface-muted/40 focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted uppercase">Source</label>
                  <select
                    {...register("bookingSource")}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface-muted/40 focus:outline-none"
                  >
                    <option value="Direct">Direct</option>
                    <option value="Airbnb">Airbnb</option>
                    <option value="Booking.com">Booking.com</option>
                    <option value="Agoda">Agoda</option>
                  </select>
                </div>
              </div>

              <div className="rounded-xl border border-brand/20 bg-brand-soft/50 p-3 grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-brand uppercase">Check-in date</label>
                  <input type="date" {...register("checkInDate")} className="w-full mt-1 px-2 py-1.5 text-xs rounded-lg border border-border bg-surface" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-brand uppercase">Time</label>
                  <input type="time" {...register("checkInTime")} className="w-full mt-1 px-2 py-1.5 text-xs rounded-lg border border-border bg-surface font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-brand uppercase">Check-out date</label>
                  <input type="date" {...register("checkOutDate")} className="w-full mt-1 px-2 py-1.5 text-xs rounded-lg border border-border bg-surface" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-brand uppercase">Time</label>
                  <input type="time" {...register("checkOutTime")} className="w-full mt-1 px-2 py-1.5 text-xs rounded-lg border border-border bg-surface font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-muted uppercase">₹ / hr</label>
                  <input type="number" {...register("roomPrice")} className="w-full mt-1 px-2 py-1.5 text-xs rounded-lg border border-border bg-surface font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted uppercase">Discount</label>
                  <input type="number" {...register("discount")} className="w-full mt-1 px-2 py-1.5 text-xs rounded-lg border border-border bg-surface" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted uppercase">Advance</label>
                  <input type="number" {...register("advancePaid")} className="w-full mt-1 px-2 py-1.5 text-xs rounded-lg border border-border bg-surface" />
                </div>
              </div>

              <div className="flex flex-wrap justify-between text-xs pt-1">
                <span>
                  Hours: <strong>{totalHours}</strong>
                </span>
                <span>
                  Total: <strong>₹{finalAmount.toLocaleString("en-IN")}</strong>
                </span>
                <span>
                  Due: <strong>₹{remainingAmount.toLocaleString("en-IN")}</strong>
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted uppercase">Notes / future note</label>
                <textarea
                  {...register("notes")}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface-muted/40 h-16 resize-none focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="e.g. Hold for weekend guest, call by Friday..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-sm font-semibold rounded-xl hover:bg-surface-muted cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl bg-brand cursor-pointer disabled:opacity-50"
                >
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingBooking ? "Save" : "Book slot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
