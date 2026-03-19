import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Json } from "@/types";

interface CreateReportBody {
  clientId: string;
  title?: string;
}

function monthLabel(d: Date) {
  return d.toLocaleString("en-US", { month: "short", year: "numeric" });
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: CreateReportBody;
    try {
      body = (await req.json()) as CreateReportBody;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const clientId = (body.clientId ?? "").trim();
    const titleInput = (body.title ?? "").trim();
    const title = titleInput.length
      ? titleInput
      : `Monthly Report · ${monthLabel(new Date())}`;

    if (!clientId) {
      return NextResponse.json({ error: "clientId is required" }, { status: 400 });
    }

    const { data: dbUser, error: dbUserError } = await supabase
      .from("users")
      .select("agency_id")
      .eq("id", user.id)
      .single();

    if (dbUserError || !dbUser) {
      return NextResponse.json({ error: "Unable to resolve agency" }, { status: 403 });
    }

    const agencyId = dbUser.agency_id;
    const shareToken = crypto.randomUUID().replaceAll("-", "");
    const generatedAt = new Date().toISOString();

    const { data: report, error: reportError } = await supabase
      .from("reports")
      .insert({
        agency_id: agencyId,
        client_id: clientId,
        title,
        status: "generating",
        share_token: shareToken,
      })
      .select(
        "id, agency_id, client_id, title, status, share_token, generated_at, created_at"
      )
      .single();

    if (reportError || !report) {
      return NextResponse.json({ error: "Unable to create report" }, { status: 500 });
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
      await supabase
        .from("reports")
        .update({ status: "failed" })
        .eq("id", report.id)
        .eq("agency_id", agencyId);

      return NextResponse.json(
        { error: "Unable to create report sections" },
        { status: 500 }
      );
    }

    const { data: finalized, error: finalizeError } = await supabase
      .from("reports")
      .update({ status: "ready", generated_at: generatedAt })
      .eq("id", report.id)
      .eq("agency_id", agencyId)
      .select("id, title, status, share_token, generated_at, created_at, client_id")
      .single();

    if (finalizeError || !finalized) {
      return NextResponse.json({ error: "Unable to finalize report" }, { status: 500 });
    }

    return NextResponse.json(
      { report: finalized, shareUrl: `/r/${finalized.share_token}` },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

