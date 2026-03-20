import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const createClientSchema = z.object({
  name: z.string().trim().min(1, "Client name is required").max(200),
  email: z
    .string()
    .trim()
    .email("Invalid email")
    .max(320)
    .optional()
    .or(z.literal(""))
    .nullable(),
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
    .select("agency_id")
    .eq("id", user.id)
    .single();

  if (dbUserError || !dbUser) {
    return {
      error: NextResponse.json({ error: "Unable to resolve agency" }, { status: 403 }),
    };
  }

  return { supabase, agencyId: dbUser.agency_id };
}

export async function GET() {
  try {
    const context = await getAgencyContext();
    if ("error" in context) return context.error;

    const { supabase, agencyId } = context;
    const { data, error } = await supabase
      .from("clients")
      .select("id, name, email, created_at")
      .eq("agency_id", agencyId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "Unable to load clients" }, { status: 500 });
    }

    return NextResponse.json({ clients: data ?? [] }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const context = await getAgencyContext();
    if ("error" in context) return context.error;

    const json = await req.json().catch(() => null);
    const parsed = createClientSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { supabase, agencyId } = context;
    const email =
      typeof parsed.data.email === "string" && parsed.data.email.length > 0
        ? parsed.data.email.toLowerCase()
        : null;

    const { data, error } = await supabase
      .from("clients")
      .insert({
        agency_id: agencyId,
        name: parsed.data.name,
        email,
      })
      .select("id, name, email, created_at")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Unable to create client" }, { status: 500 });
    }

    return NextResponse.json({ client: data }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
