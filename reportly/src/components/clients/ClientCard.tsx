"use client";

import { useState } from "react";
import type { Client } from "@/components/clients/ClientsView";

type ClientCardProps = {
  client: Client;
  onEdit: (client: Client) => void;
  onDelete: (clientId: string) => void;
};

export default function ClientCard({
  client,
  onEdit,
  onDelete,
}: ClientCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete "${client.name}"?`)) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onDelete(client.id);
      } else {
        alert("Failed to delete client");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete client");
    } finally {
      setIsDeleting(false);
    }
  };

  const dateAdded = new Date(client.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <article className="mac-card p-4 lg:p-5 spring-hover">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-[var(--white)]">{client.name}</h3>
          <p className="mt-1 truncate text-xs text-[var(--muted)]">
            {client.email || "No email"}
          </p>
        </div>
        <div className="group relative">
          <button
            type="button"
            className="mac-hover-target rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[rgba(255,255,255,0.08)] hover:text-[var(--white)]"
            aria-label="Actions"
          >
            ⋮
          </button>
          <div className="invisible absolute right-0 top-full z-10 mt-1 w-32 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(10,10,10,0.95)] shadow-lg backdrop-blur-2xl group-hover:visible">
            <button
              type="button"
              onClick={() => onEdit(client)}
              className="block w-full px-3 py-2 text-left text-xs text-[var(--subtle)] transition-colors hover:bg-[rgba(255,255,255,0.08)] hover:text-[var(--white)]"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="block w-full px-3 py-2 text-left text-xs text-red-400 transition-colors hover:bg-[rgba(255,0,0,0.1)] hover:text-red-300 disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
      <p className="text-[11px] text-[var(--muted)]">Added {dateAdded}</p>
    </article>
  );
}
