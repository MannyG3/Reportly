import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { getAgencyIdForAuthedUser } from "@/lib/auth";
import type { Json } from "@/types";
import ReportsViewClient from "@/components/reports/ReportsViewClient";

function getString(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

function pageUrlWithMessage(kind: "success" | "error", message: string): string {
  const url = new URL("http://local/reports");
  url.searchParams.set(kind, message);
  return `${url.pathname}?${url.searchParams.toString()}`;
}



function monthLabel(d: Date) {
  return d.toLocaleString("en-US", { month: "short", year: "numeric" });
}

// Generate report Action
async function generateReportAction(formData: FormData) {
  "use server";

  const clientId = getString(formData, "clientId").trim();
  const titleRaw = getString(formData, "title").trim();
  const period = getString(formData, "period").trim() || monthLabel(new Date());
  const commentaryText = getString(formData, "commentary").trim();
  
  const includeGA = formData.get("platform_ga") === "on";
  const includeGoogleAds = formData.get("platform_gads") === "on";
  const includeMetaAds = formData.get("platform_mads") === "on";

  const title =
    titleRaw.length > 0 ? titleRaw : `Monthly Report · ${period}`;

  if (!clientId) {
    redirect(pageUrlWithMessage("error", "Please select a client."));
  }

  try {
    const { agencyId } = await getAgencyIdForAuthedUser();
    const adminSupabase = getSupabaseServiceRoleClient();

    // Check if at least one platform/commentary is selected
    if (!includeGA && !includeGoogleAds && !includeMetaAds && !commentaryText) {
      redirect(pageUrlWithMessage("error", "Please select at least one reporting section or enter commentary."));
    }

    const shareToken = crypto.randomUUID().replaceAll("-", "");
    const nowIso = new Date().toISOString();

    const { data: report, error: reportError } = await adminSupabase
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
    }> = [];

    let sortOrder = 1;

    // 1. Executive Summary/Commentary section
    if (commentaryText) {
      sections.push({
        report_id: report.id,
        section_type: "commentary",
        sort_order: sortOrder++,
        data_snapshot: {
          text: commentaryText,
        },
      });
    }

    // 2. GA4 Section
    if (includeGA) {
      sections.push({
        report_id: report.id,
        section_type: "google_analytics",
        sort_order: sortOrder++,
        data_snapshot: {
          period,
          kpis: [
            { label: "Sessions", value: 48210, delta: 0.12 },
            { label: "Users", value: 31790, delta: 0.08 },
            { label: "Pageviews", value: 89430, delta: 0.15 },
            { label: "Bounce Rate", value: 0.42, delta: -0.04 },
          ],
          series: [
            { date: "Week 1", sessions: 10500, users: 7200, pageviews: 20100 },
            { date: "Week 2", sessions: 11800, users: 7900, pageviews: 22400 },
            { date: "Week 3", sessions: 12450, users: 8200, pageviews: 23100 },
            { date: "Week 4", sessions: 13460, users: 8490, pageviews: 23830 },
          ],
          channels: [
            { name: "Organic Search", value: 42 },
            { name: "Direct Traffic", value: 24 },
            { name: "Paid Search", value: 18 },
            { name: "Social Media", value: 10 },
            { name: "Referral Link", value: 6 },
          ],
        },
      });
    }

    // 3. Google Ads Section
    if (includeGoogleAds) {
      sections.push({
        report_id: report.id,
        section_type: "google_ads",
        sort_order: sortOrder++,
        data_snapshot: {
          period,
          kpis: [
            { label: "Spend", value: 3840, delta: 0.08, format: "currency" },
            { label: "Impressions", value: 124900, delta: 0.05 },
            { label: "Clicks", value: 8920, delta: 0.14 },
            { label: "CTR", value: 0.0714, delta: 0.08, format: "percentage" },
            { label: "Conversions", value: 412, delta: 0.22 },
          ],
          campaigns: [
            { name: "Brand Search - US", spend: 1240, clicks: 3100, impressions: 22000, ctr: 0.141, conversions: 195 },
            { name: "Competitor Target - UK", spend: 980, clicks: 1220, impressions: 18500, ctr: 0.066, conversions: 62 },
            { name: "Generic Non-Brand - CA", spend: 1120, clicks: 3400, impressions: 64400, ctr: 0.052, conversions: 125 },
            { name: "Remarketing Performance Max", spend: 500, clicks: 1200, impressions: 20000, ctr: 0.060, conversions: 30 },
          ],
        },
      });
    }

    // 4. Meta Ads Section
    if (includeMetaAds) {
      sections.push({
        report_id: report.id,
        section_type: "meta_ads",
        sort_order: sortOrder++,
        data_snapshot: {
          period,
          kpis: [
            { label: "Spend", value: 2950, delta: -0.04, format: "currency" },
            { label: "Reach", value: 92400, delta: 0.15 },
            { label: "Impressions", value: 145000, delta: 0.18 },
            { label: "Link Clicks", value: 6810, delta: 0.09 },
            { label: "Conversions", value: 318, delta: 0.14 },
          ],
          campaigns: [
            { name: "Prospecting Lookalike 1-5%", spend: 1420, clicks: 3120, impressions: 68000, ctr: 0.0458, conversions: 165 },
            { name: "Retargeting - Product Viewers", spend: 850, clicks: 2310, impressions: 39000, ctr: 0.0592, conversions: 112 },
            { name: "Broad - Interest Target", spend: 680, clicks: 1380, impressions: 38000, ctr: 0.0363, conversions: 41 },
          ],
        },
      });
    }

    const { error: sectionsError } = await adminSupabase
      .from("report_sections")
      .insert(sections);

    if (sectionsError) {
      throw sectionsError;
    }

    const { error: finalizeError } = await adminSupabase
      .from("reports")
      .update({ status: "ready", generated_at: nowIso })
      .eq("id", report.id)
      .eq("agency_id", agencyId);

    if (finalizeError) {
      throw finalizeError;
    }

    revalidatePath("/reports");
    revalidatePath("/dashboard");
    redirect(pageUrlWithMessage("success", "Report generated successfully."));
  } catch (err) {
    console.error(err);
    redirect(
      pageUrlWithMessage("error", "Unable to generate report. Please try again.")
    );
  }
}

