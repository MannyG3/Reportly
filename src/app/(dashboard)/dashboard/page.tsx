import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-neutral-900 bg-neutral-950/60 p-5 shadow-lg shadow-black/30">
      <div className="text-xs text-neutral-400">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-neutral-50">
        {value}
      </div>
    </div>
  );
}

export default async function DashboardHomePage() {
  const supabase = createSupabaseServerClient();

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      redirect("/login");
    }

    const { data: dbUser, error: dbUserError } = await supabase
      .from("users")
      .select("agency_id")
      .eq("id", user.id)
      .single();

    if (dbUserError || !dbUser) {
      redirect("/login");
    }

    const agencyId = dbUser.agency_id;

    const now = new Date();
    const startOfMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0)
    );
    const startOfNextMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0)
    );

    const [{ count: totalClients, error: clientsError }, { count: totalReports, error: reportsError }, { count: reportsThisMonth, error: monthError }] =
      await Promise.all([
        supabase
          .from("clients")
          .select("id", { count: "exact", head: true })
          .eq("agency_id", agencyId)
          .is("deleted_at", null),
        supabase
          .from("reports")
          .select("id", { count: "exact", head: true })
          .eq("agency_id", agencyId),
        supabase
          .from("reports")
          .select("id", { count: "exact", head: true })
          .eq("agency_id", agencyId)
          .gte("generated_at", startOfMonth.toISOString())
          .lt("generated_at", startOfNextMonth.toISOString()),
      ]);

    if (clientsError) throw clientsError;
    if (reportsError) throw reportsError;
    if (monthError) throw monthError;

    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-neutral-400">
              Your reporting overview and recent activity.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Total clients" value={totalClients ?? 0} />
          <StatCard label="Total reports generated" value={totalReports ?? 0} />
          <StatCard label="Reports generated this month" value={reportsThisMonth ?? 0} />
        </div>

        <div className="rounded-xl border border-neutral-900 bg-neutral-950/60 p-5">
          <h2 className="text-sm font-medium text-neutral-200">
            Getting started
          </h2>
          <p className="mt-2 text-sm text-neutral-400">
            Add your first client, then generate a report. We’ll automate monthly
            branded reporting once integrations are connected.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href="/clients"
              className="inline-flex items-center justify-center rounded-lg bg-neutral-50 text-neutral-950 px-3.5 py-2 text-sm font-medium hover:bg-white/90 transition"
            >
              Add a client
            </a>
            <a
              href="/reports"
              className="inline-flex items-center justify-center rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-100 px-3.5 py-2 text-sm font-medium hover:bg-neutral-900/70 transition"
            >
              View reports
            </a>
          </div>
        </div>
      </div>
    );
  } catch (err) {
    console.error(err);
    return (
      <div className="rounded-xl border border-red-900/60 bg-red-950/30 p-5">
        <h1 className="text-sm font-medium text-red-200">
          Unable to load dashboard
        </h1>
        <p className="mt-2 text-sm text-red-300/90">
          Please refresh the page. If the issue persists, check your Supabase
          configuration and RLS policies.
        </p>
      </div>
    );
  }
}

