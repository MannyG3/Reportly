"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Filter, ArrowUpDown, ExternalLink, Copy, Check } from "lucide-react";
import DeleteReportButton from "./DeleteReportButton";

type ReportItem = {
  id: string;
  title: string;
  status: string;
  share_token: string | null;
  generated_at: string | null;
  created_at: string;
  client_id: string;
};

type ClientItem = {
  id: string;
  name: string;
};

type ReportsViewClientProps = {
  reports: ReportItem[];
  clients: ClientItem[];
  deleteAction: (formData: FormData) => void;
};

function StatusPill({ status }: { status: string }) {
  const styles =
    status === "ready"
      ? "border-emerald-900/60 bg-emerald-950/25 text-emerald-200"
      : status === "generating"
        ? "border-amber-900/60 bg-amber-950/25 text-amber-200"
        : status === "failed"
          ? "border-red-900/60 bg-red-950/25 text-red-200"
          : "border-neutral-800 bg-neutral-950 text-neutral-300";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        styles,
      ].join(" ")}
    >
      {status}
    </span>
  );
}

export default function ReportsViewClient({
  reports,
  clients,
  deleteAction,
}: ReportsViewClientProps) {
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c.name])), [clients]);

  // Handle Copy Share Link
  const handleCopy = (token: string, id: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    navigator.clipboard.writeText(`${origin}/r/${token}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter and sort reports
  const filteredReports = useMemo(() => {
    return reports
      .filter((r) => {
        const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase());
        const matchesClient = selectedClient === "all" || r.client_id === selectedClient;
        const matchesStatus = selectedStatus === "all" || r.status === selectedStatus;
        return matchesSearch && matchesClient && matchesStatus;
      })
      .sort((a, b) => {
        const timeA = +new Date(a.created_at);
        const timeB = +new Date(b.created_at);
        return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
      });
  }, [reports, search, selectedClient, selectedStatus, sortOrder]);

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reports by title..."
            className="mac-input pl-9 w-full"
          />
        </div>

        {/* Client dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="mac-select text-xs py-2 px-3 bg-neutral-900 border-neutral-800 text-neutral-300 w-44"
          >
            <option value="all">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status dropdown */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="mac-select text-xs py-2 px-3 bg-neutral-900 border-neutral-800 text-neutral-300 w-32"
        >
          <option value="all">All Statuses</option>
          <option value="ready">Ready</option>
          <option value="generating">Generating</option>
          <option value="failed">Failed</option>
        </select>

        {/* Sort Button */}
        <button
          onClick={() => setSortOrder((p) => (p === "desc" ? "asc" : "desc"))}
          className="mac-btn-secondary py-2 px-3 text-xs flex items-center gap-1.5 shrink-0"
          title="Toggle sort order"
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          <span>{sortOrder === "desc" ? "Newest First" : "Oldest First"}</span>
        </button>
      </div>

      {/* Reports Table container */}
      <div className="divide-y divide-white/10">
        {filteredReports.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-neutral-300">No matching reports found.</p>
            <p className="mt-1 text-xs text-neutral-500">
              Clear your search query or filters to view all reports.
            </p>
          </div>
        ) : (
          filteredReports.map((r) => {
            const clientName = clientMap.get(r.client_id) ?? "Unknown Client";
            const sharePath = r.share_token ? `/r/${r.share_token}` : null;
            return (
              <div
                key={r.id}
                className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-white/[0.01] transition"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium text-neutral-100 truncate">
                      {r.title}
                    </span>
                    <StatusPill status={r.status} />
                  </div>
                  <div className="text-xs text-neutral-500 flex items-center gap-2">
                    <span>Client: <strong className="text-neutral-400">{clientName}</strong></span>
                    <span>•</span>
                    <span>
                      {r.generated_at
                        ? `Generated ${new Date(r.generated_at).toLocaleDateString()}`
                        : `Created ${new Date(r.created_at).toLocaleDateString()}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {sharePath && r.status === "ready" && (
                    <>
                      <Link
                        href={sharePath}
                        className="mac-btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
                      >
                        Open View
                        <ExternalLink className="w-3 h-3" />
                      </Link>

                      <button
                        onClick={() => handleCopy(r.share_token!, r.id)}
                        className="mac-btn-secondary text-xs px-3 py-1.5 flex items-center gap-1 min-w-[85px] justify-center"
                      >
                        {copiedId === r.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copy Link
                          </>
                        )}
                      </button>
                    </>
                  )}
                  
                  <DeleteReportButton reportId={r.id} deleteAction={deleteAction} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