// Delete Report Action
async function deleteReportAction(formData: FormData) {
  "use server";
  const id = getString(formData, "reportId").trim();
  if (!id) {
    redirect(pageUrlWithMessage("error", "Missing report ID."));
  }

  try {
    const { agencyId } = await getAgencyIdForAuthedUser();
    const adminSupabase = getSupabaseServiceRoleClient();

    const { error: deleteError } = await adminSupabase
      .from("reports")
      .delete()
      .eq("id", id)
      .eq("agency_id", agencyId);

    if (deleteError) {
      throw deleteError;
    }

    revalidatePath("/reports");
    revalidatePath("/dashboard");
    redirect(pageUrlWithMessage("success", "Report deleted successfully."));
  } catch (err) {
    console.error(err);
    redirect(pageUrlWithMessage("error", "Unable to delete report."));
  }
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const success = typeof params.success === "string" ? params.success : undefined;
  const error = typeof params.error === "string" ? params.error : undefined;
  const defaultClientId = typeof params.clientId === "string" ? params.clientId : "";

  const { supabase, agencyId } = await getAgencyIdForAuthedUser();

  // Fetch client details, reports list, and integrations
  const [
    { data: clients, error: clientsError },
    { data: reports, error: reportsError },
    { data: integrations, error: integrationsError },
  ] = await Promise.all([
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
    supabase
      .from("integrations")
      .select("platform")
      .eq("agency_id", agencyId),
  ]);

  if (clientsError || reportsError || integrationsError) {
    console.error(clientsError ?? reportsError ?? integrationsError);
    return (
      <div className="mac-page mac-alert mac-alert-error">
        <h1 className="text-sm font-medium text-red-200">Unable to load reports panel</h1>
        <p className="mt-2 text-sm text-red-300/90">
          Please refresh the page. If the issue persists, check your Supabase configurations.
        </p>
      </div>
    );
  }

  // Determine active integration flags
  const connectedPlatforms = new Set((integrations ?? []).map((i) => i.platform));
  const hasGA = connectedPlatforms.has("google_analytics");
  const hasGAds = connectedPlatforms.has("google_ads");
  const hasMAds = connectedPlatforms.has("meta_ads");

  return (
    <div className="space-y-6 mac-page">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="mac-title">Reports Management</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Generate, customize, and share professional marketing analytics reports with clients.
          </p>
        </div>
      </div>

      {(success || error) && (
        <div
          className={[
            "mac-alert",
            success ? "mac-alert-success" : "mac-alert-error",
          ].join(" ")}
        >
          {success ?? error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report builder card */}
        <div className="lg:col-span-1 mac-card p-5 space-y-4">
          <div>
            <h2 className="text-base font-medium text-[var(--white)]">Generate Brand Report</h2>
            <p className="text-xs text-[var(--muted)]">
              Build report using connected platforms or custom comments.
            </p>
          </div>

          <form action={generateReportAction} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs text-neutral-400 font-medium" htmlFor="clientId">
                Client (Required)
              </label>
              <select
                id="clientId"
                name="clientId"
                className="mac-select"
                required
                defaultValue={defaultClientId}
              >
                <option value="" disabled>
                  Select client…
                </option>
                {(clients ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs text-neutral-400 font-medium" htmlFor="title">
                Report Title (Optional)
              </label>
              <input
                id="title"
                name="title"
                type="text"
                placeholder={`Monthly Report · ${monthLabel(new Date())}`}
                className="mac-input"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs text-neutral-400 font-medium" htmlFor="period">
                Reporting Period (Optional)
              </label>
              <input
                id="period"
                name="period"
                type="text"
                placeholder={monthLabel(new Date())}
                className="mac-input"
              />
            </div>

            {/* Checkbox Platform Integrations */}
            <div className="space-y-2.5">
              <span className="block text-xs text-neutral-400 font-medium">Included Analytics</span>
              
              <div className="space-y-2">
                <label className="flex items-center gap-2.5 text-xs text-neutral-200 cursor-pointer">
                  <input
                    type="checkbox"
                    name="platform_ga"
                    defaultChecked={hasGA}
                    className="rounded border-neutral-800 bg-neutral-900 text-[var(--gold)] focus:ring-[var(--gold)]"
                  />
                  <span>GA4 Traffic Metrics</span>
                  {hasGA ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-950/40 border border-green-900/60 text-green-400 font-medium">Connected</span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-500 font-medium">Demo Mode</span>
                  )}
                </label>

                <label className="flex items-center gap-2.5 text-xs text-neutral-200 cursor-pointer">
                  <input
                    type="checkbox"
                    name="platform_gads"
                    defaultChecked={hasGAds}
                    className="rounded border-neutral-800 bg-neutral-900 text-[var(--gold)] focus:ring-[var(--gold)]"
                  />
                  <span>Google Ads Campaigns</span>
                  {hasGAds ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-950/40 border border-green-900/60 text-green-400 font-medium">Connected</span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-500 font-medium">Demo Mode</span>
                  )}
                </label>

                <label className="flex items-center gap-2.5 text-xs text-neutral-200 cursor-pointer">
                  <input
                    type="checkbox"
                    name="platform_mads"
                    defaultChecked={hasMAds}
                    className="rounded border-neutral-800 bg-neutral-900 text-[var(--gold)] focus:ring-[var(--gold)]"
                  />
                  <span>Meta Ads Performance</span>
                  {hasMAds ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-950/40 border border-green-900/60 text-green-400 font-medium">Connected</span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-500 font-medium">Demo Mode</span>
                  )}
                </label>
              </div>
            </div>

            {/* Commentary box */}
            <div className="space-y-1.5">
              <label className="block text-xs text-neutral-400 font-medium" htmlFor="commentary">
                Executive Commentary / Notes
              </label>
              <textarea
                id="commentary"
                name="commentary"
                rows={3}
                placeholder="Write custom notes, observations or highlights for the client..."
                className="mac-input w-full resize-none min-h-[80px]"
              />
            </div>

            <button
              type="submit"
              disabled={(clients ?? []).length === 0}
              className="mac-btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Generate Report
            </button>
          </form>

          {(clients ?? []).length === 0 && (
            <p className="text-xs text-neutral-500">
              Please create a client profile first on the{" "}
              <Link
                href="/clients"
                className="text-[var(--white)] hover:text-[var(--gold)] underline underline-offset-4"
              >
                Clients Page
              </Link>
              .
            </p>
          )}
        </div>

        {/* Reports list section */}
        <div className="lg:col-span-2 mac-card overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-base font-medium text-[var(--white)]">All Generated Reports</h2>
            <div className="text-xs text-[var(--muted)] bg-neutral-900 px-2 py-1 rounded">
              {(reports?.length ?? 0).toString()} total
            </div>
          </div>

          <div className="p-5">
            <ReportsViewClient
              reports={reports ?? []}
              clients={(clients ?? []).map((c) => ({ id: c.id, name: c.name }))}
              deleteAction={deleteReportAction}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
