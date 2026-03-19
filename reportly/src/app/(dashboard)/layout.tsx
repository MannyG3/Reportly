import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/clients", label: "Clients" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
];

export const revalidate = 60; // ISR: revalidate every 60 seconds

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // Fetch both user and agency in a single query with join.
  const { data: dbUser, error: dbUserError } = await supabase
    .from("users")
    .select("email, agency_id, agencies(name)")
    .eq("id", user.id)
    .maybeSingle();

  if (dbUserError) {
    redirect("/login");
  }

  if (!dbUser) {
    redirect("/setup");
  }

  const agencyName = (dbUser.agencies as { name?: string } | null)?.name ?? "Your agency";
  const userEmail = dbUser.email ?? user.email ?? "";

  return (
    <>
      <style>{`
        .sidebar {
          background: linear-gradient(180deg, #111110 0%, #0a0a0a 100%);
          border-right: 1px solid rgba(255, 255, 255, 0.08);
        }

        .nav-item {
          color: var(--subtle);
          transition: all 0.15s ease;
        }

        .nav-item:hover {
          color: var(--white);
          background: rgba(255, 255, 255, 0.04);
        }

        .nav-item:active {
          transform: scale(0.98);
        }

        .app-header {
          background: rgba(10, 10, 10, 0.75);
          backdrop-filter: blur(24px) saturate(200%);
          -webkit-backdrop-filter: blur(24px) saturate(200%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .sidebar-section {
          border-color: rgba(255, 255, 255, 0.08);
        }

        .user-card {
          background: rgba(255, 255, 255, 0.04);
          border-radius: 10px;
          padding: 10px 16px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: background 0.15s ease, border-color 0.15s ease;
        }

        .user-card:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.16);
        }

        .main-content {
          background: var(--black);
        }
      `}</style>

      <div className="min-h-screen bg-[var(--black)] text-[var(--white)] flex">
        <aside className="hidden md:flex w-64 flex-col sidebar">
          <div className="h-16 flex items-center px-6 border-b sidebar-section">
            <div className="flex items-center gap-3 user-card flex-1">
              <div className="h-8 w-8 rounded-lg bg-[var(--gold)] flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-500 leading-tight truncate" style={{ fontFamily: 'var(--sf)' }}>
                  {agencyName}
                </span>
                <span className="text-[11px] text-[var(--muted)] leading-tight truncate">
                  {userEmail}
                </span>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="nav-item flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-400"
                style={{ fontFamily: 'var(--sf)', letterSpacing: '-0.01em' }}
              >
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="px-4 py-4 border-t sidebar-section text-xs text-[var(--muted)]" style={{ fontFamily: 'var(--sf)' }}>
            <p className="truncate">Reportly · Client reporting</p>
          </div>
        </aside>

        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between app-header px-4 md:px-6">
            <div className="flex items-center gap-3 md:hidden">
              <div className="h-6 w-6 rounded-lg bg-[var(--gold)]" />
              <span className="text-sm font-500 truncate" style={{ fontFamily: 'var(--sf)' }}>{agencyName}</span>
            </div>
            <div className="flex-1" />
            <div className="text-xs text-[var(--muted)] hidden md:block" style={{ fontFamily: 'var(--sf)' }}>{userEmail}</div>
          </header>

          <main className="flex-1 px-4 md:px-8 py-6 md:py-8 main-content">
            <div className="max-w-6xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </>
  );
}

