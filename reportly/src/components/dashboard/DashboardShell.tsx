"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import TopBar from "@/components/dashboard/TopBar";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import ThemeToggle from "@/components/ThemeToggle";
import { LayoutDashboard, Users, FileText, Settings, LogOut } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", short: "Home", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", short: "Clients", icon: Users },
  { href: "/reports", label: "Reports", short: "Reports", icon: FileText },
  { href: "/settings", label: "Settings", short: "Settings", icon: Settings },
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
    document.cookie = "is_demo=; path=/; max-age=0";
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-200">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[240px] flex-col border-r border-[var(--line-color)] bg-[var(--sidebar-bg)] px-4 py-5 backdrop-blur-2xl lg:flex transition-colors duration-200">
        <div className="mb-6 flex items-center gap-2 px-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--gold)] shadow-[0_0_12px_rgba(201,168,76,0.8)]" />
          <span className="font-semibold tracking-tight text-[var(--foreground)] text-sm">Reportly</span>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isItemActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`mac-hover-target flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all cursor-pointer ${
                  active
                    ? "border border-[var(--sidebar-active-border)] bg-[var(--sidebar-active-bg)] text-[var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_1px_2px_rgba(0,0,0,0.05)]"
                    : "border border-transparent text-[var(--subtle)] hover:bg-[var(--sidebar-active-bg)]/50 hover:text-[var(--foreground)]"
                }`}
              >
                <Icon className={`w-4 h-4 transition-colors ${active ? "text-[var(--gold)]" : "text-[var(--subtle)]"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3.5 border-t border-[var(--line-color)] pt-5">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--gold)]/10 text-[var(--gold)] font-bold text-xs border border-[var(--gold)]/20 uppercase select-none">
              {userEmail.slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-[var(--foreground)]">Agency Admin</p>
              <p className="truncate text-[10px] text-[var(--muted)]">{userEmail}</p>
            </div>
            <ThemeToggle />
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] hover:bg-[rgba(128,128,128,0.03)] cursor-pointer transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 text-[var(--subtle)]" />
            Sign out
          </button>
        </div>
      </aside>

      <TopBar />

      <main className="px-4 pb-24 pt-[72px] lg:ml-[240px] lg:p-6 animate-fade-in">
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-4 border-t border-[var(--line-color)] bg-[var(--sidebar-bg)] px-1 backdrop-blur-2xl lg:hidden transition-colors duration-200">
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
