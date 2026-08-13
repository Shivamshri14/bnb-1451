"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { quickRecordSchema, QuickRecordInput } from "@/lib/validations";
import { createQuickRecordAction } from "@/actions/bookings";
import { normalizeIndianPhone } from "@/lib/phone";
import { VIA_OPTIONS } from "@/lib/via";
import { formatDateDDMMYYYY } from "@/lib/time";

interface QuickRecordModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function QuickRecordModal({ open, onClose, onSaved }: QuickRecordModalProps) {
  const [isPending, startTransition] = useTransition();
  const today = formatDateDDMMYYYY(format(new Date(), "yyyy-MM-dd"));

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<QuickRecordInput>({
    resolver: zodResolver(quickRecordSchema) as any,
    defaultValues: {
      entryType: "booking",
      checkInDate: today,
      checkInTime: "10:00",
      checkOutDate: today,
      checkOutTime: "16:00",
      amount: 0,
      paymentStatus: "Pending",
      sourceOrPhone: "",
      roomNumber: "",
      customerName: "",
      via: "",
    },
  });

  const entryType = watch("entryType");

  if (!open) return null;

  const onSubmit = (data: QuickRecordInput) => {
    startTransition(async () => {
      const payload = { ...data };
      const maybePhone = normalizeIndianPhone(data.sourceOrPhone || "");
      if (maybePhone) payload.sourceOrPhone = maybePhone;

      const res = await createQuickRecordAction(payload);
      if (res.success) {
        toast.success(data.entryType === "booking" ? "Booking saved" : "Commission saved");
        reset({
          entryType: "booking",
          checkInDate: today,
          checkInTime: "10:00",
          checkOutDate: today,
          checkOutTime: "16:00",
          amount: 0,
          paymentStatus: "Pending",
          sourceOrPhone: "",
          roomNumber: "",
          customerName: "",
          via: "",
        });
        onClose();
        onSaved?.();
      } else {
        toast.error(("error" in res && res.error) || "Could not save");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
      <button type="button" className="absolute inset-0 bg-black/55" onClick={onClose} aria-label="Close" />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-4 shadow-xl">
        <div className="flex items-center justify-between mb-2.5">
          <div>
            <h2 className="text-base font-bold leading-tight">Record entry</h2>
            <p className="text-[11px] text-muted">Og Stays (1451) · saved to MongoDB</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-muted cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
          <div className="grid grid-cols-2 gap-1.5">
            {(["booking", "commission"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setValue("entryType", t)}
                className={`rounded-lg border px-2 py-1.5 text-xs font-bold capitalize cursor-pointer ${
                  entryType === t
                    ? t === "booking"
                      ? "bg-brand text-white border-brand"
                      : "bg-accent text-white border-accent"
                    : "border-border bg-surface-muted/40"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            <div className="col-span-2">
              <label className="text-[9px] font-bold text-muted uppercase">In date (DD-MM-YYYY)</label>
              <input type="text" placeholder="DD-MM-YYYY" {...register("checkInDate")} className="w-full mt-0.5 px-1.5 py-1.5 text-[11px] rounded-lg border border-border bg-surface-muted/30" />
            </div>
            <div className="col-span-2">
              <label className="text-[9px] font-bold text-muted uppercase">In time</label>
              <input type="time" {...register("checkInTime")} className="w-full mt-0.5 px-1.5 py-1.5 text-[11px] rounded-lg border border-border bg-surface-muted/30 font-bold" />
            </div>
            <div className="col-span-2">
              <label className="text-[9px] font-bold text-muted uppercase">Out date (DD-MM-YYYY)</label>
              <input type="text" placeholder="DD-MM-YYYY" {...register("checkOutDate")} className="w-full mt-0.5 px-1.5 py-1.5 text-[11px] rounded-lg border border-border bg-surface-muted/30" />
            </div>
            <div className="col-span-2">
              <label className="text-[9px] font-bold text-muted uppercase">Out time</label>
              <input type="time" {...register("checkOutTime")} className="w-full mt-0.5 px-1.5 py-1.5 text-[11px] rounded-lg border border-border bg-surface-muted/30 font-bold" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="text-[9px] font-bold text-muted uppercase">Amount ₹ *</label>
              <input type="number" {...register("amount")} className="w-full mt-0.5 px-2 py-1.5 text-sm rounded-lg border border-border bg-surface-muted/30 font-bold" />
              {errors.amount && <p className="text-[10px] text-rose-500">{errors.amount.message}</p>}
            </div>
            <div>
              <label className="text-[9px] font-bold text-muted uppercase">Payment *</label>
              <select {...register("paymentStatus")} className="w-full mt-0.5 px-2 py-1.5 text-sm rounded-lg border border-border bg-surface-muted/30">
                <option value="Pending">Pending</option>
                <option value="Received">Received</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[9px] font-bold text-muted uppercase">Via (optional)</label>
            <select {...register("via")} className="w-full mt-0.5 px-2 py-1.5 text-sm rounded-lg border border-border bg-surface-muted/30">
              <option value="">— Select —</option>
              {VIA_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {entryType === "commission" && (
            <div>
              <label className="text-[9px] font-bold text-muted uppercase">Room number</label>
              <input
                {...register("roomNumber")}
                className="w-full mt-0.5 px-2 py-1.5 text-sm rounded-lg border border-border bg-surface-muted/30"
                placeholder="Optional · e.g. 1451"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="text-[9px] font-bold text-muted uppercase">Guest name</label>
              <input
                {...register("customerName")}
                className="w-full mt-0.5 px-2 py-1.5 text-xs rounded-lg border border-border bg-surface-muted/30"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-muted uppercase">Source / phone</label>
              <input
                {...register("sourceOrPhone")}
                className="w-full mt-0.5 px-2 py-1.5 text-xs rounded-lg border border-border bg-surface-muted/30"
                placeholder="Optional"
              />
            </div>
          </div>
          {(errors.checkOutDate || errors.checkOutTime) && (
            <p className="text-[10px] text-rose-500">
              {(errors.checkOutDate?.message as string) ||
                (errors.checkOutTime?.message as string)}
            </p>
          )}
          {errors.sourceOrPhone && (
            <p className="text-[10px] text-rose-500">{errors.sourceOrPhone.message as string}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand text-white py-2.5 text-sm font-semibold cursor-pointer disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save {entryType}
          </button>
        </form>
      </div>
    </div>
  );
}
