"use client";

import { useEffect, useState } from "react";

type ClientLike = {
  id: string;
  name: string;
  email: string | null;
};

type EditClientModalProps = {
  open: boolean;
  client: ClientLike | null;
  onClose: () => void;
  onSave: (id: string, payload: { name: string; email: string | null }) => Promise<void>;
};

export default function EditClientModal({ open, client, onClose, onSave }: EditClientModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!client) return;
    setName(client.name);
    setEmail(client.email ?? "");
    setError(null);
  }, [client]);

  if (!open || !client) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError("Client name is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSave(client.id, {
        name: trimmedName,
        email: trimmedEmail.length ? trimmedEmail : null,
      });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to update client.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(0,0,0,0.55)] p-0 sm:items-center sm:p-4">
      <div className="w-full rounded-t-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(17,17,16,0.94)] p-5 backdrop-blur-xl sm:max-w-md sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-[var(--white)]">Edit Client</h2>
          <button type="button" onClick={onClose} className="mac-btn-secondary px-3 py-1.5 text-xs">
            Close
          </button>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1.5 block text-xs text-[var(--subtle)]">Name</label>
            <input
              className="mac-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Co"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-[var(--subtle)]">Email (optional)</label>
            <input
              className="mac-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@acme.com"
            />
          </div>

          {error ? <p className="text-xs text-red-300">{error}</p> : null}

          <button type="submit" disabled={loading} className="mac-btn-primary w-full">
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
