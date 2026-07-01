import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient, getSupabaseServiceRoleClient } from "@/lib/supabase/server";

const addMemberSchema = z.object({
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  role: z.enum(["owner", "admin", "member"]),
});

async function getAgencyContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: dbUser, error: dbUserError } = await supabase
    .from("users")
    .select("agency_id, role")
    .eq("id", user.id)
    .single();

  if (dbUserError || !dbUser) {
    return {
      error: NextResponse.json({ error: "Unable to resolve agency" }, { status: 403 }),
    };
  }

  return { supabase, agencyId: dbUser.agency_id, userRole: dbUser.role };
}

// GET: List all team members
export async function GET() {
  try {
    const context = await getAgencyContext();
    if ("error" in context) return context.error;

    const { agencyId } = context;
    
    // We use service role to read users so that we don't get blocked by strict select policies
    const adminSupabase = getSupabaseServiceRoleClient();
    const { data: members, error } = await adminSupabase
      .from("users")
      .select("id, email, role, created_at")
      .eq("agency_id", agencyId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Fetch members error:", error);
      return NextResponse.json({ error: "Unable to fetch team members" }, { status: 500 });
    }

    return NextResponse.json({ members: members ?? [] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

// POST: Add new member (Simulated invite by creating user row)
export async function POST(req: Request) {
  try {
    const context = await getAgencyContext();
    if ("error" in context) return context.error;

    const { agencyId, userRole } = context;

    // Check privileges: only owners and admins can invite
    if (userRole !== "owner" && userRole !== "admin") {
      return NextResponse.json(
        { error: "Only owners and admins can add team members" },
        { status: 403 }
      );
    }

    const json = await req.json().catch(() => null);
    const parsed = addMemberSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { email, role } = parsed.data;

    const adminSupabase = getSupabaseServiceRoleClient();

    // Check if user already exists
    const { data: existingUser } = await adminSupabase
      .from("users")
      .select("id, email")
      .eq("email", email)
      .eq("agency_id", agencyId)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists in your agency" },
        { status: 400 }
      );
    }

    // Insert user record with a randomized uuid (since they don't have an auth.users record yet)
    // In a full environment, they'd accept an invite, but inserting simulates the invite success beautifully.
    const { data: newUser, error: insertError } = await adminSupabase
      .from("users")
      .insert({
        id: crypto.randomUUID(), // generate random UUID for team invite simulation
        agency_id: agencyId,
        email,
        role,
      })
      .select("id, email, role, created_at")
      .single();

    if (insertError || !newUser) {
      console.error("Insert team member error:", insertError);
      return NextResponse.json(
        { error: "Unable to add team member. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ member: newUser }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
