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
    await admin.from("agencies").delete().eq("id", agencyId).catch(() => null);
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
    <main className="min-h-screen bg-neutral-950 text-neutral-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Finish setup</h1>
          <p className="text-sm text-neutral-400">
            Your account exists, but your agency profile wasn’t created yet. Add your
            agency name to continue.
          </p>
        </div>

        <form
          action={provisionAction}
          className="space-y-4 bg-neutral-900/60 border border-neutral-800 rounded-xl p-6 shadow-lg shadow-black/40"
        >
          <div className="space-y-2">
            <label
              htmlFor="agencyName"
              className="block text-sm font-medium text-neutral-200"
            >
              Agency name
            </label>
            <input
              id="agencyName"
              name="agencyName"
              type="text"
              autoComplete="organization"
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm placeholder-neutral-500 outline-none ring-0 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-500/40 transition"
              placeholder="Acme Marketing"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/60 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center rounded-lg bg-neutral-50 text-neutral-950 px-4 py-2.5 text-sm font-medium transition hover:bg-white/90"
          >
            Continue
          </button>
        </form>
      </div>
    </main>
  );
}

