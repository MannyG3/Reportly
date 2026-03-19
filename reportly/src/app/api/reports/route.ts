import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database, Json } from "@/types";

type TypedSupabaseClient = any; // Would use proper typing

/**
 * POST /api/reports
 * Generate a new report for a client.
 * 
 * Request body:
 * {
 *   clientId: string;
 *   title: string; (optional)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientId, title } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId is required" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: any) {
            cookieStore.set(name, "", { ...options, maxAge: 0 });
          },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's agency
    const { data: dbUser, error: dbUserError } = await supabase
      .from("users")
      .select("agency_id")
      .eq("id", user.id)
      .single();

    if (dbUserError || !dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 401 }
      );
    }

    const agencyId = dbUser.agency_id;

    // Verify client belongs to this agency
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, name")
      .eq("id", clientId)
      .eq("agency_id", agencyId)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: "Client not found or does not belong to your agency" },
        { status: 403 }
      );
    }

    // Generate report title if not provided
    const now = new Date();
    const reportTitle =
      title ||
      `${now.toLocaleString("en-US", { month: "long", year: "numeric" })} Report`;

    // Create report row
    const shareToken = crypto.randomUUID().replaceAll("-", "");
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .insert({
        agency_id: agencyId,
        client_id: clientId,
        title: reportTitle,
        status: "generating",
        share_token: shareToken,
      })
      .select("id")
      .single();

    if (reportError || !report) {
      return NextResponse.json(
        { error: "Failed to create report" },
        { status: 500 }
      );
    }

    // Create mock report sections with placeholder data
    const sections = await createMockReportSections(supabase, report.id);

    // Mark report as ready
    const { error: updateError } = await supabase
      .from("reports")
      .update({ status: "ready", generated_at: new Date().toISOString() })
      .eq("id", report.id);

    if (updateError) {
      console.error("Failed to update report status:", updateError);
    }

    return NextResponse.json({
      id: report.id,
      title: reportTitle,
      clientName: client.name,
      shareToken,
      status: "ready",
      sections,
    });
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Create mock report sections with placeholder data.
 * In production, this would fetch real data from GA/Google Ads.
 */
async function createMockReportSections(
  supabase: any,
  reportId: string
): Promise<any[]> {
  const mockSections = [
    {
      report_id: reportId,
      section_type: "overview",
      data_snapshot: {
        metric: "Total Sessions",
        value: 12543,
        change: 15.3,
        description: "Sessions from all users",
      } as Json,
      sort_order: 1,
    },
    {
      report_id: reportId,
      section_type: "traffic",
      data_snapshot: {
        metric: "Page Views",
        value: 34876,
        change: 8.2,
        description: "Total page views across the site",
        chartData: [
          { name: "Week 1", value: 8000 },
          { name: "Week 2", value: 9200 },
          { name: "Week 3", value: 8500 },
          { name: "Week 4", value: 9100 },
        ],
      } as Json,
      sort_order: 2,
    },
    {
      report_id: reportId,
      section_type: "conversions",
      data_snapshot: {
        metric: "Conversions",
        value: 543,
        change: 22.5,
        description: "Total conversions in the period",
        conversionRate: "4.3%",
      } as Json,
      sort_order: 3,
    },
    {
      report_id: reportId,
      section_type: "topPages",
      data_snapshot: {
        title: "Top Pages",
        pages: [
          { path: "/pricing", views: 3421, value: 12543 },
          { path: "/features", views: 2876, value: 11234 },
          { path: "/", views: 2654, value: 9876 },
          { path: "/about", views: 1543, value: 5432 },
          { path: "/contact", views: 1234, value: 4567 },
        ],
      } as Json,
      sort_order: 4,
    },
    {
      report_id: reportId,
      section_type: "deviceBreakdown",
      data_snapshot: {
        title: "Device Breakdown",
        devices: [
          { name: "Desktop", value: 45, sessions: 5654 },
          { name: "Mobile", value: 45, sessions: 5654 },
          { name: "Tablet", value: 10, sessions: 1235 },
        ],
      } as Json,
      sort_order: 5,
    },
  ];

  const { data: sections, error } = await supabase
    .from("report_sections")
    .insert(mockSections)
    .select();

  if (error) {
    console.error("Failed to create report sections:", error);
    return [];
  }

  return sections || [];
}

/**
 * GET /api/reports?reportId=<id>
 * Fetch a single report with sections.
 */
export async function GET(req: NextRequest) {
  try {
    const reportId = req.nextUrl.searchParams.get("reportId");

    if (!reportId) {
      return NextResponse.json(
        { error: "reportId is required" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: any) {
            cookieStore.set(name, "", { ...options, maxAge: 0 });
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: dbUser } = await supabase
      .from("users")
      .select("agency_id")
      .eq("id", user.id)
      .single();

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 401 }
      );
    }

    // Fetch report with auth check
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .select("*")
      .eq("id", reportId)
      .eq("agency_id", dbUser.agency_id)
      .single();

    if (reportError || !report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    // Fetch sections
    const { data: sections, error: sectionsError } = await supabase
      .from("report_sections")
      .select("*")
      .eq("report_id", reportId)
      .order("sort_order", { ascending: true });

    if (sectionsError) {
      console.error("Failed to fetch sections:", sectionsError);
    }

    return NextResponse.json({
      report,
      sections: sections || [],
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
