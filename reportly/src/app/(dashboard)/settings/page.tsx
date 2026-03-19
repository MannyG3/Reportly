import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getString(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

function pageUrlWithMessage(kind: "success" | "error", message: string): string {
  const url = new URL("http://local/settings");
  url.searchParams.set(kind, message);
  return `${url.pathname}?${url.searchParams.toString()}`;
}

async function getAgencyForAuthedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: dbUser, error: dbUserError } = await supabase
    .from("users")
    .select("agency_id")
    .eq("id", user.id)
    .single();

  if (dbUserError || !dbUser) {
    redirect("/login");
  }

  const { data: agency, error: agencyError } = await supabase
    .from("agencies")
    .select("id, name, slug, logo_url, brand_color, custom_domain")
    .eq("id", dbUser.agency_id)
    .single();

  if (agencyError || !agency) {
    redirect("/login");
  }

  return { supabase, agency };
}

function normalizeHexColor(input: string) {
  const v = input.trim();
  if (!v) return null;
  const withHash = v.startsWith("#") ? v : `#${v}`;
  const isValid = /^#[0-9a-fA-F]{6}$/.test(withHash);
  return isValid ? withHash.toLowerCase() : null;
}

async function updateAgencyAction(formData: FormData) {
  "use server";

  const name = getString(formData, "name").trim();
  const logoUrlRaw = getString(formData, "logo_url").trim();
  const brandColorRaw = getString(formData, "brand_color").trim();
  const customDomainRaw = getString(formData, "custom_domain").trim();

  if (!name) {
    redirect(pageUrlWithMessage("error", "Agency name is required."));
  }

  const logo_url = logoUrlRaw.length ? logoUrlRaw : null;
  const brand_color =
    brandColorRaw.length === 0 ? null : normalizeHexColor(brandColorRaw);
  if (brandColorRaw.length && !brand_color) {
    redirect(
      pageUrlWithMessage("error", "Brand color must be a 6-digit hex (e.g. #6366f1).")
    );
  }

  const custom_domain = customDomainRaw.length ? customDomainRaw : null;

  try {
    const { supabase, agency } = await getAgencyForAuthedUser();

    const { error } = await supabase
      .from("agencies")
      .update({
        name,
        logo_url,
        brand_color,
        custom_domain,
      })
      .eq("id", agency.id);

    if (error) throw error;

    revalidatePath("/settings");
    redirect(pageUrlWithMessage("success", "Settings updated."));
  } catch (err) {
    console.error(err);
    redirect(
      pageUrlWithMessage("error", "Unable to update settings. Please try again.")
    );
  }
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const success = typeof params.success === "string" ? params.success : undefined;
  const error = typeof params.error === "string" ? params.error : undefined;

  const { agency } = await getAgencyForAuthedUser();

  const currentBrandColor = agency.brand_color?.trim() || "#6366f1";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Manage your agency branding and domain settings.
        </p>
      </div>

      {(success || error) && (
        <div
          className={[
            "rounded-xl border px-4 py-3 text-sm",
            success
              ? "border-emerald-900/60 bg-emerald-950/25 text-emerald-200"
              : "border-red-900/60 bg-red-950/25 text-red-200",
          ].join(" ")}
        >
          {success ?? error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-neutral-900 bg-neutral-950/60 p-5 shadow-lg shadow-black/30">
          <h2 className="text-sm font-medium text-neutral-200">Agency</h2>
          <p className="mt-1 text-sm text-neutral-400">
            These settings appear on public reports and shared links.
          </p>

          <form action={updateAgencyAction} className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs text-neutral-400" htmlFor="name">
                Agency name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                defaultValue={agency.name}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm placeholder-neutral-500 outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-500/40 transition"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs text-neutral-400" htmlFor="logo_url">
                Logo URL (optional)
              </label>
              <input
                id="logo_url"
                name="logo_url"
                type="url"
                defaultValue={agency.logo_url ?? ""}
                placeholder="https://youragency.com/logo.png"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm placeholder-neutral-500 outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-500/40 transition"
              />
              <p className="text-xs text-neutral-500">
                Use a square image for best results (e.g. 256×256).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs text-neutral-400" htmlFor="brand_color">
                  Brand color (hex, optional)
                </label>
                <input
                  id="brand_color"
                  name="brand_color"
                  type="text"
                  defaultValue={agency.brand_color ?? ""}
                  placeholder="#6366f1"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm placeholder-neutral-500 outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-500/40 transition"
                />
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-lg border border-neutral-800"
                  style={{ backgroundColor: currentBrandColor }}
                  aria-label="Current brand color preview"
                />
                <div className="text-xs text-neutral-500">
                  Preview
                  <div className="text-neutral-300 font-medium">{currentBrandColor}</div>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                className="block text-xs text-neutral-400"
                htmlFor="custom_domain"
              >
                Custom domain (optional)
              </label>
              <input
                id="custom_domain"
                name="custom_domain"
                type="text"
                defaultValue={agency.custom_domain ?? ""}
                placeholder="reports.youragency.com"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm placeholder-neutral-500 outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-500/40 transition"
              />
              <p className="text-xs text-neutral-500">
                You’ll connect DNS later. For now we store the domain.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between gap-4">
              <div className="text-xs text-neutral-500">
                Slug: <span className="text-neutral-300">{agency.slug}</span>
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-lg bg-neutral-50 text-neutral-950 px-4 py-2.5 text-sm font-medium hover:bg-white/90 transition"
              >
                Save changes
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-1 rounded-xl border border-neutral-900 bg-neutral-950/60 p-5 shadow-lg shadow-black/30">
          <h2 className="text-sm font-medium text-neutral-200">Public sharing</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Reports are shareable via a secure tokenized link.
          </p>

          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-4">
              <div className="text-xs text-neutral-400">Branding shown</div>
              <div className="mt-2 text-sm text-neutral-200">
                Agency name, logo, and brand color
              </div>
            </div>
            <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-4">
              <div className="text-xs text-neutral-400">Access</div>
              <div className="mt-2 text-sm text-neutral-200">
                Anyone with the link can view (RLS controls what’s exposed)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

