"use client";

import { useState, useTransition } from "react";
import { updateRoomStatusAction } from "@/actions/rooms";
import { toast } from "sonner";
import { Building2, Home, Users, IndianRupee, Loader2 } from "lucide-react";
import { OG_ROOM } from "@/lib/constants";

interface RoomWorkspaceProps {
  initialRooms: any[];
}

export default function RoomWorkspace({ initialRooms }: RoomWorkspaceProps) {
  const room = initialRooms[0] || OG_ROOM;
  const [status, setStatus] = useState(room.status || "Available");
  const [isPending, startTransition] = useTransition();

  const updateStatus = (next: "Available" | "Occupied" | "Maintenance" | "Cleaning") => {
    startTransition(async () => {
      const res = await updateRoomStatusAction(room._id, next);
      if (res.success) {
        setStatus(next);
        toast.success(`Status → ${next}`);
      } else {
        toast.error("Failed to update status");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Single flat</p>
        <h1 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-semibold mt-1">
          Your room
        </h1>
        <p className="text-sm text-muted mt-1">
          This portal manages one property only.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
        <div className="bg-gradient-to-br from-brand to-[color-mix(in_oklab,var(--brand)_70%,#0a4d3c)] p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/15 flex items-center justify-center">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-white/80">
                Property name
              </div>
              <div className="text-2xl font-bold font-[family-name:var(--font-display)]">
                Og Stays
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Home className="h-5 w-5 text-brand" />
            <div>
              <div className="text-xs text-muted uppercase font-semibold">Room number</div>
              <div className="text-xl font-black">1451</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-surface-muted/70 p-3">
              <div className="flex items-center gap-2 text-xs text-muted font-semibold uppercase">
                <Users className="h-3.5 w-3.5" /> Capacity
              </div>
              <div className="text-lg font-bold mt-1">{room.capacity || 4} guests</div>
            </div>
            <div className="rounded-xl bg-surface-muted/70 p-3">
              <div className="flex items-center gap-2 text-xs text-muted font-semibold uppercase">
                <IndianRupee className="h-3.5 w-3.5" /> Default rate
              </div>
              <div className="text-lg font-bold mt-1">₹{room.pricePerHour || 200}/hr</div>
            </div>
          </div>

          <div>
            <div className="text-xs text-muted uppercase font-semibold mb-2">Status</div>
            <div className="flex flex-wrap gap-2">
              {(["Available", "Occupied", "Cleaning", "Maintenance"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={isPending}
                  onClick={() => updateStatus(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer disabled:opacity-50 ${
                    status === s
                      ? "bg-brand text-white border-brand"
                      : "border-border bg-surface hover:bg-surface-muted"
                  }`}
                >
                  {isPending && status === s ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin inline" />
                  ) : (
                    s
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
