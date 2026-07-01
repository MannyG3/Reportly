"use client";

import { useState } from "react";
import {
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { z } from "zod";
import {
  Printer,
  Copy,
  Check,
  CheckCircle,
  MessageSquare,
  Globe,
  TrendingUp,
  Zap,
  Facebook,
  FileText,
} from "lucide-react";

export type PublicReportAgency = {
  name: string;
  logoUrl: string | null;
  brandColor: string;
};

export type PublicReportClient = {
  name: string;
};

export type PublicReportSection = {
  id: string;
  section_type: string;
  sort_order: number;
  data_snapshot: unknown;
};

export type PublicReportProps = {
  agency: PublicReportAgency;
  client: PublicReportClient;
  reportTitle: string;
  generatedAt: string | null;
  sections: PublicReportSection[];
};

// Zod schemas for validation
const kpisSchema = z.object({
  period: z.string().optional(),
  kpis: z.array(
    z.object({
      label: z.string(),
      value: z.number(),
      delta: z.number().optional(),
      format: z.string().optional(),
    })
  ),
});

const trafficSchema = z.object({
  series: z.array(
    z.object({
      date: z.string(),
      sessions: z.number(),
      users: z.number(),
    })
  ),
});

const channelSchema = z.object({
  channels: z.array(
    z.object({
      name: z.string(),
      value: z.number(),
    })
  ),
});

const commentarySchema = z.object({
  text: z.string(),
});

const gaSectionSchema = z.object({
  period: z.string().optional(),
  kpis: z.array(
    z.object({
      label: z.string(),
      value: z.number(),
      delta: z.number().optional(),
      format: z.string().optional(),
    })
  ),
  series: z.array(
    z.object({
      date: z.string(),
      sessions: z.number(),
      users: z.number(),
      pageviews: z.number().optional(),
    })
  ),
  channels: z.array(
    z.object({
      name: z.string(),
      value: z.number(),
    })
  ).optional(),
});

const adsSectionSchema = z.object({
  period: z.string().optional(),
  kpis: z.array(
    z.object({
      label: z.string(),
      value: z.number(),
      delta: z.number().optional(),
      format: z.string().optional(),
    })
  ),
  campaigns: z.array(
    z.object({
      name: z.string(),
      spend: z.number(),
      clicks: z.number(),
      impressions: z.number(),
      ctr: z.number(),
      conversions: z.number(),
    })
  ),
});

// Format delta helper
function formatDelta(delta?: number) {
  if (delta === undefined) return null;
  const pct = Math.round(delta * 1000) / 10;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct}%`;
}

// Formatting value helper
function formatValue(value: number, format?: string) {
  if (format === "currency") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  }
  if (format === "percentage") {
    return `${(value * 100).toFixed(1)}%`;
  }
  return value.toLocaleString();
}

function Card({
  title,
  subtitle,
  children,
  badge,
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  badge?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <section className="mac-card overflow-hidden print:border print:shadow-none print:bg-transparent">
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between print:border-b-neutral-300">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-[var(--brand)]" />}
          <div>
            <h2 className="text-sm font-medium text-[var(--white)] print:text-black">{title}</h2>
            {subtitle && <p className="text-[10px] text-[var(--muted)] print:text-neutral-500">{subtitle}</p>}
          </div>
        </div>
        {badge}
      </div>
      <div className="p-5 print:p-4">{children}</div>
    </section>
  );
}

export function PublicReportClientView(props: PublicReportProps) {
  const { agency, client, reportTitle, generatedAt, sections } = props;

  const [copied, setCopied] = useState(false);
  const [approved, setApproved] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackList, setFeedbackList] = useState<string[]>([]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleApprove = () => {
    setApproved(true);
  };

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback.trim()) {
      setFeedbackList((prev) => [...prev, feedback.trim()]);
      setFeedback("");
      setShowFeedbackModal(false);
      alert("Feedback received! Thank you.");
    }
  };

  return (
    <main
      className="min-h-screen text-[var(--white)] print:text-black print:bg-white"
      style={{ ["--brand" as never]: agency.brandColor }}
    >
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        
        {/* Floating actions bar (Hidden in print mode) */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 mac-card rounded-2xl print:hidden">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[var(--brand)] animate-pulse" />
            <span className="text-xs text-[var(--muted)]">Agency Brand: {agency.name}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="mac-btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 min-w-[100px] justify-center"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Link Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy Share
                </>
              )}
            </button>

            <button
              onClick={() => window.print()}
              className="mac-btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / PDF
            </button>

            <button
              onClick={() => setShowFeedbackModal(true)}
              className="mac-btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Feedback
            </button>

            <button
              onClick={handleApprove}
              disabled={approved}
              className={`text-xs px-4 py-1.5 font-medium rounded-lg transition duration-200 flex items-center gap-1.5 ${
                approved
                  ? "bg-emerald-950/40 border border-emerald-900/60 text-emerald-400 cursor-default"
                  : "bg-neutral-50 text-neutral-950 hover:bg-white/90"
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              {approved ? "Approved" : "Approve Report"}
            </button>
          </div>
        </div>

        {/* Report Header */}
        <header className="flex items-start justify-between gap-6 pb-4 border-b border-white/10 print:border-b-neutral-300 print:text-black">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              {agency.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={agency.logoUrl}
                  alt={`${agency.name} logo`}
                  className="h-10 w-10 rounded-xl object-cover border border-neutral-800 print:border-neutral-300"
                />
              ) : (
                <div className="h-10 w-10 rounded-xl border border-white/15 bg-white/90 flex items-center justify-center font-bold text-neutral-900 text-sm">
                  {agency.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-[10px] text-[var(--muted)] print:text-neutral-500 uppercase tracking-widest">{agency.name}</div>
                <h1 className="mac-title text-xl md:text-2xl truncate print:text-black font-semibold">
                  {reportTitle}
                </h1>
              </div>
            </div>
            
            <p className="mt-3 text-xs text-[var(--muted)] print:text-neutral-500">
              Prepared for: <span className="text-[var(--white)] print:text-black font-medium">{client.name}</span>
              {generatedAt ? (
                <>
                  {" "}
                  • Generated on:{" "}
                  <span className="text-[var(--white)] print:text-black font-medium">
                    {new Date(generatedAt).toLocaleDateString()}
                  </span>
                </>
              ) : null}
            </p>
          </div>

          <div className="flex flex-col items-end text-right">
            {approved && (
              <span className="px-2.5 py-1 rounded-full bg-emerald-950/45 border border-emerald-900/60 text-[10px] font-medium text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Approved by Client
              </span>
            )}
          </div>
        </header>

        {/* Sections Output */}
        <div className="grid grid-cols-1 gap-6">
          {sections
            .slice()
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((section) => {
              
              // 1. Commentary (Executive Summary)
              if (section.section_type === "commentary") {
                const parsed = commentarySchema.safeParse(section.data_snapshot);
                if (!parsed.success) return null;
                const { text } = parsed.data;

                return (
                  <section
                    key={section.id}
                    className="mac-card p-5 border-l-4 border-l-[var(--brand)] print:border-l-neutral-400 print:bg-neutral-50"
                  >
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] print:text-neutral-500 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[var(--brand)]" />
                      Executive Commentary
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-neutral-200 print:text-neutral-800 whitespace-pre-wrap">
                      {text}
                    </p>
                  </section>
                );
              }

              // 2. Google Analytics 4 (GA4)
              if (section.section_type === "google_analytics") {
                const parsed = gaSectionSchema.safeParse(section.data_snapshot);
                if (!parsed.success) return null;
                const { kpis, series, channels } = parsed.data;

                return (
                  <Card
                    key={section.id}
                    title="Website Performance (GA4)"
                    subtitle="Traffic channels and web behavior analytics"
                    icon={Globe}
                  >
                    {/* KPIs grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {kpis.map((kpi) => {
                        const isUp = (kpi.delta ?? 0) > 0;
                        return (
                          <div key={kpi.label} className="mac-card-subtle p-4 print:border">
                            <p className="text-[10px] text-[var(--muted)] print:text-neutral-500 uppercase tracking-wider">{kpi.label}</p>
                            <p className="mt-1 text-lg font-semibold print:text-black">
                              {formatValue(kpi.value, kpi.format)}
                            </p>
                            {kpi.delta !== undefined && (
                              <p className={`text-[10px] mt-1 ${isUp ? "text-emerald-400" : "text-red-400"}`}>
                                {formatDelta(kpi.delta)} vs last month
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Chart & Channel Mix */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Trend line */}
                      <div className="md:col-span-2 space-y-2">
                        <p className="text-xs font-medium text-neutral-300 print:text-neutral-700">Traffic Trend</p>
                        <div className="h-56 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={series}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                              <XAxis dataKey="date" tick={{ fill: "#a3a3a3", fontSize: 10 }} />
                              <YAxis tick={{ fill: "#a3a3a3", fontSize: 10 }} />
                              <Tooltip contentStyle={{ background: "rgba(10,10,10,0.95)", border: "1px solid #262626", color: "#fafafa" }} />
                              <Line type="monotone" dataKey="sessions" stroke="var(--brand)" strokeWidth={2} dot={false} />
                              <Line type="monotone" dataKey="users" stroke="#60a5fa" strokeWidth={2} dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Pie chart */}
                      {channels && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-neutral-300 print:text-neutral-700">Channel Mix</p>
                          <div className="h-44 w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={channels.map((c, idx) => ({
                                    ...c,
                                    fill: ["var(--brand)", "#60a5fa", "#34d399", "#fbbf24", "#f472b6"][idx % 5],
                                  }))}
                                  dataKey="value"
                                  nameKey="name"
                                  innerRadius={35}
                                  outerRadius={55}
                                  stroke="#0a0a0a"
                                  strokeWidth={1}
                                />
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="space-y-1.5">
                            {channels.slice(0, 4).map((c, idx) => (
                              <div key={c.name} className="flex items-center justify-between text-[10px]">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="h-2 w-2 rounded-full"
                                    style={{
                                      background: ["var(--brand)", "#60a5fa", "#34d399", "#fbbf24", "#f472b6"][idx % 5],
                                    }}
                                  />
                                  <span className="text-neutral-400 print:text-neutral-600 truncate max-w-[80px]">{c.name}</span>
                                </div>
                                <span className="font-semibold">{c.value}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              }

              // 3. Google Ads
              if (section.section_type === "google_ads") {
                const parsed = adsSectionSchema.safeParse(section.data_snapshot);
                if (!parsed.success) return null;
                const { kpis, campaigns } = parsed.data;

                return (
                  <Card
                    key={section.id}
                    title="Google Ads Performance"
                    subtitle="Ad campaign expenditures, clicks, and conversion analytics"
                    icon={Zap}
                  >
                    {/* KPIs grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                      {kpis.map((kpi) => {
                        const isUp = (kpi.delta ?? 0) > 0;
                        const goodNews = kpi.label === "Spend" ? !isUp : isUp; // Spend up is generally not 'good' news
                        return (
                          <div key={kpi.label} className="mac-card-subtle p-3.5 print:border">
                            <p className="text-[10px] text-[var(--muted)] print:text-neutral-500 uppercase tracking-wider">{kpi.label}</p>
                            <p className="mt-1 text-base font-semibold print:text-black">
                              {formatValue(kpi.value, kpi.format)}
                            </p>
                            {kpi.delta !== undefined && (
                              <p className={`text-[9px] mt-1 ${goodNews ? "text-emerald-400" : "text-red-400"}`}>
                                {formatDelta(kpi.delta)} vs last month
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Campaigns Table */}
                    <div className="mt-5 overflow-x-auto rounded-xl border border-white/5 print:border-neutral-200">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-white/[0.02] text-neutral-400 border-b border-white/10 print:border-b-neutral-200 print:text-neutral-600">
                            <th className="px-4 py-2.5 font-medium">Campaign Name</th>
                            <th className="px-4 py-2.5 font-medium text-right">Spend</th>
                            <th className="px-4 py-2.5 font-medium text-right">Clicks</th>
                            <th className="px-4 py-2.5 font-medium text-right">Impressions</th>
                            <th className="px-4 py-2.5 font-medium text-right">CTR</th>
                            <th className="px-4 py-2.5 font-medium text-right">Conversions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 print:divide-neutral-200 print:text-neutral-800">
                          {campaigns.map((camp) => (
                            <tr key={camp.name} className="hover:bg-white/[0.01]">
                              <td className="px-4 py-2.5 font-medium text-neutral-200 print:text-black truncate max-w-[180px]">{camp.name}</td>
                              <td className="px-4 py-2.5 text-right">{formatValue(camp.spend, "currency")}</td>
                              <td className="px-4 py-2.5 text-right">{camp.clicks.toLocaleString()}</td>
                              <td className="px-4 py-2.5 text-right">{camp.impressions.toLocaleString()}</td>
                              <td className="px-4 py-2.5 text-right">{(camp.ctr * 100).toFixed(1)}%</td>
                              <td className="px-4 py-2.5 text-right font-medium text-emerald-400 print:text-emerald-700">{camp.conversions}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                );
              }

              // 4. Meta Ads
              if (section.section_type === "meta_ads") {
                const parsed = adsSectionSchema.safeParse(section.data_snapshot);
                if (!parsed.success) return null;
                const { kpis, campaigns } = parsed.data;

                return (
                  <Card
                    key={section.id}
                    title="Meta Ads Performance"
                    subtitle="Facebook & Instagram campaign performance"
                    icon={Facebook}
                  >
                    {/* KPIs grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                      {kpis.map((kpi) => {
                        const isUp = (kpi.delta ?? 0) > 0;
                        const goodNews = kpi.label === "Spend" ? !isUp : isUp;
                        return (
                          <div key={kpi.label} className="mac-card-subtle p-3.5 print:border">
                            <p className="text-[10px] text-[var(--muted)] print:text-neutral-500 uppercase tracking-wider">{kpi.label}</p>
                            <p className="mt-1 text-base font-semibold print:text-black">
                              {formatValue(kpi.value, kpi.format)}
                            </p>
                            {kpi.delta !== undefined && (
                              <p className={`text-[9px] mt-1 ${goodNews ? "text-emerald-400" : "text-red-400"}`}>
                                {formatDelta(kpi.delta)} vs last month
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Campaigns Table */}
                    <div className="mt-5 overflow-x-auto rounded-xl border border-white/5 print:border-neutral-200">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-white/[0.02] text-neutral-400 border-b border-white/10 print:border-b-neutral-200 print:text-neutral-600">
                            <th className="px-4 py-2.5 font-medium">Campaign Name</th>
                            <th className="px-4 py-2.5 font-medium text-right">Spend</th>
                            <th className="px-4 py-2.5 font-medium text-right">Clicks</th>
                            <th className="px-4 py-2.5 font-medium text-right">Impressions</th>
                            <th className="px-4 py-2.5 font-medium text-right">CTR</th>
                            <th className="px-4 py-2.5 font-medium text-right">Conversions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 print:divide-neutral-200 print:text-neutral-800">
                          {campaigns.map((camp) => (
                            <tr key={camp.name} className="hover:bg-white/[0.01]">
                              <td className="px-4 py-2.5 font-medium text-neutral-200 print:text-black truncate max-w-[180px]">{camp.name}</td>
                              <td className="px-4 py-2.5 text-right">{formatValue(camp.spend, "currency")}</td>
                              <td className="px-4 py-2.5 text-right">{camp.clicks.toLocaleString()}</td>
                              <td className="px-4 py-2.5 text-right">{camp.impressions.toLocaleString()}</td>
                              <td className="px-4 py-2.5 text-right">{(camp.ctr * 100).toFixed(1)}%</td>
                              <td className="px-4 py-2.5 text-right font-medium text-emerald-400 print:text-emerald-700">{camp.conversions}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                );
              }

              // Legacy KPI Card Support
              if (section.section_type === "kpis") {
                const parsed = kpisSchema.safeParse(section.data_snapshot);
                if (!parsed.success) return null;
                const { kpis } = parsed.data;
                return (
                  <Card key={section.id} title="Key metrics">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {kpis.map((kpi) => {
                        const deltaText = formatDelta(kpi.delta);
                        const isUp = (kpi.delta ?? 0) > 0;
                        return (
                          <div key={kpi.label} className="mac-card-subtle p-4 print:border">
                            <div className="text-[10px] text-[var(--muted)] print:text-neutral-500 uppercase tracking-wider">{kpi.label}</div>
                            <div className="mt-2 text-lg font-semibold tracking-tight print:text-black">
                              {formatValue(kpi.value, kpi.format)}
                            </div>
                            {deltaText ? (
                              <div className={["mt-1 text-[10px]", isUp ? "text-emerald-300" : "text-red-300"].join(" ")}>
                                {deltaText} vs previous period
                              </div>
                            ) : (
                              <div className="mt-1 text-xs text-[var(--muted)]">—</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                );
              }

              // Legacy Traffic over time
              if (section.section_type === "traffic_over_time") {
                const parsed = trafficSchema.safeParse(section.data_snapshot);
                if (!parsed.success) return null;
                const { series } = parsed.data;
                return (
                  <Card key={section.id} title="Traffic over time">
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={series}>
                          <XAxis dataKey="date" tick={{ fill: "#a3a3a3", fontSize: 10 }} />
                          <YAxis tick={{ fill: "#a3a3a3", fontSize: 10 }} />
                          <Tooltip contentStyle={{ background: "rgba(10,10,10,0.95)", border: "1px solid #262626", color: "#fafafa" }} />
                          <Line type="monotone" dataKey="sessions" stroke="var(--brand)" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="users" stroke="#60a5fa" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                );
              }

              // Legacy Channel Mix
              if (section.section_type === "channel_mix") {
                const parsed = channelSchema.safeParse(section.data_snapshot);
                if (!parsed.success) return null;
                const { channels } = parsed.data;
                return (
                  <Card key={section.id} title="Channel mix">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      <div className="h-56 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={channels.map((c, idx) => ({
                                ...c,
                                fill: ["var(--brand)", "#60a5fa", "#34d399", "#fbbf24", "#f472b6"][idx % 5],
                              }))}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={45}
                              outerRadius={65}
                              stroke="#0a0a0a"
                              strokeWidth={1}
                            />
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-2">
                        {channels.map((c, idx) => (
                          <div key={c.name} className="flex items-center justify-between text-xs mac-card-subtle px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ background: ["var(--brand)", "#60a5fa", "#34d399", "#fbbf24", "#f472b6"][idx % 5] }}
                              />
                              <span className="text-[var(--white)] print:text-black">{c.name}</span>
                            </div>
                            <span className="font-medium">{c.value}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                );
              }

              return null;
            })}
        </div>

        {/* Feedback List Panel if any */}
        {feedbackList.length > 0 && (
          <section className="mac-card p-5 space-y-3 print:hidden">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              Client Feedback History
            </h3>
            <div className="space-y-2">
              {feedbackList.map((f, i) => (
                <div key={i} className="text-xs bg-neutral-900/60 border border-neutral-800 p-3 rounded-lg text-neutral-300">
                  {f}
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className="pt-8 text-center text-[10px] text-[var(--muted)] print:text-neutral-400 print:mt-12">
          This report is generated dynamically by the Reportly Platform. Client dashboard data remains confidential.
          <br />© {new Date().getFullYear()} {agency.name}. All rights reserved.
        </footer>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="mac-card w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-[var(--white)]">Leave Feedback</h3>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="text-neutral-400 hover:text-neutral-200 text-xs"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSendFeedback} className="space-y-4">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Enter feedback or change requests for your marketing agency..."
                rows={4}
                className="mac-input w-full resize-none"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="mac-btn-secondary text-xs px-3 py-1.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="mac-btn-primary text-xs px-4 py-1.5"
                >
                  Submit Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
