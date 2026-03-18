import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getString(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

function pageUrlWithMessage(
  kind: "success" | "error",
  message: string
): string {
  const url = new URL("http://local/clients");
  url.searchParams.set(kind, message);
  return `${url.pathname}?${url.searchParams.toString()}`;
}

async function getAgencyIdForAuthedUser() {
  const supabase = createSupabaseServerClient();
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

  return { supabase, agencyId: dbUser.agency_id };
}

async function createClientAction(formData: FormData) {
  "use server";

  const name = getString(formData, "name").trim();
  const emailRaw = getString(formData, "email").trim();
  const email = emailRaw.length ? emailRaw.toLowerCase() : null;

  if (!name) {
    redirect(pageUrlWithMessage("error", "Client name is required."));
  }

  try {
    const { supabase, agencyId } = await getAgencyIdForAuthedUser();

    const { error } = await supabase.from("clients").insert({
      agency_id: agencyId,
      name,
      email,
    });

    if (error) {
      throw error;
    }

    revalidatePath("/clients");
    redirect(pageUrlWithMessage("success", "Client added."));
  } catch (err) {
    console.error(err);
    redirect(
      pageUrlWithMessage("error", "Unable to add client. Please try again.")
    );
  }
}

async function deleteClientAction(formData: FormData) {
  "use server";

  const clientId = getString(formData, "clientId").trim();
  if (!clientId) {
    redirect(pageUrlWithMessage("error", "Invalid client."));
  }

  try {
    const { supabase, agencyId } = await getAgencyIdForAuthedUser();

    const { error } = await supabase
      .from("clients")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", clientId)
      .eq("agency_id", agencyId);

    if (error) {
      throw error;
    }

    revalidatePath("/clients");
    redirect(pageUrlWithMessage("success", "Client deleted."));
  } catch (err) {
    console.error(err);
    redirect(
      pageUrlWithMessage("error", "Unable to delete client. Please try again.")
    );
  }
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const success =
    typeof params.success === "string" ? params.success : undefined;
  const error = typeof params.error === "string" ? params.error : undefined;

  const { supabase, agencyId } = await getAgencyIdForAuthedUser();

  const { data: clients, error: clientsError } = await supabase
    .from("clients")
    .select("id, name, email, created_at")
    .eq("agency_id", agencyId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (clientsError) {
    return (
      <div className="rounded-xl border border-red-900/60 bg-red-950/30 p-5">
        <h1 className="text-sm font-medium text-red-200">
          Unable to load clients
        </h1>
        <p className="mt-2 text-sm text-red-300/90">
          Please refresh the page. If the issue persists, check your Supabase RLS
          policies.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
            Clients
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Manage the clients you generate reports for.
          </p>
        </div>
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
        <div className="lg:col-span-1 rounded-xl border border-neutral-900 bg-neutral-950/60 p-5 shadow-lg shadow-black/30">
          <h2 className="text-sm font-medium text-neutral-200">Add client</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Add a client to start generating reports.
          </p>

          <form action={createClientAction} className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <label className="block text-xs text-neutral-400" htmlFor="name">
                Client name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Acme Co."
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm placeholder-neutral-500 outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-500/40 transition"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs text-neutral-400" htmlFor="email">
                Client email (optional)
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="client@acme.com"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm placeholder-neutral-500 outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-500/40 transition"
              />
            </div>
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center rounded-lg bg-neutral-50 text-neutral-950 px-4 py-2.5 text-sm font-medium hover:bg-white/90 transition"
            >
              Add client
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 rounded-xl border border-neutral-900 bg-neutral-950/60 shadow-lg shadow-black/30 overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-900 flex items-center justify-between">
            <h2 className="text-sm font-medium text-neutral-200">
              Your clients
            </h2>
            <div className="text-xs text-neutral-500">
              {(clients?.length ?? 0).toString()} total
            </div>
          </div>

          <div className="divide-y divide-neutral-900">
            {(clients ?? []).length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-neutral-300">No clients yet.</p>
                <p className="mt-1 text-sm text-neutral-500">
                  Add your first client to generate a report.
                </p>
              </div>
            ) : (
              (clients ?? []).map((client) => (
                <div
                  key={client.id}
                  className="px-5 py-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-neutral-100 truncate">
                      {client.name}
                    </div>
                    <div className="mt-0.5 text-xs text-neutral-500 truncate">
                      {client.email ?? "No email"}
                    </div>
                  </div>

                  <form action={deleteClientAction}>
                    <input type="hidden" name="clientId" value={client.id} />
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-medium text-neutral-200 hover:bg-neutral-900/70 transition"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

