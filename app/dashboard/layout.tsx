import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
