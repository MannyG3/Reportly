"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { ExternalLink, FileText, UserCheck } from "lucide-react";
import AddClientModal from "@/components/clients/AddClientModal";
import EditClientModal from "@/components/clients/EditClientModal";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

type ClientItem = {
  id: string;
  name: string;
  email: string | null;
  created_at: string;
};

type ClientReport = {
  id: string;
  title: string;
  status: string;
  share_token: string | null;
  created_at: string;
};

type Toast = {
  kind: "success" | "error";
  message: string;
};

type ClientsViewProps = {
  initialClients: ClientItem[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ClientsView({ initialClients }: ClientsViewProps) {
  const supabase = getBrowserSupabaseClient();
  const [clients, setClients] = useState<ClientItem[]>(initialClients);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<ClientItem | null>(null);
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  // Client detail drawer states
  const [selectedClient, setSelectedClient] = useState<ClientItem | null>(null);
  const [clientReports, setClientReports] = useState<ClientReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  const hasClients = clients.length > 0;

  const sortedClients = useMemo(
    () => [...clients].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)),
    [clients]
  );

  const notify = (kind: Toast["kind"], message: string) => {
    setToast({ kind, message });
    setTimeout(() => setToast(null), 2600);
  };

  // Fetch reports for selected client
  useEffect(() => {
    async function fetchClientReports() {
      if (!selectedClient) return;
      setLoadingReports(true);
      try {
        const { data, error } = await supabase
          .from("reports")
          .select("id, title, status, share_token, created_at, generated_at")
          .eq("client_id", selectedClient.id)
          .order("created_at", { ascending: false });
        if (error) throw error;
        setClientReports(data || []);
      } catch (err) {
        console.error("Fetch client reports error:", err);
      } finally {
        setLoadingReports(false);
      }
    }
    fetchClientReports();
  }, [selectedClient, supabase]);

  const handleAddClient = async (payload: { name: string; email: string | null }) => {
    const tempId = `temp-${crypto.randomUUID()}`;
    const optimistic: ClientItem = {
      id: tempId,
      name: payload.name,
      email: payload.email,
      created_at: new Date().toISOString(),
    };

    setClients((prev) => [optimistic, ...prev]);

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await res.json().catch(() => null)) as
        | { client?: ClientItem; error?: string }
        | null;

      if (!res.ok || !json?.client) {
        throw new Error(json?.error ?? "Failed to create client");
      }

      setClients((prev) => prev.map((c) => (c.id === tempId ? json.client! : c)));
      notify("success", "Client added.");
    } catch (err) {
      setClients((prev) => prev.filter((c) => c.id !== tempId));
      throw err;
    }
  };

  const handleEditClient = async (id: string, payload: { name: string; email: string | null }) => {
    const previous = clients;
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...payload } : c)));

    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => null)) as
        | { client?: ClientItem; error?: string }
        | null;

      if (!res.ok || !json?.client) {
        throw new Error(json?.error ?? "Failed to update client");
      }

      setClients((prev) => prev.map((c) => (c.id === id ? json.client! : c)));
      notify("success", "Client updated.");
    } catch (err) {
      setClients(previous);
      throw err;
    }
  };

  const handleDeleteClient = async (id: string) => {
    const previous = clients;
    setClients((prev) => prev.filter((c) => c.id !== id));
    setMenuOpenFor(null);

    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        throw new Error(json?.error ?? "Failed to delete client");
      }
      notify("success", "Client deleted.");
    } catch (err) {
      setClients(previous);
      notify("error", err instanceof Error ? err.message : "Delete failed.");
    }
  };

  return (
    <div className="space-y-6 relative min-h-[70vh]">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="mac-title">Clients</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Manage your agency&apos;s clients and their custom report properties.</p>
        </div>
        <button type="button" className="mac-btn-primary text-xs" onClick={() => setShowAdd(true)}>
          Add Client
        </button>
      </header>

      {!hasClients ? (
        <section className="mac-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.03)] text-3xl">
            👥
          </div>
          <h2 className="text-lg font-medium text-[var(--white)]">No clients yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
            Add your first client to start generating and sharing branded reports.
          </p>
          <button type="button" className="mac-btn-primary mt-5" onClick={() => setShowAdd(true)}>
            Add your first client
          </button>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedClients.map((client) => (
            <article
              key={client.id}
              onClick={() => setSelectedClient(client)}
              className="mac-card relative p-5 hover:border-white/20 transition duration-200 cursor-pointer flex flex-col justify-between min-h-[140px]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-medium text-[var(--white)]">{client.name}</h3>
                  <p className="mt-1 truncate text-xs text-[var(--muted)]">{client.email ?? "No email address"}</p>
                  
                  {/* Platform Indicator Badges */}
                  <div className="mt-2.5 flex items-center gap-1.5">
                    <span className="h-4 px-1.5 py-0.2 rounded-md bg-neutral-900 border border-neutral-800 text-[8px] font-medium text-blue-400 flex items-center gap-0.5">
                      GA4
                    </span>
                    <span className="h-4 px-1.5 py-0.2 rounded-md bg-neutral-900 border border-neutral-800 text-[8px] font-medium text-[var(--gold)] flex items-center gap-0.5">
                      Google Ads
                    </span>
                    <span className="h-4 px-1.5 py-0.2 rounded-md bg-neutral-900 border border-neutral-800 text-[8px] font-medium text-purple-400 flex items-center gap-0.5">
                      Meta Ads
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation(); // Avoid triggering selectedClient side drawer
                    setMenuOpenFor((prev) => (prev === client.id ? null : client.id));
                  }}
                  className="mac-btn-secondary px-2.5 py-1 text-xs"
                >
                  •••
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between text-[10px] text-[var(--subtle)]">
                <span>Added {formatDate(client.created_at)}</span>
                <span className="flex items-center gap-1 text-[var(--gold)]">
                  Details →
                </span>
              </div>

              {menuOpenFor === client.id ? (
                <div
                  onClick={(e) => e.stopPropagation()} // Stop propagation inside the menu
                  className="absolute right-4 top-14 z-20 w-32 overflow-hidden rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(14,14,13,0.98)] shadow-xl"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(client);
                      setMenuOpenFor(null);
                    }}
                    className="block w-full px-3 py-2 text-left text-xs text-[var(--white)] hover:bg-[rgba(255,255,255,0.06)]"
                  >
                    Edit Details
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this client?")) {
                        handleDeleteClient(client.id);
                      }
                    }}
                    className="block w-full px-3 py-2 text-left text-xs text-red-300 hover:bg-[rgba(255,255,255,0.06)]"
                  >
                    Delete Client
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </section>
      )}

      {/* Client Detail Side Drawer Overlay */}
      {selectedClient && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/45 backdrop-blur-xs transition duration-200"
            onClick={() => setSelectedClient(null)}
          />
          
          <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md border-l border-white/10 bg-neutral-950/95 p-6 shadow-2xl backdrop-blur-xl flex flex-col justify-between transition duration-300">
            <div className="space-y-6 overflow-y-auto pr-1">
              
              {/* Drawer Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-[var(--gold)]" />
                    {selectedClient.name}
                  </h2>
                  <p className="text-xs text-[var(--muted)] mt-1">{selectedClient.email || "No email registered"}</p>
                </div>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="text-neutral-500 hover:text-neutral-200 text-sm font-semibold p-1"
                >
                  ✕
                </button>
              </div>

              {/* Stats card */}
              <div className="grid grid-cols-2 gap-3">
                <div className="mac-card-subtle p-3 text-center">
                  <p className="text-[9px] text-[var(--muted)] uppercase tracking-wider font-semibold">Client ID</p>
                  <p className="text-[10px] font-mono text-neutral-300 mt-1 truncate select-all">{selectedClient.id}</p>
                </div>
                <div className="mac-card-subtle p-3 text-center">
                  <p className="text-[9px] text-[var(--muted)] uppercase tracking-wider font-semibold">Created On</p>
                  <p className="text-xs text-neutral-300 mt-1 font-medium">{formatDate(selectedClient.created_at)}</p>
                </div>
              </div>

              {/* Action shortcuts */}
               <div className="space-y-2 pt-2">
                 <Link
                   href={`/reports?clientId=${selectedClient.id}`}
                   className="mac-btn-primary w-full text-center py-2 text-xs"
                 >
                   Create Branded Report
                 </Link>
               </div>

               {/* Data Connections status toggles */}
               <div className="space-y-3 pt-2">
                 <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Active Channel Connections</h3>
                 <div className="space-y-2">
                   <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800 text-[11px]">
                     <span className="text-neutral-200">Google Analytics (GA4)</span>
                     <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                   </div>
                   <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800 text-[11px]">
                     <span className="text-neutral-200">Google Ads Performance</span>
                     <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                   </div>
                   <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800 text-[11px]">
                     <span className="text-neutral-200">Meta Ads Manager</span>
                     <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                   </div>
                 </div>
                 <p className="text-[9px] text-neutral-500">
                   Data channels are active at the agency level. All connections are synced for this client.
                 </p>
               </div>

              {/* Client specific reports listing */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-neutral-400" />
                  Client Reports History
                </h3>
                
                {loadingReports ? (
                  <p className="text-xs text-neutral-500 py-4 text-center">Loading client reports...</p>
                ) : clientReports.length === 0 ? (
                  <div className="text-center py-6 border border-white/5 bg-neutral-900/35 rounded-xl">
                    <p className="text-xs text-neutral-500">No reports generated for this client.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {clientReports.map((report) => {
                      const isReady = report.status === "ready";
                      const sharePath = report.share_token ? `/r/${report.share_token}` : null;
                      return (
                        <div
                          key={report.id}
                          className="mac-card-subtle p-3 flex items-center justify-between gap-3 hover:bg-white/[0.01]"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-neutral-200 truncate">{report.title}</p>
                            <p className="text-[9px] text-neutral-500 mt-0.5">
                              Status: {report.status} • {new Date(report.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          {sharePath && isReady ? (
                            <Link
                              href={sharePath}
                              className="text-[10px] font-semibold text-[var(--gold)] hover:underline flex items-center gap-0.5 shrink-0"
                            >
                              View Report
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          ) : (
                            <span className="text-[9px] text-neutral-500 shrink-0">—</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-white/5 flex gap-2">
              <button
                onClick={() => {
                  setEditing(selectedClient);
                  setSelectedClient(null);
                }}
                className="mac-btn-secondary text-xs flex-1"
              >
                Edit Client
              </button>
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to delete this client?")) {
                    handleDeleteClient(selectedClient.id);
                    setSelectedClient(null);
                  }
                }}
                className="px-3 py-2 border border-red-950/40 bg-red-950/20 text-red-400 text-xs font-semibold rounded-lg hover:bg-red-950/40 hover:border-red-900/60 transition flex-1 text-center"
              >
                Delete Client
              </button>
            </div>
          </div>
        </>
      )}

      {toast ? (
        <div
          className={`fixed right-4 top-20 z-50 rounded-lg border px-3 py-2 text-xs ${
            toast.kind === "success"
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
              : "border-red-400/30 bg-red-400/10 text-red-200"
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      <AddClientModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onCreate={handleAddClient}
      />

      <EditClientModal
        open={Boolean(editing)}
        client={editing}
        onClose={() => setEditing(null)}
        onSave={handleEditClient}
      />
    </div>
  );
}
