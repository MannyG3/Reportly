import { NextResponse } from "next/server";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
    const { userId, agencyId } = json || {};

    if (!userId || !agencyId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const supabase = getSupabaseServiceRoleClient();

    // 1. Ensure Subscription exists
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("agency_id", agencyId)
      .maybeSingle();

    if (!sub) {
      await supabase.from("subscriptions").insert({
        agency_id: agencyId,
        stripe_customer_id: "cus_demo_12345",
        stripe_subscription_id: "sub_demo_12345",
        plan: "starter",
        status: "active",
      });
    }

    // 2. Ensure Clients exist
    const { data: existingClients } = await supabase
      .from("clients")
      .select("id")
      .eq("agency_id", agencyId)
      .limit(1);

    if (!existingClients || existingClients.length === 0) {
      // Insert mock clients
      const { data: insertedClients } = await supabase
        .from("clients")
        .insert([
          { agency_id: agencyId, name: "Acme Corp", email: "contact@acme.com" },
          { agency_id: agencyId, name: "Stark Industries", email: "pepper@stark.com" },
          { agency_id: agencyId, name: "Wayne Enterprises", email: "bruce@wayne.com" },
        ])
        .select("id");

      if (insertedClients && insertedClients.length > 0) {
        const clientIds = insertedClients.map((c) => c.id);
        
        // Insert mock reports
        const reportsToInsert = [
          { agency_id: agencyId, client_id: clientIds[0], title: "Q2 Marketing Performance", status: "ready" as const, share_token: "demo-token-1" },
          { agency_id: agencyId, client_id: clientIds[0], title: "Google Ads Overview", status: "ready" as const, share_token: "demo-token-2" },
          { agency_id: agencyId, client_id: clientIds[1], title: "Social Campaign Reach", status: "ready" as const, share_token: "demo-token-3" },
          { agency_id: agencyId, client_id: clientIds[2], title: "Monthly Growth Audit", status: "ready" as const, share_token: "demo-token-4" },
          { agency_id: agencyId, client_id: clientIds[2], title: "SEO Audit Draft", status: "draft" as const },
        ];

        await supabase.from("reports").insert(reportsToInsert);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Demo setup failed:", err);
    return NextResponse.json({ error: "Internal setup error" }, { status: 500 });
  }
}
