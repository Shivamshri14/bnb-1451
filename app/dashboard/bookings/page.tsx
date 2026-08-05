import { getBookingsAction } from "@/actions/bookings";
import { getCommissionsAction } from "@/actions/commissions";
import ScheduleWorkspace from "@/components/schedule/ScheduleWorkspace";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { format } from "date-fns";

export const revalidate = 0;

export default async function BookingsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const today = format(new Date(), "yyyy-MM-dd");
  const [bookingsRes, commissionsRes] = await Promise.all([
    getBookingsAction(),
    getCommissionsAction(),
  ]);

  return (
    <ScheduleWorkspace
      initialBookings={bookingsRes.data || []}
      initialCommissions={commissionsRes.data || []}
      commissionTimeline={(commissionsRes.timeline as any) || []}
      initialDay={today}
    />
  );
}
