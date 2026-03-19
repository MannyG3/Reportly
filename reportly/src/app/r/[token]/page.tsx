import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PublicReportClientView } from "@/components/reports/PublicReportClient";

export default async function PublicReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const shareToken = token.trim();

  if (!shareToken) notFound();

  const supabase = await createSupabaseServerClient();

  const { data: report, error: reportError } = await supabase
    .from("reports")
    .select("id, agency_id, client_id, title, status, generated_at")
    .eq("share_token", shareToken)
    .maybeSingle();

  if (reportError || !report) notFound();
  if (report.status !== "ready") notFound();

  const [{ data: agency }, { data: client }, { data: sections }] = await Promise.all([
    supabase
      .from("agencies")
      .select("name, logo_url, brand_color")
      .eq("id", report.agency_id)
      .single(),
    supabase
      .from("clients")
      .select("name")
      .eq("id", report.client_id)
      .eq("agency_id", report.agency_id)
      .single(),
    supabase
      .from("report_sections")
      .select("id, section_type, data_snapshot, sort_order")
      .eq("report_id", report.id)
      .order("sort_order", { ascending: true }),
  ]);

  if (!agency || !client) notFound();

  const brandColor = (agency.brand_color && agency.brand_color.trim()) || "#6366f1";

  return (
    <PublicReportClientView
      agency={{ name: agency.name, logoUrl: agency.logo_url, brandColor }}
      client={{ name: client.name }}
      reportTitle={report.title}
      generatedAt={report.generated_at}
      sections={(sections ?? []).map((s) => ({
        id: s.id,
        section_type: s.section_type,
        sort_order: s.sort_order,
        data_snapshot: s.data_snapshot,
      }))}
    />
  );
}

