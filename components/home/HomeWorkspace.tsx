"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Plus, IndianRupee, Clock, AlertCircle } from "lucide-react";
import QuickRecordModal from "./QuickRecordModal";
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

      {/* Earnings + today collection */}
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

      {/* Empty slots — red */}
      <div className="rounded-2xl border border-rose-500/40 bg-rose-500/15 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-4 w-4 text-rose-600" />
          <h2 className="font-bold text-sm text-rose-700 dark:text-rose-300">Empty slots today</h2>
        </div>
        {(stats.emptySlots || []).length === 0 ? (
          <p className="text-xs text-rose-700/80 dark:text-rose-300/80">No empty gaps marked for today (or fully booked).</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(stats.emptySlots || []).map((slot: any) => (
              <button
                key={slot._id}
                type="button"
                onClick={() => setOpen(true)}
                className="rounded-xl bg-rose-600 text-white px-3 py-2 text-xs font-bold cursor-pointer hover:bg-rose-700"
              >
                {slot.checkInTime} → {slot.checkOutTime}
                <span className="opacity-80 font-semibold"> · {slot.totalHours}h</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pending payments */}
      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <h2 className="font-bold text-sm">Pending payments</h2>
        </div>
        {(stats.pendingPayments || []).length === 0 ? (
          <p className="text-xs text-muted text-center py-4">No pending dues 🎉</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {(stats.pendingPayments || []).map((b: any) => (
              <div
                key={b._id}
                className="flex justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm"
              >
                <div>
                  <div className="font-semibold">{b.customerName}</div>
                  <div className="text-[11px] text-muted">
                    {b.checkInDate} {b.checkInTime} → {b.checkOutTime} · {b.paymentStatus}
                  </div>
                </div>
                <div className="font-black text-amber-700 dark:text-amber-400">
                  ₹{(b.remainingAmount || b.finalAmount || 0).toLocaleString("en-IN")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Today's history — table like expenses */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="font-bold text-sm">Today&apos;s booking history</h2>
        </div>
        {(stats.todayHistory || []).length === 0 ? (
          <p className="text-xs text-muted text-center py-8">No bookings recorded for today.</p>
        ) : (
          <>
            <div className="space-y-2 p-3 md:hidden">
              {(stats.todayHistory || []).map((b: any) => (
                <div key={b._id} className="rounded-xl border border-border px-3 py-2.5">
                  <div className="flex justify-between gap-2">
                    <div className="font-semibold text-sm">{b.customerName}</div>
                    <div className="font-black text-sm">
                      ₹{(b.finalAmount || 0).toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div className="text-[11px] text-muted mt-1">
                    {b.checkInTime} → {b.checkOutTime} · {b.paymentStatus}
                  </div>
                  <div className="text-[11px] text-muted mt-0.5">
                    By {b.createdBy || "—"}
                    {b.createdAt ? ` · ${format(parseISO(b.createdAt), "hh:mm a")}` : ""}
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-muted/60 text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-4 py-3">Guest</th>
                    <th className="px-4 py-3">Slot</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Created by</th>
                    <th className="px-4 py-3">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(stats.todayHistory || []).map((b: any) => (
                    <tr key={b._id} className="hover:bg-surface-muted/40">
                      <td className="px-4 py-3 font-semibold">{b.customerName}</td>
                      <td className="px-4 py-3 text-xs">
                        {b.checkInTime} → {b.checkOutTime}
                      </td>
                      <td className="px-4 py-3 font-bold">
                        ₹{(b.finalAmount || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-xs">{b.paymentStatus}</td>
                      <td className="px-4 py-3 text-xs">{b.createdBy || "—"}</td>
                      <td className="px-4 py-3 text-xs text-muted">
                        {b.createdAt ? format(parseISO(b.createdAt), "hh:mm a") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Upcoming — table like expenses */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="font-bold text-sm">Upcoming</h2>
        </div>
        {(stats.upcoming || []).length === 0 ? (
          <p className="text-xs text-muted text-center py-8">No upcoming bookings.</p>
        ) : (
          <>
            <div className="space-y-2 p-3 md:hidden">
              {(stats.upcoming || []).map((b: any) => (
                <div key={b._id} className="rounded-xl border border-border px-3 py-2.5">
                  <div className="flex justify-between gap-2">
                    <div className="font-semibold text-sm">{b.customerName}</div>
                    <div className="font-black text-sm">
                      ₹{(b.finalAmount || 0).toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div className="text-[11px] text-muted mt-1">
                    {b.checkInDate} {b.checkInTime} → {b.checkOutDate} {b.checkOutTime}
                  </div>
                  <div className="text-[11px] text-muted mt-0.5">
                    By {b.createdBy || "—"}
                    {b.createdAt
                      ? ` · ${format(parseISO(b.createdAt), "dd MMM, hh:mm a")}`
                      : ""}
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-muted/60 text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-4 py-3">Guest</th>
                    <th className="px-4 py-3">Slot</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Created by</th>
                    <th className="px-4 py-3">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(stats.upcoming || []).map((b: any) => (
                    <tr key={b._id} className="hover:bg-surface-muted/40">
                      <td className="px-4 py-3 font-semibold">{b.customerName}</td>
                      <td className="px-4 py-3 text-xs">
                        {format(parseISO(b.checkInDate), "dd MMM")} {b.checkInTime} →{" "}
                        {format(parseISO(b.checkOutDate), "dd MMM")} {b.checkOutTime}
                      </td>
                      <td className="px-4 py-3 font-bold">
                        ₹{(b.finalAmount || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-xs">{b.createdBy || "—"}</td>
                      <td className="px-4 py-3 text-xs text-muted">
                        {b.createdAt
                          ? format(parseISO(b.createdAt), "dd MMM yyyy, hh:mm a")
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

      <QuickRecordModal open={open} onClose={() => setOpen(false)} onSaved={onSaved} />
    </div>
  );
}
