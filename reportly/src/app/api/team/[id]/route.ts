import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient, getSupabaseServiceRoleClient } from "@/lib/supabase/server";

const patchMemberSchema = z.object({
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

  return { supabase, agencyId: dbUser.agency_id, userRole: dbUser.role, authedUserId: user.id };
}

type Params = {
  params: Promise<{ id: string }>;
};

// PATCH: Update member role
export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id: memberId } = await params;
    if (!memberId) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
    }

    const context = await getAgencyContext();
    if ("error" in context) return context.error;

    const { agencyId, userRole, authedUserId } = context;

    // Privilege check: only owner can edit roles
    if (userRole !== "owner") {
      return NextResponse.json(
        { error: "Only owners can change member roles" },
        { status: 403 }
      );
    }

    // Prevent changing own role
    if (memberId === authedUserId) {
      return NextResponse.json(
        { error: "You cannot change your own role" },
        { status: 400 }
      );
    }

    const json = await req.json().catch(() => null);
    const parsed = patchMemberSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const adminSupabase = getSupabaseServiceRoleClient();
    const { data: updated, error } = await adminSupabase
      .from("users")
      .update({ role: parsed.data.role })
      .eq("id", memberId)
      .eq("agency_id", agencyId)
      .select("id, email, role, created_at")
      .single();

    if (error || !updated) {
      console.error("Update member role error:", error);
      return NextResponse.json({ error: "Unable to update member role" }, { status: 404 });
    }

    return NextResponse.json({ member: updated }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

// DELETE: Remove member
export async function DELETE(req: Request, { params }: Params) {
  try {
    const { id: memberId } = await params;
    if (!memberId) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
    }

    const context = await getAgencyContext();
    if ("error" in context) return context.error;

    const { agencyId, userRole, authedUserId } = context;

    // Privilege check: only owner or admin can delete.
    if (userRole !== "owner" && userRole !== "admin") {
      return NextResponse.json(
        { error: "Only owners and admins can remove members" },
        { status: 403 }
      );
    }

    // Prevent deleting oneself
    if (memberId === authedUserId) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    const adminSupabase = getSupabaseServiceRoleClient();

    // Check if target is owner (admins cannot delete owners!)
    const { data: targetUser } = await adminSupabase
      .from("users")
      .select("role")
      .eq("id", memberId)
      .single();

    if (targetUser?.role === "owner" && userRole !== "owner") {
      return NextResponse.json(
        { error: "Only owners can remove other owners" },
        { status: 403 }
      );
    }

    const { error: deleteError } = await adminSupabase
      .from("users")
      .delete()
      .eq("id", memberId)
      .eq("agency_id", agencyId);

    if (deleteError) {
      console.error("Delete member error:", deleteError);
      return NextResponse.json({ error: "Unable to delete member" }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
