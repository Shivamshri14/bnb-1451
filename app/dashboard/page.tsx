import { getDashboardStats } from "@/actions/dashboard";
import HomeWorkspace from "@/components/home/HomeWorkspace";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const revalidate = 0;

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const stats = await getDashboardStats();
  const todayLabel = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
  return <HomeWorkspace stats={stats} todayLabel={todayLabel} />;
}
