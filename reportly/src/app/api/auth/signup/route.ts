import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  agencyName: z.string().min(1).max(120),
  email: z.string().email().max(320),
  password: z.string().min(8).max(200),
});

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { agencyName, email, password } = parsed.data;

    let supabaseAdmin: ReturnType<typeof getSupabaseServiceRoleClient>;
    try {
      supabaseAdmin = getSupabaseServiceRoleClient();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Missing server configuration";
      return NextResponse.json({ error: message }, { status: 500 });
    }

    // 1) Create auth user (and confirm immediately for local dev)
    const { data: created, error: createUserError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (createUserError || !created.user) {
      return NextResponse.json(
        { error: createUserError?.message ?? "Unable to create auth user" },
        { status: 400 }
      );
    }

    const userId = created.user.id;

    // 2) Create agency
    const slug = slugify(agencyName);

    const { data: agency, error: agencyError } = await supabaseAdmin
      .from("agencies")
      .insert({ name: agencyName, slug })
      .select("id")
      .single();

    if (agencyError || !agency) {
      // rollback auth user
      await supabaseAdmin.auth.admin.deleteUser(userId).catch(() => null);
      return NextResponse.json(
        { error: agencyError?.message ?? "Unable to create agency" },
        { status: 400 }
      );
    }

    // 3) Create user row linked to agency
    const { error: userRowError } = await supabaseAdmin.from("users").insert({
      id: userId,
      agency_id: agency.id,
      email: email.toLowerCase(),
      role: "owner",
    });

    if (userRowError) {
      // rollback agency + auth user
      await supabaseAdmin.from("agencies").delete().eq("id", agency.id);
      await supabaseAdmin.auth.admin.deleteUser(userId).catch(() => null);
      return NextResponse.json(
        { error: userRowError.message ?? "Unable to create user profile" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: true, userId, agencyId: agency.id },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

