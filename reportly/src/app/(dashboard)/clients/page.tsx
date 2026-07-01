import ClientsView from "@/components/clients/ClientsView";
import { getAgencyIdForAuthedUser } from "@/lib/auth";

export default async function ClientsPage() {
  const { supabase, agencyId } = await getAgencyIdForAuthedUser();

  const { data: clients, error: clientsError } = await supabase
    .from("clients")
    .select("id, name, email, created_at")
    .eq("agency_id", agencyId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (clientsError) {
    return (
      <div className="mac-page mac-alert mac-alert-error">
        <h1 className="text-sm font-medium text-red-200">Unable to load clients</h1>
        <p className="mt-2 text-sm text-red-300/90">
          Please refresh the page. If the issue persists, check your Supabase RLS
          policies.
        </p>
      </div>
    );
  }

  return <ClientsView initialClients={clients ?? []} />;
}
