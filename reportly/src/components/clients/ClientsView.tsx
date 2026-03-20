"use client";

import { useMemo, useState } from "react";
import AddClientModal from "@/components/clients/AddClientModal";
import EditClientModal from "@/components/clients/EditClientModal";

type ClientItem = {
  id: string;
  name: string;
  email: string | null;
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
  const [clients, setClients] = useState<ClientItem[]>(initialClients);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<ClientItem | null>(null);
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const hasClients = clients.length > 0;

  const sortedClients = useMemo(
    () => [...clients].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)),
    [clients]
  );

  const notify = (kind: Toast["kind"], message: string) => {
    setToast({ kind, message });
    setTimeout(() => setToast(null), 2600);
  };

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
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="mac-title">Clients</h1>
        <button type="button" className="mac-btn-primary" onClick={() => setShowAdd(true)}>
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
            <article key={client.id} className="mac-card relative p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-medium text-[var(--white)]">{client.name}</h3>
                  <p className="mt-1 truncate text-sm text-[var(--muted)]">{client.email ?? "No email"}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMenuOpenFor((prev) => (prev === client.id ? null : client.id))}
                  className="mac-btn-secondary px-2.5 py-1 text-xs"
                >
                  •••
                </button>
              </div>

              <p className="mt-5 text-xs text-[var(--subtle)]">Added {formatDate(client.created_at)}</p>

              {menuOpenFor === client.id ? (
                <div className="absolute right-4 top-14 z-20 w-32 overflow-hidden rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(14,14,13,0.98)] shadow-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(client);
                      setMenuOpenFor(null);
                    }}
                    className="block w-full px-3 py-2 text-left text-xs text-[var(--white)] hover:bg-[rgba(255,255,255,0.06)]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClient(client.id)}
                    className="block w-full px-3 py-2 text-left text-xs text-red-300 hover:bg-[rgba(255,255,255,0.06)]"
                  >
                    Delete
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </section>
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
