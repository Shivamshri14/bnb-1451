"use client";

import { useState, useTransition } from "react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { updateBookingPaymentAction, updateBookingAmountQuickAction } from "@/actions/bookings";
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

  const handleAmountChange = (id: string, amountStr: string, currentAmount: number) => {
    const val = parseInt(amountStr, 10);
    if (isNaN(val) || val === currentAmount || val < 0) return;
    setUpdatingId(id);
    startTransition(async () => {
      const res = await updateBookingAmountQuickAction(id, val);
      setUpdatingId(null);
      if (res.success) {
        toast.success("Amount updated");
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
          <h2 className="font-bold text-sm">{title} · {bookings.length} record</h2>
        </div>
        <p className="text-xs text-muted text-center py-8">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden mb-4">
      <div className="px-4 py-3 border-b border-border bg-surface-muted/30">
        <h2 className="font-bold text-sm">
          {title} · {bookings.length} record{bookings.length > 1 ? "s" : ""}
        </h2>
      </div>

      <div className="space-y-2 p-3 lg:hidden">
        {bookings.map((b) => (
          <div
            key={b._id}
            className={`rounded-xl border px-3 py-3 text-sm space-y-2 ${
              highlightPending ? "border-amber-500/30 bg-amber-500/5" : "border-border"
            }`}
          >
            <div className="flex justify-between gap-2 items-center">
              <div className="font-semibold">{b.via || b.bookingSource || "Group"}</div>
              <div className="font-black flex items-center gap-2">
                <span className="text-[10px] uppercase text-muted font-semibold tracking-wider">Amount</span>
                {showPaymentDropdown ? (
                  <input
                    type="number"
                    defaultValue={b.finalAmount || 0}
                    onBlur={(e) => handleAmountChange(b._id, e.target.value, b.finalAmount || 0)}
                    disabled={isPending && updatingId === b._id}
                    className="w-20 text-right text-xs rounded border border-border bg-surface px-1 py-0.5"
                  />
                ) : (
                  `₹${(b.finalAmount || 0).toLocaleString("en-IN")}`
                )}
              </div>
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
              <span>Payment</span>
              <span className="text-foreground">
                {showPaymentDropdown ? (
                  <select
                    value={paymentSelectValue(b.paymentStatus)}
                    disabled={isPending && updatingId === b._id}
                    onChange={(e) => handlePaymentChange(b._id, e.target.value)}
                    className="w-full text-xs rounded-lg border border-border bg-surface px-1 py-1 font-semibold"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Received">Received</option>
                    <option value="Partial">Partial</option>
                  </select>
                ) : (
                  `${b.paymentStatus}`
                )}
              </span>
              <span>Created by</span>
              <span className="text-foreground">{b.createdBy || "Owner"}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-xs">
          <thead className="bg-surface-muted/80 text-[10px] uppercase tracking-wider text-muted border-b border-border">
            <tr>
              <th className="px-4 py-3 whitespace-nowrap">TYPE</th>
              <th className="px-4 py-3 whitespace-nowrap">CHECK-IN</th>
              <th className="px-4 py-3 whitespace-nowrap">CHECK-OUT</th>
              <th className="px-4 py-3 whitespace-nowrap">VIA</th>
              <th className="px-4 py-3">AMOUNT</th>
              <th className="px-4 py-3">PAYMENT</th>
              <th className="px-4 py-3">CREATED BY</th>
              <th className="px-4 py-3 whitespace-nowrap">TIME</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {bookings.map((b) => (
              <tr
                key={b._id}
                className={`hover:bg-surface-muted/40 ${highlightPending ? "bg-amber-500/[0.04]" : ""}`}
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-flex items-center rounded-md bg-[#059669] px-2 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
                    BOOKING
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-muted text-sm">
                    {formatDateDDMMYYYY(b.checkInDate)} {formatTimeAmPm(b.checkInTime)}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-muted text-sm">
                    {formatDateDDMMYYYY(b.checkOutDate)} {formatTimeAmPm(b.checkOutTime)}
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold">
                  {b.via || b.bookingSource || "Group"}
                </td>
                <td className="px-4 py-3 font-bold">
                  {showPaymentDropdown ? (
                    <div className="flex items-center">
                      <span className="mr-1">₹</span>
                      <input
                        type="number"
                        defaultValue={b.finalAmount || 0}
                        onBlur={(e) => handleAmountChange(b._id, e.target.value, b.finalAmount || 0)}
                        disabled={isPending && updatingId === b._id}
                        className="w-16 rounded border border-border bg-surface px-1 py-0.5 text-xs font-bold"
                      />
                    </div>
                  ) : (
                    `₹${(b.finalAmount || 0).toLocaleString("en-IN")}`
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-muted">
                    {showPaymentDropdown ? (
                      <select
                        value={paymentSelectValue(b.paymentStatus)}
                        disabled={isPending && updatingId === b._id}
                        onChange={(e) => handlePaymentChange(b._id, e.target.value)}
                        className="rounded border border-border bg-surface px-1 py-0.5 text-xs font-semibold cursor-pointer text-foreground"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Received">Received</option>
                        <option value="Partial">Partial</option>
                      </select>
                    ) : (
                      <span className="font-semibold text-foreground">{b.paymentStatus}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">{b.createdBy || "Owner"}</td>
                <td className="px-4 py-3 whitespace-nowrap text-muted">
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
