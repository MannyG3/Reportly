import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Json } from "@/types";

function getString(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

function pageUrlWithMessage(
  kind: "success" | "error",
  message: string
): string {
  const url = new URL("http://local/reports");
  url.searchParams.set(kind, message);
  return `${url.pathname}?${url.searchParams.toString()}`;
}

async function getAgencyIdForAuthedUser() {
  const supabase = createSupabaseServerClient();
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

  return { supabase, agencyId: dbUser.agency_id };
}

function monthLabel(d: Date) {
  return d.toLocaleString("en-US", { month: "short", year: "numeric" });
}

async function generateReportAction(formData: FormData) {
  "use server";

  const clientId = getString(formData, "clientId").trim();
  const titleRaw = getString(formData, "title").trim();
  const title = titleRaw.length ? titleRaw : `Monthly Report · ${monthLabel(new Date())}`;

  if (!clientId) {
    redirect(pageUrlWithMessage("error", "Please select a client."));
  }

  try {
    const { supabase, agencyId } = await getAgencyIdForAuthedUser();

    const shareToken = crypto.randomUUID().replaceAll("-", "");
    const nowIso = new Date().toISOString();

    const { data: report, error: reportError } = await supabase
      .from("reports")
      .insert({
        agency_id: agencyId,
        client_id: clientId,
        title,
        status: "generating",
        share_token: shareToken,
      })
      .select("id")
      .single();

    if (reportError || !report) {
      throw reportError ?? new Error("Unable to create report.");
    }

    const sections: Array<{
      report_id: string;
      section_type: string;
      data_snapshot: Json;
      sort_order: number;
    }> = [
      {
        report_id: report.id,
        section_type: "kpis",
        sort_order: 1,
        data_snapshot: {
          period: monthLabel(new Date()),
          kpis: [
            { label: "Sessions", value: 48210, delta: 0.12 },
            { label: "Users", value: 31790, delta: 0.08 },
            { label: "Leads", value: 642, delta: 0.19 },
            { label: "Spend", value: 5230, delta: -0.05 },
          ],
        },
      },
      {
        report_id: report.id,
        section_type: "traffic_over_time",
        sort_order: 2,
        data_snapshot: {
          series: [
            { date: "Week 1", sessions: 10500, users: 7200 },
            { date: "Week 2", sessions: 11800, users: 7900 },
            { date: "Week 3", sessions: 12450, users: 8200 },
            { date: "Week 4", sessions: 13460, users: 8490 },
          ],
        },
      },
      {
        report_id: report.id,
        section_type: "channel_mix",
        sort_order: 3,
        data_snapshot: {
          channels: [
            { name: "Organic", value: 44 },
            { name: "Paid", value: 28 },
            { name: "Direct", value: 18 },
            { name: "Referral", value: 10 },
          ],
        },
      },
    ];

    const { error: sectionsError } = await supabase
      .from("report_sections")
      .insert(sections);

    if (sectionsError) {
      throw sectionsError;
    }

    const { error: finalizeError } = await supabase
      .from("reports")
      .update({ status: "ready", generated_at: nowIso })
      .eq("id", report.id)
      .eq("agency_id", agencyId);

    if (finalizeError) {
      throw finalizeError;
    }

    revalidatePath("/reports");
    redirect(pageUrlWithMessage("success", "Report generated."));
  } catch (err) {
    console.error(err);
    redirect(
      pageUrlWithMessage("error", "Unable to generate report. Please try again.")
    );
  }
}

function StatusPill({ status }: { status: string }) {
  const styles =
    status === "ready"
      ? "border-emerald-900/60 bg-emerald-950/25 text-emerald-200"
      : status === "generating"
        ? "border-amber-900/60 bg-amber-950/25 text-amber-200"
        : status === "failed"
          ? "border-red-900/60 bg-red-950/25 text-red-200"
          : "border-neutral-800 bg-neutral-950 text-neutral-300";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium",
        styles,
      ].join(" ")}
    >
      {status}
    </span>
  );
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const success =
    typeof params.success === "string" ? params.success : undefined;
  const error = typeof params.error === "string" ? params.error : undefined;

  const { supabase, agencyId } = await getAgencyIdForAuthedUser();

  const [{ data: clients, error: clientsError }, { data: reports, error: reportsError }] =
    await Promise.all([
      supabase
        .from("clients")
        .select("id, name")
        .eq("agency_id", agencyId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("reports")
        .select("id, title, status, share_token, generated_at, created_at, client_id")
        .eq("agency_id", agencyId)
        .order("created_at", { ascending: false }),
    ]);

  if (clientsError || reportsError) {
    console.error(clientsError ?? reportsError);
    return (
      <div className="rounded-xl border border-red-900/60 bg-red-950/30 p-5">
        <h1 className="text-sm font-medium text-red-200">
          Unable to load reports
        </h1>
        <p className="mt-2 text-sm text-red-300/90">
          Please refresh the page. If the issue persists, check your Supabase RLS
          policies.
        </p>
      </div>
    );
  }

  const clientMap = new Map((clients ?? []).map((c) => [c.id, c.name] as const));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
            Reports
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Generate and share branded reports with your clients.
          </p>
        </div>
      </div>

      {(success || error) && (
        <div
          className={[
            "rounded-xl border px-4 py-3 text-sm",
            success
              ? "border-emerald-900/60 bg-emerald-950/25 text-emerald-200"
              : "border-red-900/60 bg-red-950/25 text-red-200",
          ].join(" ")}
        >
          {success ?? error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 rounded-xl border border-neutral-900 bg-neutral-950/60 p-5 shadow-lg shadow-black/30">
          <h2 className="text-sm font-medium text-neutral-200">
            Generate report
          </h2>
          <p className="mt-1 text-sm text-neutral-400">
            Create a new report for a client (mock sections for now).
          </p>

          <form action={generateReportAction} className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <label
                className="block text-xs text-neutral-400"
                htmlFor="clientId"
              >
                Client
              </label>
              <select
                id="clientId"
                name="clientId"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-500/40 transition"
                required
                defaultValue=""
              >
                <option value="" disabled>
                  Select a client…
                </option>
                {(clients ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs text-neutral-400" htmlFor="title">
                Title (optional)
              </label>
              <input
                id="title"
                name="title"
                type="text"
                placeholder={`Monthly Report · ${monthLabel(new Date())}`}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm placeholder-neutral-500 outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-500/40 transition"
              />
            </div>

            <button
              type="submit"
              disabled={(clients ?? []).length === 0}
              className="w-full inline-flex items-center justify-center rounded-lg bg-neutral-50 text-neutral-950 px-4 py-2.5 text-sm font-medium hover:bg-white/90 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Generate
            </button>
          </form>

          {(clients ?? []).length === 0 && (
            <p className="mt-3 text-xs text-neutral-500">
              Add a client first on the{" "}
              <Link
                href="/clients"
                className="text-neutral-200 hover:text-white underline underline-offset-4"
              >
                Clients
              </Link>{" "}
              page.
            </p>
          )}
        </div>

        <div className="lg:col-span-2 rounded-xl border border-neutral-900 bg-neutral-950/60 shadow-lg shadow-black/30 overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-900 flex items-center justify-between">
            <h2 className="text-sm font-medium text-neutral-200">
              Recent reports
            </h2>
            <div className="text-xs text-neutral-500">
              {(reports?.length ?? 0).toString()} total
            </div>
          </div>

          <div className="divide-y divide-neutral-900">
            {(reports ?? []).length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-neutral-300">No reports yet.</p>
                <p className="mt-1 text-sm text-neutral-500">
                  Generate your first report to share with a client.
                </p>
              </div>
            ) : (
              (reports ?? []).map((r) => {
                const clientName = clientMap.get(r.client_id) ?? "Unknown client";
                const sharePath = r.share_token ? `/r/${r.share_token}` : null;
                return (
                  <div
                    key={r.id}
                    className="px-5 py-4 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="text-sm font-medium text-neutral-100 truncate">
                          {r.title}
                        </div>
                        <StatusPill status={r.status} />
                      </div>
                      <div className="mt-0.5 text-xs text-neutral-500 truncate">
                        {clientName}
                        {r.generated_at ? ` · Generated ${new Date(r.generated_at).toLocaleDateString()}` : ""}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {sharePath ? (
                        <Link
                          href={sharePath}
                          className="inline-flex items-center justify-center rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-medium text-neutral-200 hover:bg-neutral-900/70 transition"
                        >
                          Open
                        </Link>
                      ) : (
                        <span className="text-xs text-neutral-600">—</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

