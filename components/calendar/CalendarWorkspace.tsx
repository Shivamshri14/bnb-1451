"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { format } from "date-fns";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bookingSchema, BookingInput } from "@/lib/validations";
import { createBookingAction, getBookingsAction } from "@/actions/bookings";
import { toast } from "sonner";
import { Loader2, X, User, Sparkles, Clock } from "lucide-react";
import DayTimeline, { TimelineSegment } from "@/components/schedule/DayTimeline";
import { buildDayTimeline } from "@/lib/booking-store";
import { OG_ROOM } from "@/lib/constants";
import { differenceInHours, parseISO } from "date-fns";

const FullCalendar = dynamic(() => import("@fullcalendar/react"), {
  ssr: false,
  loading: () => (
    <div className="h-72 animate-pulse rounded-xl bg-surface-muted" />
  ),
});

interface CalendarWorkspaceProps {
  bookings: any[];
  rooms: any[];
}

export default function CalendarWorkspace({ bookings: initialBookings }: CalendarWorkspaceProps) {
  const [bookings, setBookings] = useState(initialBookings);
  const [day, setDay] = useState(format(new Date(), "yyyy-MM-dd"));
  const [timeline, setTimeline] = useState<TimelineSegment[]>([]);
  const [plugins, setPlugins] = useState<any[] | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    control,
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

  const watched = useWatch({
    control: control as any,
    name: ["checkInDate", "checkInTime", "checkOutDate", "checkOutTime", "roomPrice", "discount", "tax", "advancePaid"],
  });
  const [cid, cit, cod, cot, rate, disc, tax] = watched;
  let totalHours = 0;
  let finalAmount = 0;
  if (cid && cit && cod && cot) {
    try {
      const diff = differenceInHours(parseISO(`${cod}T${cot}:00`), parseISO(`${cid}T${cit}:00`));
      if (diff > 0) {
        totalHours = diff;
        finalAmount = Number(rate || 0) * diff - Number(disc || 0) + Number(tax || 0);
      }
    } catch { /* */ }
  }

  useEffect(() => {
    let alive = true;
    Promise.all([
      import("@fullcalendar/daygrid"),
      import("@fullcalendar/timegrid"),
      import("@fullcalendar/interaction"),
    ]).then(([dayGrid, timeGrid, interaction]) => {
      if (alive) {
        setPlugins([dayGrid.default, timeGrid.default, interaction.default]);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    setTimeline(buildDayTimeline(bookings, day) as TimelineSegment[]);
  }, [bookings, day]);

  const events = useMemo(() => {
    return bookings
      .filter((b) => b.bookingStatus !== "Cancelled")
      .map((booking) => {
        let color = "#0d7a5f";
        if (booking.bookingStatus === "Checked In") color = "#059669";
        else if (booking.paymentStatus === "Pending") color = "#c45c26";
        return {
          id: booking._id,
          title: `${booking.customerName} · ₹${booking.finalAmount}`,
          start: `${booking.checkInDate}T${booking.checkInTime}:00`,
          end: `${booking.checkOutDate}T${booking.checkOutTime}:00`,
          backgroundColor: color,
          borderColor: color,
        };
      });
  }, [bookings]);

  const refresh = async () => {
    const res = await getBookingsAction({ day });
    if (res.success && res.data) {
      setBookings(res.data);
      if (res.timeline) setTimeline(res.timeline as TimelineSegment[]);
    }
  };

  const openGap = (slot: Extract<TimelineSegment, { type: "empty" }>) => {
    reset({
      customerName: "",
      phoneNumber: "",
      email: "",
      guestsCount: 1,
      idProof: "",
      room: OG_ROOM._id,
      bookingSource: "Direct",
      checkInDate: slot.checkInDate,
      checkInTime: slot.checkInTime,
      checkOutDate: slot.checkOutDate,
      checkOutTime: slot.checkOutTime === "23:59" ? "22:00" : slot.checkOutTime,
      roomPrice: 200,
      discount: 0,
      tax: 0,
      advancePaid: 0,
      paymentStatus: "Pending",
      bookingStatus: "Reserved",
      notes: "Booked from calendar gap.",
    });
    setIsFormOpen(true);
  };

  const onSubmit = (data: BookingInput) => {
    if (totalHours <= 0) {
      toast.error("Check-out must be after check-in");
      return;
    }
    startTransition(async () => {
      const res = await createBookingAction(data);
      if (res.success) {
        toast.success("Slot booked");
        setIsFormOpen(false);
        refresh();
      } else {
        toast.error(res.error || "Failed");
      }
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
          Og Stays · Room 1451
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-semibold mt-1">
          Calendar
        </h1>
        <p className="text-sm text-muted mt-1">
          Day board first — full calendar below for week/month view.
        </p>
      </div>

      <DayTimeline
        day={day}
        segments={timeline}
        onDayChange={setDay}
        onBookEmpty={openGap}
        title="Today / selected day"
        subtitle="Empty blocks are bookable · future slots too"
      />

      <div className="rounded-2xl border border-border bg-surface p-3 sm:p-5 overflow-x-auto">
        {plugins ? (
          <FullCalendar
            plugins={plugins}
            initialView="timeGridDay"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "timeGridDay,timeGridWeek,dayGridMonth",
            }}
            slotMinTime="00:00:00"
            slotMaxTime="24:00:00"
            events={events}
            height="auto"
            editable={false}
            datesSet={(arg) => {
              const mid = new Date((arg.start.getTime() + arg.end.getTime()) / 2);
              setDay(format(mid, "yyyy-MM-dd"));
            }}
          />
        ) : (
          <div className="h-72 animate-pulse rounded-xl bg-surface-muted" />
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <button type="button" className="absolute inset-0 bg-black/50" onClick={() => setIsFormOpen(false)} aria-label="Close" />
          <div className="relative w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-border bg-surface p-5 shadow-xl">
            <button type="button" onClick={() => setIsFormOpen(false)} className="absolute right-3 top-3 p-2 rounded-lg hover:bg-surface-muted cursor-pointer">
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand" /> Book vacant slot
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input {...register("customerName")} placeholder="Guest name (optional)" className="w-full pl-10 pr-3 py-2 text-sm rounded-xl border border-border bg-surface-muted/40 focus:outline-none focus:ring-2 focus:ring-brand" />
              </div>
              <input {...register("phoneNumber")} required placeholder="Phone" className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface-muted/40 focus:outline-none focus:ring-2 focus:ring-brand" />
              <div className="grid grid-cols-2 gap-2 rounded-xl border border-brand/20 bg-brand-soft/40 p-3">
                <input type="date" {...register("checkInDate")} className="px-2 py-1.5 text-xs rounded-lg border border-border bg-surface" />
                <input type="time" {...register("checkInTime")} className="px-2 py-1.5 text-xs rounded-lg border border-border bg-surface font-bold" />
                <input type="date" {...register("checkOutDate")} className="px-2 py-1.5 text-xs rounded-lg border border-border bg-surface" />
                <input type="time" {...register("checkOutTime")} className="px-2 py-1.5 text-xs rounded-lg border border-border bg-surface font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" {...register("roomPrice")} placeholder="₹/hr" className="px-3 py-2 text-sm rounded-xl border border-border" />
                <input type="number" {...register("advancePaid")} placeholder="Advance" className="px-3 py-2 text-sm rounded-xl border border-border" />
              </div>
              <div className="text-xs flex justify-between">
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {totalHours}h</span>
                <span className="font-bold">₹{finalAmount.toLocaleString("en-IN")}</span>
              </div>
              <button type="submit" disabled={isPending} className="w-full inline-flex justify-center items-center gap-2 rounded-xl bg-brand text-white py-2.5 text-sm font-semibold cursor-pointer disabled:opacity-50">
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Book slot
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
