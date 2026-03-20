"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import TopBar from "@/components/dashboard/TopBar";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", short: "Home" },
  { href: "/clients", label: "Clients", short: "Clients" },
  { href: "/reports", label: "Reports", short: "Reports" },
  { href: "/settings", label: "Settings", short: "Settings" },
] as const;

type DashboardShellProps = {
  children: ReactNode;
  userEmail: string;
};

function isItemActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function DashboardShell({ children, userEmail }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = getBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[var(--black)] text-[var(--white)]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[240px] flex-col border-r border-[rgba(255,255,255,0.08)] bg-[rgba(14,14,13,0.9)] px-4 py-5 backdrop-blur-2xl lg:flex">
        <div className="mb-6 flex items-center gap-2 px-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--gold)] shadow-[0_0_12px_rgba(201,168,76,0.8)]" />
          <span className="font-medium tracking-tight">Reportly</span>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isItemActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`mac-hover-target flex items-center rounded-xl px-3 py-2.5 text-sm transition-all ${
                  active
                    ? "border border-[rgba(201,168,76,0.35)] bg-[rgba(201,168,76,0.12)] text-[var(--gold)]"
                    : "border border-transparent text-[var(--subtle)] hover:border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--white)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mac-card p-3">
          <p className="truncate text-xs text-[var(--muted)]">{userEmail}</p>
          <button
            type="button"
            onClick={handleSignOut}
            className="mac-btn-secondary mt-3 w-full"
          >
            Sign out
          </button>
        </div>
      </aside>

      <TopBar />

      <main className="px-4 pb-24 pt-[72px] lg:ml-[240px] lg:p-6">
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-4 border-t border-[rgba(255,255,255,0.08)] bg-[rgba(10,10,10,0.85)] px-1 backdrop-blur-2xl lg:hidden">
        {NAV_ITEMS.map((item) => {
          const active = isItemActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mac-hover-target flex items-center justify-center text-xs transition-colors ${
                active ? "text-[var(--gold)]" : "text-[var(--subtle)]"
              }`}
            >
              {item.short}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
