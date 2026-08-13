"use client";

import { useState, useTransition, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { commissionSchema, CommissionInput } from "@/lib/validations";
import {
  createCommissionAction,
  updateCommissionAction,
  deleteCommissionAction,
  getCommissionsAction,
} from "@/actions/commissions";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { formatDateDDMMYYYY } from "@/lib/time";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  X,
  Percent,
  Clock,
} from "lucide-react";
import DayTimeline, { TimelineSegment } from "@/components/schedule/DayTimeline";
import { formatSlotAmPm, formatTimeAmPm } from "@/lib/time";

interface CommissionWorkspaceProps {
  initialCommissions: any[];
  initialTimeline?: TimelineSegment[];
  initialDay?: string;
}

export default function CommissionWorkspace({
  initialCommissions,
  initialTimeline = [],
  initialDay,
}: CommissionWorkspaceProps) {
  const [commissions, setCommissions] = useState<any[]>(initialCommissions);
  const [day, setDay] = useState(initialDay || format(new Date(), "yyyy-MM-dd"));
  const [timeline, setTimeline] = useState<TimelineSegment[]>(initialTimeline);
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCommission, setEditingCommission] = useState<any | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(commissionSchema),
    defaultValues: {
      propertyName: "Og Stays (Room 1451)",
      customerName: "",
      bookingDate: "",
      checkInDate: "",
      checkInTime: "10:00",
      checkOutDate: "",
      checkOutTime: "16:00",
      bookingAmount: 0,
      commissionPercentage: 10,
      commissionAmount: 0,
      paymentCollected: "No" as const,
      paymentMethod: "",
      notes: "",
    },
  });

  const watchedValues = useWatch({
    control: control as any,
    name: ["bookingAmount", "commissionPercentage"],
  });
  const [bAmount, cPercentage] = watchedValues;
  const commissionAmountVal =
    (Number(bAmount || 0) * Number(cPercentage || 0)) / 100;

  const filteredCommissions = useMemo(() => {
    return commissions.filter((item) => {
      const matchesSearch =
        (item.customerName || "").toLowerCase().includes(search.toLowerCase()) ||
        item.propertyName.toLowerCase().includes(search.toLowerCase());
      const matchesPayment =
        paymentFilter === "ALL" || item.paymentCollected === paymentFilter;
      return matchesSearch && matchesPayment;
    });
  }, [commissions, search, paymentFilter]);

  const totals = useMemo(() => {
    const total = filteredCommissions.reduce((s, i) => s + i.commissionAmount, 0);
    const collected = filteredCommissions
      .filter((c) => c.paymentCollected === "Yes")
      .reduce((s, i) => s + i.commissionAmount, 0);
    return { total, collected, pending: total - collected };
  }, [filteredCommissions]);

  const refresh = async (selectedDay = day) => {
    const res = await getCommissionsAction({ day: selectedDay, search });
    if (res.success && res.data) {
      setCommissions(res.data);
      if (res.timeline) setTimeline(res.timeline as TimelineSegment[]);
    }
  };

  const onDayChange = (next: string) => {
    setDay(next);
    startTransition(async () => {
      await refresh(next);
    });
  };

  const openCreateModal = (slot?: Extract<TimelineSegment, { type: "empty" }>) => {
    setEditingCommission(null);
    reset({
      propertyName: "Og Stays (Room 1451)",
      customerName: "",
      bookingDate: formatDateDDMMYYYY(format(new Date(), "yyyy-MM-dd")),
      checkInDate: formatDateDDMMYYYY(slot?.checkInDate || day),
      checkInTime: slot?.checkInTime || "10:00",
      checkOutDate: formatDateDDMMYYYY(slot?.checkOutDate || day),
      checkOutTime: slot?.checkOutTime === "23:59" ? "16:00" : slot?.checkOutTime || "16:00",
      bookingAmount: 1200,
      commissionPercentage: 15,
      commissionAmount: 180,
      paymentCollected: "No",
      paymentMethod: "",
      notes: slot ? "Noted from empty commission gap." : "",
    });
    setIsFormOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingCommission(item);
    reset({
      propertyName: item.propertyName,
      customerName: item.customerName,
      bookingDate: formatDateDDMMYYYY(
        item.bookingDate?.includes("T")
          ? format(parseISO(item.bookingDate), "yyyy-MM-dd")
          : item.bookingDate
      ),
      checkInDate: formatDateDDMMYYYY(
        item.checkInDate?.includes("T")
          ? format(parseISO(item.checkInDate), "yyyy-MM-dd")
          : item.checkInDate
      ),
      checkInTime: item.checkInTime || "10:00",
      checkOutDate: formatDateDDMMYYYY(
        item.checkOutDate?.includes("T")
          ? format(parseISO(item.checkOutDate), "yyyy-MM-dd")
          : item.checkOutDate
      ),
      checkOutTime: item.checkOutTime || "16:00",
      bookingAmount: item.bookingAmount,
      commissionPercentage: item.commissionPercentage,
      commissionAmount: item.commissionAmount,
      paymentCollected: item.paymentCollected,
      paymentMethod: item.paymentMethod || "",
      notes: item.notes || "",
    });
    setIsFormOpen(true);
  };

  const onSubmit = (data: CommissionInput) => {
    startTransition(async () => {
      const res = editingCommission
        ? await updateCommissionAction(editingCommission._id, data)
        : await createCommissionAction(data);

      if (res.success && res.data) {
        toast.success(editingCommission ? "Commission updated" : "Commission noted");
        setIsFormOpen(false);
        await refresh();
      } else {
        toast.error(res.error || "Failed to save");
      }
    });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete commission for ${name}?`)) return;
    const res = await deleteCommissionAction(id);
    if (res.success) {
      toast.success("Deleted");
      await refresh();
    } else {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
            Commission board
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-semibold mt-1">
            Payout timeline
          </h1>
          <p className="text-sm text-muted mt-1">
            Same hour view as bookings — empty gaps are spots you can still monetize.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openCreateModal()}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white self-start cursor-pointer hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add commission
        </button>
      </div>

      <div className="grid gap-3 grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-3 sm:p-4">
          <div className="text-[10px] sm:text-xs font-semibold text-muted uppercase">Total</div>
          <div className="text-base sm:text-2xl font-black mt-1">
            ₹{totals.total.toLocaleString("en-IN")}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-3 sm:p-4">
          <div className="text-[10px] sm:text-xs font-semibold text-emerald-600 uppercase">
            Collected
          </div>
          <div className="text-base sm:text-2xl font-black text-emerald-600 mt-1">
            ₹{totals.collected.toLocaleString("en-IN")}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-3 sm:p-4">
          <div className="text-[10px] sm:text-xs font-semibold text-rose-500 uppercase">Pending</div>
          <div className="text-base sm:text-2xl font-black text-rose-500 mt-1">
            ₹{totals.pending.toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      <DayTimeline
        day={day}
        segments={timeline}
        onDayChange={onDayChange}
        onBookEmpty={(slot) => openCreateModal(slot)}
        onSelectBooking={(seg) => {
          if (seg.raw) openEditModal(seg.raw);
        }}
        title="Commission hour board"
        subtitle="Tap empty gaps to note a future commission booking"
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search guest or platform..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="px-3 py-2.5 text-sm rounded-xl border border-border bg-surface"
        >
          <option value="ALL">All payments</option>
          <option value="Yes">Collected</option>
          <option value="No">Pending</option>
        </select>
      </div>

      <div className="space-y-3 md:hidden">
        {filteredCommissions.map((item) => (
          <div key={item._id} className="rounded-2xl border border-border bg-surface p-4 space-y-2">
            <div className="flex justify-between">
              <div>
                <div className="font-bold">{item.customerName || "—"}</div>
                <div className="text-xs text-muted">{item.propertyName}</div>
              </div>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                  item.paymentCollected === "Yes"
                    ? "bg-emerald-500/10 text-emerald-600"
                    : "bg-rose-500/10 text-rose-500"
                }`}
              >
                {item.paymentCollected === "Yes" ? "Collected" : "Pending"}
              </span>
            </div>
            <div className="text-sm font-semibold text-accent flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {formatSlotAmPm(item.checkInTime, item.checkOutTime)}
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="font-black">₹{item.commissionAmount.toLocaleString("en-IN")}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(item)}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold cursor-pointer"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item._id, item.customerName)}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-600 text-xs font-semibold cursor-pointer"
                >
                  Delete
                </button>
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
              <th className="px-4 py-3">Booking ₹</th>
              <th className="px-4 py-3">Comm.</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredCommissions.map((item) => (
              <tr key={item._id} className="hover:bg-surface-muted/40">
                <td className="px-4 py-3">
                  <div className="font-semibold">{item.customerName || "—"}</div>
                  <div className="text-xs text-muted">{item.propertyName}</div>
                </td>
                <td className="px-4 py-3 text-xs">
                  {item.checkInDate} {formatSlotAmPm(item.checkInTime, item.checkOutTime)}
                </td>
                <td className="px-4 py-3">₹{item.bookingAmount.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 font-bold">
                  ₹{item.commissionAmount.toLocaleString("en-IN")}
                  <span className="text-xs text-muted font-medium"> ({item.commissionPercentage}%)</span>
                </td>
                <td className="px-4 py-3 text-xs font-semibold">
                  {item.paymentCollected === "Yes" ? "Collected" : "Pending"}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    className="p-2 rounded-lg hover:bg-surface-muted inline-flex cursor-pointer"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item._id, item.customerName)}
                    className="p-2 rounded-lg hover:bg-rose-500/10 text-rose-500 inline-flex cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
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
              <Percent className="h-5 w-5 text-accent" />
              {editingCommission ? "Edit commission" : "Note commission slot"}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-semibold text-muted uppercase">Guest</label>
                  <input
                    {...register("customerName")}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface-muted/40 focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Optional"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-semibold text-muted uppercase">Platform</label>
                  <input
                    {...register("propertyName")}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface-muted/40 focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-accent/20 bg-accent-soft/40 p-3 grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-accent uppercase">Check-in date</label>
                  <input type="text" placeholder="DD-MM-YYYY" {...register("checkInDate")} className="w-full mt-1 px-2 py-1.5 text-xs rounded-lg border border-border bg-surface" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-accent uppercase">Time</label>
                  <input type="time" {...register("checkInTime")} className="w-full mt-1 px-2 py-1.5 text-xs rounded-lg border border-border bg-surface font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-accent uppercase">Check-out date</label>
                  <input type="text" placeholder="DD-MM-YYYY" {...register("checkOutDate")} className="w-full mt-1 px-2 py-1.5 text-xs rounded-lg border border-border bg-surface" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-accent uppercase">Time</label>
                  <input type="time" {...register("checkOutTime")} className="w-full mt-1 px-2 py-1.5 text-xs rounded-lg border border-border bg-surface font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-muted uppercase">Booking ₹</label>
                  <input type="number" {...register("bookingAmount")} className="w-full mt-1 px-2 py-1.5 text-xs rounded-lg border border-border bg-surface font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted uppercase">Comm %</label>
                  <input type="number" {...register("commissionPercentage")} className="w-full mt-1 px-2 py-1.5 text-xs rounded-lg border border-border bg-surface" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted uppercase">Payout</label>
                  <div className="mt-1 px-2 py-1.5 text-xs rounded-lg bg-surface-muted font-black">
                    ₹{commissionAmountVal.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted uppercase">Collected?</label>
                  <select {...register("paymentCollected")} className="mt-1 w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface-muted/40">
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted uppercase">Method</label>
                  <select {...register("paymentMethod")} className="mt-1 w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface-muted/40">
                    <option value="">Pending</option>
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <input type="hidden" {...register("bookingDate")} />

              <div>
                <label className="text-xs font-semibold text-muted uppercase">Notes</label>
                <textarea
                  {...register("notes")}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface-muted/40 h-16 resize-none"
                  placeholder="Future note / agent ref..."
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
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl bg-accent cursor-pointer disabled:opacity-50"
                >
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
