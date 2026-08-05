"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { useEffect, useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [toastTheme, setToastTheme] = useState<"light" | "dark" | "system">("system");

  useEffect(() => {
    const sync = () => {
      setToastTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    };
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  return (
    <SessionProvider>
      {children}
      <Toaster position="top-center" richColors theme={toastTheme} closeButton />
    </SessionProvider>
  );
}
