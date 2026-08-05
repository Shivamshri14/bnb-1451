import { getDashboardStats } from "@/actions/dashboard";
import HomeWorkspace from "@/components/home/HomeWorkspace";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { format } from "date-fns";

export const revalidate = 0;

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const stats = await getDashboardStats();
  const todayLabel = format(new Date(), "EEEE, d MMMM yyyy");
  return <HomeWorkspace stats={stats} todayLabel={todayLabel} />;
}
