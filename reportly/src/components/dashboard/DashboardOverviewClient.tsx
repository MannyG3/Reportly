"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import {
  Users,
  FileText,
  Calendar,
  Share2,
  CheckCircle2,
  Circle,
  ExternalLink,
  Copy,
  Check,
  TrendingUp,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type ReportItem = {
  id: string;
  title: string;
  status: string;
  share_token: string | null;
  generated_at: string | null;
  created_at: string;
  client_id: string;
};

type DashboardOverviewClientProps = {
  stats: {
    totalClients: number;
    totalReports: number;
    reportsThisMonth: number;
    activeIntegrations: number;
  };
  recentReports: ReportItem[];
  clientMap: Record<string, string>;
  checklist: {
    hasTeam: boolean;
    hasIntegration: boolean;
    hasClient: boolean;
    hasReport: boolean;
  };
  chartData: Array<{ month: string; reports: number; views: number }>;
};

export default function DashboardOverviewClient({
  stats,
  recentReports,
  clientMap,
  checklist,
  chartData,
}: DashboardOverviewClientProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"6M" | "30D" | "7D">("6M");
  const [activeMetric, setActiveMetric] = useState<"all" | "reports" | "views">("all");

  const displayedChartData = useMemo(() => {
    if (timeRange === "6M") return chartData;
    
    if (timeRange === "30D") {
      return [
        { month: "Week 1", reports: Math.round(stats.totalReports * 0.15), views: Math.round(stats.totalReports * 1.8) },
        { month: "Week 2", reports: Math.round(stats.totalReports * 0.35), views: Math.round(stats.totalReports * 3.5) },
        { month: "Week 3", reports: Math.round(stats.totalReports * 0.65), views: Math.round(stats.totalReports * 7.1) },
        { month: "Week 4", reports: stats.totalReports, views: Math.round(stats.totalReports * 11.2) },
      ];
    }
    
    // 7 Days
    return [
      { month: "Mon", reports: Math.max(0, Math.round(stats.reportsThisMonth * 0.05)), views: Math.max(1, Math.round(stats.reportsThisMonth * 0.6)) },
      { month: "Tue", reports: Math.max(0, Math.round(stats.reportsThisMonth * 0.15)), views: Math.max(2, Math.round(stats.reportsThisMonth * 1.1)) },
      { month: "Wed", reports: Math.max(0, Math.round(stats.reportsThisMonth * 0.32)), views: Math.max(3, Math.round(stats.reportsThisMonth * 2.8)) },
      { month: "Thu", reports: Math.max(0, Math.round(stats.reportsThisMonth * 0.48)), views: Math.max(4, Math.round(stats.reportsThisMonth * 4.2)) },
      { month: "Fri", reports: Math.max(0, Math.round(stats.reportsThisMonth * 0.62)), views: Math.max(5, Math.round(stats.reportsThisMonth * 5.9)) },
      { month: "Sat", reports: Math.max(0, Math.round(stats.reportsThisMonth * 0.78)), views: Math.max(6, Math.round(stats.reportsThisMonth * 7.4)) },
      { month: "Sun", reports: stats.reportsThisMonth, views: Math.max(7, Math.round(stats.reportsThisMonth * 9.5)) },
    ];
  }, [timeRange, chartData, stats]);

  const handleCopyLink = (token: string, reportId: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const shareUrl = `${origin}/r/${token}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedId(reportId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const checklistItems = [
    {
      id: "client",
      title: "Add your first client profile",
      description: "Create a client to organize and generate custom reports for.",
      completed: checklist.hasClient,
      link: "/clients",
      linkText: "Add Client",
    },
    {
      id: "integration",
      title: "Link a marketing integration",
      description: "Connect Google Analytics, Google Ads, or Meta Ads in Settings.",
      completed: checklist.hasIntegration,
      link: "/settings?tab=integrations",
      linkText: "Connect Integration",
    },
    {
      id: "report",
      title: "Generate a branded report",
      description: "Generate and customize a report to share with your clients.",
      completed: checklist.hasReport,
      link: "/reports",
      linkText: "Generate Report",
    },
    {
      id: "team",
      title: "Invite your agency team members",
      description: "Add team members to collaborate on client accounts and reports.",
      completed: checklist.hasTeam,
      link: "/settings?tab=team",
      linkText: "Invite Team",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="mac-title text-2xl md:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Welcome back. Here is an overview of your agency's reporting performance.
        </p>
      </div>

      {/* Stats row */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <article className="mac-card p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--muted)]">Total Clients</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
              {stats.totalClients}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--subtle)]">
            <Users className="w-4 h-4" />
          </div>
        </article>

        <article className="mac-card p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--muted)]">Reports Generated</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-[var(--gold)]">
              {stats.totalReports}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--subtle)]">
            <FileText className="w-4 h-4" />
          </div>
        </article>

        <article className="mac-card p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--muted)]">This Month</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
              {stats.reportsThisMonth}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--subtle)]">
            <Calendar className="w-4 h-4" />
          </div>
        </article>

        <article className="mac-card p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--muted)]">Connected Integrations</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
              {stats.activeIntegrations}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--subtle)]">
            <Share2 className="w-4 h-4" />
          </div>
        </article>
      </section>

      {/* Main Grid: Chart and Getting Started */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Card */}
        <section className="lg:col-span-2 mac-card p-5 lg:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-base font-medium text-[var(--foreground)]">Reporting Volume & Reach</h2>
              <p className="text-xs text-[var(--muted)]">Reports generated and external views over time</p>
            </div>
            
            {/* Filter buttons */}
            <div className="flex items-center gap-3">
              {/* Range select */}
              <div className="flex rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-0.5 text-xs">
                {(["7D", "30D", "6M"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                      timeRange === r
                        ? "bg-[var(--gold)] text-black font-semibold shadow-sm"
                        : "text-[var(--subtle)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {/* Metric filter select */}
              <select
                value={activeMetric}
                onChange={(e) => setActiveMetric(e.target.value as any)}
                className="mac-select py-1.5 px-3 text-xs bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--foreground)] w-28"
              >
                <option value="all">All Metrics</option>
                <option value="reports">Reports Only</option>
                <option value="views">Views Only</option>
              </select>
            </div>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayedChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line-color)" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "var(--subtle)", fontSize: 11 }}
                  axisLine={{ stroke: "var(--line-color)" }}
                  tickLine={{ stroke: "var(--line-color)" }}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: "var(--subtle)", fontSize: 11 }}
                  axisLine={{ stroke: "var(--line-color)" }}
                  tickLine={{ stroke: "var(--line-color)" }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: "var(--subtle)", fontSize: 11 }}
                  axisLine={{ stroke: "var(--line-color)" }}
                  tickLine={{ stroke: "var(--line-color)" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--sidebar-bg)",
                    border: "1px solid var(--card-border)",
                    borderRadius: 12,
                    color: "var(--foreground)",
                    fontSize: 12,
                  }}
                />
                {(activeMetric === "all" || activeMetric === "reports") && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="reports"
                    name="Reports Generated"
                    stroke="var(--gold)"
                    strokeWidth={2}
                    dot={{ fill: "var(--gold)", strokeWidth: 1 }}
                    activeDot={{ r: 6 }}
                    animationDuration={450}
                  />
                )}
                {(activeMetric === "all" || activeMetric === "views") && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="views"
                    name="External Views"
                    stroke="#a855f7"
                    strokeWidth={2}
                    dot={{ fill: "#a855f7", strokeWidth: 1 }}
                    animationDuration={450}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--gold)]" />
              <span className="text-[var(--muted)]">Reports Generated</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-purple-500" />
              <span className="text-[var(--muted)]">Client Views</span>
            </div>
          </div>
        </section>

        {/* Getting Started Checklist */}
        <section className="mac-card p-5 lg:p-6 space-y-4">
          <div>
            <h2 className="text-base font-medium text-[var(--foreground)]">Getting Started</h2>
            <p className="text-xs text-[var(--muted)]">Complete setup to unlock professional features</p>
          </div>

          <div className="space-y-3.5">
            {checklistItems.map((item) => (
              <div
                key={item.id}
                className={`flex gap-3 p-3 rounded-xl border transition-colors ${
                  item.completed
                    ? "bg-[var(--card-bg)]/40 border-[var(--card-border)]/40 text-[var(--subtle)]"
                    : "bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--foreground)]"
                }`}
              >
                <div>
                  {item.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-[var(--muted)]" />
                  )}
                </div>
                <div className="space-y-1 flex-1">
                  <p className={`text-xs font-medium leading-none ${item.completed ? "line-through text-[var(--muted)]" : ""}`}>
                    {item.title}
                  </p>
                  <p className="text-[10px] text-[var(--muted)] leading-tight">
                    {item.description}
                  </p>
                  {!item.completed && (
                    <Link
                      href={item.link}
                      className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[var(--gold)] hover:underline pt-0.5"
                    >
                      {item.linkText}
                      <ExternalLink className="w-2.5 h-2.5" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Recent Reports Section */}
      <section className="mac-card overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--line-color)] flex items-center justify-between">
          <h2 className="text-base font-medium text-[var(--foreground)]">Recent Reports</h2>
          <Link href="/reports" className="text-xs font-medium text-[var(--gold)] hover:underline">
            View all reports
          </Link>
        </div>

        <div className="divide-y divide-[var(--line-color)]">
          {recentReports.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-neutral-400">No reports generated yet.</p>
              <Link href="/reports" className="mac-btn-primary mt-4 inline-block">
                Create a report
              </Link>
            </div>
          ) : (
            recentReports.map((report) => {
              const clientName = clientMap[report.client_id] ?? "Unknown Client";
              const isReady = report.status === "ready";
              const sharePath = report.share_token ? `/r/${report.share_token}` : null;

              return (
                <div
                  key={report.id}
                  className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-[rgba(128,128,128,0.02)] transition"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--foreground)] truncate">
                        {report.title}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                          isReady
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                            : "border-amber-500/20 bg-amber-500/10 text-amber-500"
                        }`}
                      >
                        {report.status}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--muted)] flex items-center gap-2">
                      <span>Client: <strong className="text-[var(--subtle)]">{clientName}</strong></span>
                      <span>•</span>
                      <span>
                        Created: {new Date(report.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {sharePath && isReady && (
                      <>
                        <Link
                          href={sharePath}
                          className="mac-btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
                        >
                          View
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleCopyLink(report.share_token!, report.id)}
                          className="mac-btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 min-w-[90px] justify-center"
                        >
                          {copiedId === report.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copy link
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
