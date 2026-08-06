"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Plus, IndianRupee } from "lucide-react";
import QuickRecordModal from "./QuickRecordModal";
import EmptySlotsPanel from "./EmptySlotsPanel";
import BookingRecordsTable from "./BookingRecordsTable";
import { useRouter } from "next/navigation";

interface HomeWorkspaceProps {
  stats: any;
  todayLabel?: string;
}

export default function HomeWorkspace({ stats, todayLabel }: HomeWorkspaceProps) {
  const [open, setOpen] = useState(false);
  const [dateLabel, setDateLabel] = useState(todayLabel || "");
  const router = useRouter();

  useEffect(() => {
    setDateLabel(format(new Date(), "EEEE, d MMMM yyyy"));
  }, []);

  const money = (v: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(v || 0);

  const onSaved = () => router.refresh();
  const onUpdated = () => router.refresh();

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand/12 via-transparent to-accent/10 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Your flat</p>
            <h1 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-semibold mt-1">
              Og Stays (1451)
            </h1>
            <p className="text-xs text-muted mt-1" suppressHydrationWarning>
              {dateLabel || "\u00A0"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white self-start cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Record entry
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-surface p-3.5">
          <div className="text-[10px] uppercase font-semibold text-muted flex items-center gap-1">
            <IndianRupee className="h-3 w-3" /> Earnings
          </div>
          <div className="text-lg sm:text-2xl font-black mt-1 text-brand">{money(stats.earnings)}</div>
          <div className="text-[10px] text-muted mt-0.5">This month collected</div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-3.5">
          <div className="text-[10px] uppercase font-semibold text-muted">Today collection</div>
          <div className="text-lg sm:text-2xl font-black mt-1">{money(stats.todayCollection)}</div>
          <div className="text-[10px] text-muted mt-0.5">Received today</div>
        </div>
      </div>

      <EmptySlotsPanel slots={stats.emptySlots || []} onBook={() => setOpen(true)} />

      <BookingRecordsTable
        title="Pending payments"
        bookings={stats.pendingPayments || []}
        emptyMessage="No pending dues"
        showPaymentDropdown
        highlightPending
        onUpdated={onUpdated}
      />

      <BookingRecordsTable
        title="Today's bookings"
        bookings={stats.todayHistory || []}
        emptyMessage="No bookings recorded for today."
        showPaymentDropdown
        onUpdated={onUpdated}
      />

      <BookingRecordsTable
        title="Upcoming bookings"
        bookings={stats.upcoming || []}
        emptyMessage="No upcoming bookings."
      />

      <QuickRecordModal open={open} onClose={() => setOpen(false)} onSaved={onSaved} />
    </div>
  );
}
