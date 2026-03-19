import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient, getSupabaseServiceRoleClient } from "@/lib/supabase/server";

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function provisionAction(formData: FormData) {
  "use server";

  const agencyNameRaw = formData.get("agencyName");
  const agencyName = typeof agencyNameRaw === "string" ? agencyNameRaw.trim() : "";

  if (!agencyName) {
    redirect("/setup?error=Agency%20name%20is%20required");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // If already provisioned, just continue.
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) {
    redirect("/dashboard");
  }

  const admin = getSupabaseServiceRoleClient();

  // Create agency with a best-effort unique slug.
  const baseSlug = slugify(agencyName);
  const candidates = [baseSlug, `${baseSlug}-${Math.random().toString(16).slice(2, 6)}`];

  let agencyId: string | null = null;
  for (const slug of candidates) {
    const { data: agency, error } = await admin
      .from("agencies")
      .insert({ name: agencyName, slug })
      .select("id")
      .single();
    if (!error && agency) {
      agencyId = agency.id;
      break;
    }
  }

  if (!agencyId) {
    redirect("/setup?error=Unable%20to%20create%20agency");
  }

  const { error: userRowError } = await admin.from("users").insert({
    id: user.id,
    agency_id: agencyId,
    email: (user.email ?? "").toLowerCase(),
    role: "owner",
  });

  if (userRowError) {
    // rollback agency
    await admin.from("agencies").delete().eq("id", agencyId);
    redirect("/setup?error=Unable%20to%20create%20user%20profile");
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export default async function SetupPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) {
    redirect("/dashboard");
  }

  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? params.error : undefined;

  return (
    <main className="mac-page-center">
      <div className="mac-shell-sm space-y-6">
        <div className="space-y-2">
          <h1 className="mac-title">Finish setup</h1>
          <p className="mac-subtitle">
            Your account exists, but your agency profile wasn’t created yet. Add your
            agency name to continue.
          </p>
        </div>

        <form
          action={provisionAction}
          className="space-y-4 mac-card p-6"
        >
          <div className="space-y-2">
            <label
              htmlFor="agencyName"
              className="block text-sm font-medium"
            >
              Agency name
            </label>
            <input
              id="agencyName"
              name="agencyName"
              type="text"
              autoComplete="organization"
              className="mac-input"
              placeholder="Acme Marketing"
              required
            />
          </div>

          {error && (
            <p className="mac-alert mac-alert-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="mac-btn-primary w-full"
          >
            Continue
          </button>
        </form>
      </div>
    </main>
  );
}

