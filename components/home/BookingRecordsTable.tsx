"use client";

import { useState, useTransition } from "react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { updateBookingPaymentAction } from "@/actions/bookings";
import { formatDateDDMMYYYY, formatTimeAmPm } from "@/lib/time";

type BookingRow = {
  _id: string;
  customerName?: string;
  phoneNumber?: string;
  roomNumber?: string;
  via?: string;
  bookingSource?: string;
  checkInDate?: string;
  checkInTime?: string;
  checkOutDate?: string;
  checkOutTime?: string;
  finalAmount?: number;
  remainingAmount?: number;
  paymentStatus?: string;
  createdBy?: string;
  createdAt?: string;
};

interface BookingRecordsTableProps {
  title: string;
  bookings: BookingRow[];
  emptyMessage: string;
  showPaymentDropdown?: boolean;
  onUpdated?: () => void;
  highlightPending?: boolean;
}

function paymentSelectValue(status?: string) {
  if (status === "Paid") return "Received";
  if (status === "Partial") return "Partial";
  return "Pending";
}

function cell(v?: string | number | null) {
  if (v === undefined || v === null || v === "") {
    return "";
  }
  return v;
}

export default function BookingRecordsTable({
  title,
  bookings,
  emptyMessage,
  showPaymentDropdown = false,
  onUpdated,
  highlightPending = false,
}: BookingRecordsTableProps) {
  const [isPending, startTransition] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handlePaymentChange = (id: string, value: string) => {
    const status =
      value === "Received" ? "Paid" : value === "Partial" ? "Partial" : "Pending";
    setUpdatingId(id);
    startTransition(async () => {
      const res = await updateBookingPaymentAction(id, status);
      setUpdatingId(null);
      if (res.success) {
        toast.success("Payment updated");
        onUpdated?.();
      } else {
        toast.error(("error" in res && res.error) || "Update failed");
      }
    });
  };

  if (!bookings.length) {
    return (
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-surface-muted/30">
          <h2 className="font-bold text-sm">{title}</h2>
        </div>
        <p className="text-xs text-muted text-center py-8">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-surface-muted/30">
        <h2 className="font-bold text-sm">{title}</h2>
        <p className="text-[10px] text-muted mt-0.5">{bookings.length} record(s)</p>
      </div>

      <div className="space-y-2 p-3 lg:hidden">
        {bookings.map((b) => (
          <div
            key={b._id}
            className={`rounded-xl border px-3 py-3 text-sm space-y-2 ${
              highlightPending ? "border-amber-500/30 bg-amber-500/5" : "border-border"
            }`}
          >
            <div className="flex justify-between gap-2">
              <div className="font-semibold">{b.customerName || "Guest"}</div>
              <div className="font-black">₹{(b.finalAmount || 0).toLocaleString("en-IN")}</div>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-muted">
              <span>Check-in</span>
              <span className="text-foreground font-medium">
                {formatDateDDMMYYYY(b.checkInDate)} {formatTimeAmPm(b.checkInTime)}
              </span>
              <span>Check-out</span>
              <span className="text-foreground font-medium">
                {formatDateDDMMYYYY(b.checkOutDate)} {formatTimeAmPm(b.checkOutTime)}
              </span>
              <span>Phone</span>
              <span className="text-foreground">{cell(b.phoneNumber)}</span>
              <span>Via</span>
              <span className="text-foreground">{cell(b.via || b.bookingSource)}</span>
              <span>Room</span>
              <span className="text-foreground">{b.roomNumber || "1451"}</span>
              <span>Due</span>
              <span className="text-amber-600 font-semibold">
                ₹{(b.remainingAmount ?? 0).toLocaleString("en-IN")}
              </span>
            </div>
            {showPaymentDropdown ? (
              <select
                value={paymentSelectValue(b.paymentStatus)}
                disabled={isPending && updatingId === b._id}
                onChange={(e) => handlePaymentChange(b._id, e.target.value)}
                className="w-full text-xs rounded-lg border border-border bg-surface px-2 py-2 font-semibold"
              >
                <option value="Pending">Pending</option>
                <option value="Received">Received</option>
                <option value="Partial">Partial</option>
              </select>
            ) : (
              <div className="text-xs font-semibold">{b.paymentStatus}</div>
            )}
            <div className="text-[10px] text-muted">
              By {b.createdBy || "Owner"}
              {b.createdAt ? ` · ${format(parseISO(b.createdAt), "dd-MM-yyyy, h:mm a")}` : ""}
            </div>
          </div>
        ))}
      </div>

      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-xs">
          <thead className="bg-surface-muted/80 text-[10px] uppercase tracking-wider text-muted border-b border-border">
            <tr>
              <th className="px-3 py-2.5 whitespace-nowrap">Check-in</th>
              <th className="px-3 py-2.5 whitespace-nowrap">Check-out</th>
              <th className="px-3 py-2.5">Guest</th>
              <th className="px-3 py-2.5">Phone</th>
              <th className="px-3 py-2.5">Via</th>
              <th className="px-3 py-2.5">Room</th>
              <th className="px-3 py-2.5 text-right">Amount</th>
              <th className="px-3 py-2.5 text-right">Due</th>
              <th className="px-3 py-2.5">Payment</th>
              <th className="px-3 py-2.5">Entered by</th>
              <th className="px-3 py-2.5 whitespace-nowrap">Recorded</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {bookings.map((b) => (
              <tr
                key={b._id}
                className={`hover:bg-surface-muted/40 ${highlightPending ? "bg-amber-500/[0.04]" : ""}`}
              >
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <div className="font-medium">{formatDateDDMMYYYY(b.checkInDate)}</div>
                  <div className="text-muted">{formatTimeAmPm(b.checkInTime)}</div>
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <div className="font-medium">{formatDateDDMMYYYY(b.checkOutDate)}</div>
                  <div className="text-muted">{formatTimeAmPm(b.checkOutTime)}</div>
                </td>
                <td className="px-3 py-2.5 font-semibold max-w-[120px] truncate">
                  {b.customerName || "Guest"}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">{cell(b.phoneNumber)}</td>
                <td className="px-3 py-2.5">{cell(b.via || b.bookingSource)}</td>
                <td className="px-3 py-2.5">{b.roomNumber || "1451"}</td>
                <td className="px-3 py-2.5 text-right font-bold whitespace-nowrap">
                  ₹{(b.finalAmount || 0).toLocaleString("en-IN")}
                </td>
                <td className="px-3 py-2.5 text-right font-semibold text-amber-600 whitespace-nowrap">
                  ₹{(b.remainingAmount ?? 0).toLocaleString("en-IN")}
                </td>
                <td className="px-3 py-2.5">
                  {showPaymentDropdown ? (
                    <select
                      value={paymentSelectValue(b.paymentStatus)}
                      disabled={isPending && updatingId === b._id}
                      onChange={(e) => handlePaymentChange(b._id, e.target.value)}
                      className="min-w-[100px] rounded-lg border border-border bg-surface px-2 py-1.5 text-xs font-semibold cursor-pointer"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Received">Received</option>
                      <option value="Partial">Partial</option>
                    </select>
                  ) : (
                    <span className="font-semibold">{b.paymentStatus}</span>
                  )}
                </td>
                <td className="px-3 py-2.5">{b.createdBy || "Owner"}</td>
                <td className="px-3 py-2.5 whitespace-nowrap text-muted">
                  {b.createdAt
                    ? format(parseISO(b.createdAt), "dd-MM-yyyy, h:mm a")
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
