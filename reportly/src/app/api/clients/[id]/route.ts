import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const updateClientSchema = z.object({
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

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Client id is required" }, { status: 400 });
    }

    const context = await getAgencyContext();
    if ("error" in context) return context.error;

    const json = await req.json().catch(() => null);
    const parsed = updateClientSchema.safeParse(json);

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
      .update({ name: parsed.data.name, email })
      .eq("id", id)
      .eq("agency_id", agencyId)
      .is("deleted_at", null)
      .select("id, name, email, created_at")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Unable to update client" }, { status: 404 });
    }

    return NextResponse.json({ client: data }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Client id is required" }, { status: 400 });
    }

    const context = await getAgencyContext();
    if ("error" in context) return context.error;

    const { supabase, agencyId } = context;
    const { data, error } = await supabase
      .from("clients")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("agency_id", agencyId)
      .is("deleted_at", null)
      .select("id")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Unable to delete client" }, { status: 404 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
