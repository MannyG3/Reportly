"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/clients": "Clients",
  "/reports": "Reports",
  "/settings": "Settings",
};

export default function TopBar() {
  const pathname = usePathname();

  const title = useMemo(() => {
    const match = Object.keys(TITLES).find(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    );
    return match ? TITLES[match] : "Reportly";
  }, [pathname]);

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-[rgba(255,255,255,0.08)] bg-[rgba(10,10,10,0.78)] px-4 backdrop-blur-2xl lg:hidden">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-[var(--gold)] shadow-[0_0_10px_rgba(201,168,76,0.75)]" />
        <span className="text-sm font-medium tracking-tight text-[var(--white)]">Reportly</span>
      </div>
      <p className="text-sm text-[var(--subtle)]">{title}</p>
    </header>
  );
}
