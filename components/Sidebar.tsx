"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  CalendarRange,
  Receipt,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Building2,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/bookings", label: "Calendar", icon: CalendarRange },
  { href: "/dashboard/expenses", label: "Expenses", icon: Receipt },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <>
      <header className="flex h-14 w-full items-center justify-between border-b border-border bg-surface/90 px-4 backdrop-blur md:hidden sticky top-0 z-40">
        <div className="flex items-center gap-2 min-w-0">
          <Building2 className="h-5 w-5 text-brand shrink-0" />
          <div className="truncate">
            <div className="font-bold text-sm leading-tight truncate">Og Stays (1451)</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={toggleTheme} className="rounded-lg p-2 text-muted hover:bg-surface-muted cursor-pointer">
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>
          <button type="button" onClick={() => setIsMobileOpen(true)} className="rounded-lg p-2 text-muted hover:bg-surface-muted cursor-pointer">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setIsMobileOpen(false)} aria-label="Close" />
          <div className="absolute inset-y-0 left-0 w-72 bg-surface border-r border-border flex flex-col p-4">
            <div className="flex items-center justify-between mb-6">
              <span className="font-bold">Og Stays (1451)</span>
              <button type="button" onClick={() => setIsMobileOpen(false)} className="p-2 rounded-lg hover:bg-surface-muted cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                      isActive ? "bg-brand text-white" : "text-muted hover:bg-surface-muted"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-border pt-4">
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-500/10 cursor-pointer disabled:opacity-50"
              >
                <LogOut className="h-5 w-5" /> Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <aside className="hidden md:flex flex-col border-r border-border bg-surface/80 backdrop-blur sticky top-0 h-screen w-56 p-3">
        <div className="flex items-center gap-2 mb-6 px-2 py-1">
          <Building2 className="h-6 w-6 text-brand shrink-0" />
          <div>
            <div className="font-bold leading-tight text-sm">Og Stays</div>
            <div className="text-[10px] text-muted font-semibold">Room 1451</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? "bg-brand text-white shadow-sm" : "text-muted hover:bg-surface-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border pt-3 space-y-1">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-surface-muted cursor-pointer"
          >
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-500/10 cursor-pointer disabled:opacity-50"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-surface/95 backdrop-blur px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 flex justify-around">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-[10px] font-bold ${
                isActive ? "text-brand" : "text-muted"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
