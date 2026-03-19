import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types";

interface ReportSection {
  id: string;
  section_type: string;
  data_snapshot: Json;
  sort_order: number;
}

/**
 * Public report page accessible via share token.
 * Route: /r/[token]
 */
export default async function PublicReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-50 flex items-center justify-center">
        <p className="text-red-400">Configuration error. Please try again later.</p>
      </div>
    );
  }

  // Use service role for public access (share token is the access control)
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

  // Fetch report by share_token
  const { data: report, error: reportError } = await supabase
    .from("reports")
    .select("id, title, agency_id, client_id, status, generated_at, agencies(name, logo_url, brand_color, custom_domain), clients(name)")
    .eq("share_token", token)
    .single();

  if (reportError || !report) {
    notFound();
  }

  // Fetch report sections
  const { data: sections, error: sectionsError } = await supabase
    .from("report_sections")
    .select("*")
    .eq("report_id", report.id)
    .order("sort_order", { ascending: true });

  if (sectionsError) {
    console.error("Failed to fetch sections:", sectionsError);
  }

  // Extract related data
  const agency = (report as any).agencies;
  const client = (report as any).clients;

  if (!agency) {
    notFound();
  }

  const brandColor = agency.brand_color || "#ffffff";
  const logoUrl = agency.logo_url;
  const generatedDate = report.generated_at
    ? new Date(report.generated_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50">
      {/* Header with agency branding */}
      <header className="border-b border-neutral-900 bg-gradient-to-b from-neutral-950 to-neutral-950/80">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-6">
            {logoUrl && (
              <img
                src={logoUrl}
                alt={agency.name}
                className="h-12 w-12 object-contain"
              />
            )}
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-widest">Brand</p>
              <h1 className="text-2xl font-semibold" style={{ color: brandColor }}>
                {agency.name}
              </h1>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-50">
              {report.title}
            </h2>
            {client && (
              <p className="text-sm text-neutral-400">
                {`Client: ${client.name}`}
              </p>
            )}
            <p className="text-xs text-neutral-500">
              Generated on {generatedDate}
            </p>
          </div>
        </div>
      </header>

      {/* Report sections */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {!sections || sections.length === 0 ? (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-8 text-center">
            <p className="text-neutral-400">No report data available yet.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {(sections as ReportSection[]).map((section) => (
              <ReportSection
                key={section.id}
                section={section}
                brandColor={brandColor}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 py-6 text-center text-xs text-neutral-500">
        <p>© {new Date().getFullYear()} {agency.name}. All rights reserved.</p>
      </footer>
    </main>
  );
}

/**
 * Render individual report section based on type
 */
function ReportSection({
  section,
  brandColor,
}: {
  section: ReportSection;
  brandColor: string;
}) {
  const data = section.data_snapshot as Record<string, any>;

  switch (section.section_type) {
    case "overview":
      return (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-neutral-300">{data.metric}</h3>
            <div className="flex items-end gap-3">
              <div className="text-4xl font-bold text-neutral-50">
                {data.value?.toLocaleString()}
              </div>
              {data.change && (
                <div
                  className="text-sm font-medium"
                  style={{
                    color:
                      data.change > 0
                        ? "#22c55e"
                        : data.change < 0
                          ? "#ef4444"
                          : brandColor,
                  }}
                >
                  {data.change > 0 ? "+" : ""}
                  {data.change}%
                </div>
              )}
            </div>
            {data.description && (
              <p className="text-xs text-neutral-400">{data.description}</p>
            )}
          </div>
        </div>
      );

    case "traffic":
      return (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6">
          <h3 className="mb-4 text-sm font-medium text-neutral-200">{data.metric}</h3>
          <div className="space-y-4">
            <div className="flex items-end gap-3">
              <div className="text-3xl font-bold text-neutral-50">
                {data.value?.toLocaleString()}
              </div>
              {data.change && (
                <div className="text-sm font-medium text-green-400">
                  +{data.change}%
                </div>
              )}
            </div>
            {data.chartData && (
              <div className="flex items-end gap-2 h-24">
                {data.chartData.map((point: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex-1 rounded-t-lg"
                    style={{
                      height: `${(point.value / 10000) * 100}%`,
                      backgroundColor: brandColor,
                      minHeight: "4px",
                    }}
                    title={`${point.name}: ${point.value}`}
                  />
                ))}
              </div>
            )}
            {data.description && (
              <p className="text-xs text-neutral-400">{data.description}</p>
            )}
          </div>
        </div>
      );

    case "conversions":
      return (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-neutral-400 mb-1">Total Conversions</p>
                <p className="text-2xl font-bold text-neutral-50">
                  {data.value?.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-400 mb-1">Conversion Rate</p>
                <p className="text-2xl font-bold" style={{ color: brandColor }}>
                  {data.conversionRate}
                </p>
              </div>
            </div>
            {data.change && (
              <p className="text-sm text-green-400">
                ↑ {data.change}% vs previous period
              </p>
            )}
          </div>
        </div>
      );

    case "topPages":
      return (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6">
          <h3 className="mb-4 text-sm font-medium text-neutral-200">
            {data.title || "Top Pages"}
          </h3>
          <div className="space-y-2">
            {data.pages?.map((page: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg border border-neutral-800/50 bg-neutral-950/40 px-3 py-2 text-xs"
              >
                <span className="font-mono text-neutral-400">{page.path}</span>
                <div className="flex gap-4 text-neutral-300">
                  <span>{page.views?.toLocaleString()} views</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case "deviceBreakdown":
      return (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6">
          <h3 className="mb-4 text-sm font-medium text-neutral-200">
            {data.title || "Device Breakdown"}
          </h3>
          <div className="space-y-3">
            {data.devices?.map((device: any, idx: number) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-300">{device.name}</span>
                  <span className="text-neutral-400">{device.value}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-neutral-800">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${device.value}%`,
                      backgroundColor: brandColor,
                    }}
                  />
                </div>
                <p className="text-xs text-neutral-500">
                  {device.sessions?.toLocaleString()} sessions
                </p>
              </div>
            ))}
          </div>
        </div>
      );

    default:
      return (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4">
          <p className="text-xs text-neutral-400">
            Section type "{section.section_type}" not supported
          </p>
        </div>
      );
  }
}
