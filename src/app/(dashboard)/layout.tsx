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

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: dbUser } = await supabase
    .from("users")
    .select("email, agency_id")
    .eq("id", user.id)
    .single();

  if (!dbUser) {
    redirect("/login");
  }

  const { data: agency } = await supabase
    .from("agencies")
    .select("name")
    .eq("id", dbUser.agency_id)
    .single();

  const agencyName = agency?.name ?? "Your agency";
  const userEmail = dbUser.email ?? user.email ?? "";

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 flex">
      <aside className="hidden md:flex w-64 flex-col border-r border-neutral-900 bg-gradient-to-b from-neutral-950 via-neutral-950 to-neutral-950/80">
        <div className="h-16 flex items-center px-6 border-b border-neutral-900">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-neutral-100" />
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-tight truncate">
                {agencyName}
              </span>
              <span className="text-[11px] text-neutral-400 leading-tight truncate">
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
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-300 hover:text-neutral-50 hover:bg-neutral-900/80 transition-colors"
            >
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-neutral-900 text-xs text-neutral-500">
          <p className="truncate">Reportly · Client reporting</p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="h-14 flex items-center justify-between border-b border-neutral-900 px-4 md:px-6 bg-neutral-950/80 backdrop-blur">
          <div className="flex items-center gap-2 md:hidden">
            <div className="h-6 w-6 rounded-md bg-neutral-100" />
            <span className="text-sm font-semibold truncate">{agencyName}</span>
          </div>
          <div className="flex-1" />
          <div className="text-xs text-neutral-400 hidden md:block">
            {userEmail}
          </div>
        </header>

        <main className="flex-1 px-4 md:px-8 py-6 md:py-8 bg-neutral-950">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

