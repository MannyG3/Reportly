"use client";

import {
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { z } from "zod";

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

const kpisSchema = z.object({
  period: z.string().optional(),
  kpis: z.array(
    z.object({
      label: z.string(),
      value: z.number(),
      delta: z.number().optional(),
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

function formatDelta(delta?: number) {
  if (delta === undefined) return null;
  const pct = Math.round(delta * 1000) / 10;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct}%`;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mac-card overflow-hidden">
      <div className="px-5 py-4 border-b border-white/10">
        <h2 className="text-sm font-medium text-[var(--white)]">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function PublicReportClientView(props: PublicReportProps) {
  const { agency, client, reportTitle, generatedAt, sections } = props;

  return (
    <main
      className="min-h-screen text-[var(--white)]"
      style={{ ["--brand" as never]: agency.brandColor }}
    >
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        <header className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              {agency.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={agency.logoUrl}
                  alt={`${agency.name} logo`}
                  className="h-8 w-8 rounded-md object-cover border border-neutral-800"
                />
              ) : (
                <div className="h-8 w-8 rounded-md border border-white/15 bg-white/90" />
              )}
              <div className="min-w-0">
                <div className="text-xs text-[var(--muted)] truncate">{agency.name}</div>
                <h1 className="mac-title truncate">
                  {reportTitle}
                </h1>
              </div>
            </div>
            <p className="mt-3 text-sm text-[var(--muted)]">
              Client: <span className="text-[var(--white)]">{client.name}</span>
              {generatedAt ? (
                <>
                  {" "}
                  · Generated{" "}
                  <span className="text-[var(--white)]">
                    {new Date(generatedAt).toLocaleDateString()}
                  </span>
                </>
              ) : null}
            </p>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--brand)] shadow-[0_0_0_3px_rgba(255,255,255,0.06)]" />
            <span className="text-xs text-[var(--muted)]">Branded report</span>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4">
          {sections
            .slice()
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((section) => {
              if (section.section_type === "kpis") {
                const parsed = kpisSchema.safeParse(section.data_snapshot);
                if (!parsed.success) return null;
                const { kpis } = parsed.data;
                return (
                  <Card key={section.id} title="Key metrics">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {kpis.map((kpi) => {
                        const deltaText = formatDelta(kpi.delta);
                        const isUp = (kpi.delta ?? 0) > 0;
                        return (
                          <div
                            key={kpi.label}
                            className="mac-card-subtle p-4"
                          >
                            <div className="text-xs text-[var(--muted)]">{kpi.label}</div>
                            <div className="mt-2 text-xl font-semibold tracking-tight">
                              {kpi.value.toLocaleString()}
                            </div>
                            {deltaText ? (
                              <div
                                className={[
                                  "mt-1 text-xs",
                                  isUp ? "text-emerald-300" : "text-red-300",
                                ].join(" ")}
                              >
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

              if (section.section_type === "traffic_over_time") {
                const parsed = trafficSchema.safeParse(section.data_snapshot);
                if (!parsed.success) return null;
                const { series } = parsed.data;
                return (
                  <Card key={section.id} title="Traffic over time">
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={series}>
                          <XAxis
                            dataKey="date"
                            tick={{ fill: "#a3a3a3", fontSize: 12 }}
                            axisLine={{ stroke: "#262626" }}
                            tickLine={{ stroke: "#262626" }}
                          />
                          <YAxis
                            tick={{ fill: "#a3a3a3", fontSize: 12 }}
                            axisLine={{ stroke: "#262626" }}
                            tickLine={{ stroke: "#262626" }}
                          />
                          <Tooltip
                            contentStyle={{
                              background: "rgba(10,10,10,0.95)",
                              border: "1px solid #262626",
                              borderRadius: 12,
                              color: "#fafafa",
                            }}
                            labelStyle={{ color: "#d4d4d4" }}
                          />
                          <Line
                            type="monotone"
                            dataKey="sessions"
                            stroke="var(--brand)"
                            strokeWidth={2.5}
                            dot={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="users"
                            stroke="#60a5fa"
                            strokeWidth={2.5}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-xs text-neutral-400">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[var(--brand)]" />
                        Sessions
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-blue-400" />
                        Users
                      </div>
                    </div>
                  </Card>
                );
              }

              if (section.section_type === "channel_mix") {
                const parsed = channelSchema.safeParse(section.data_snapshot);
                if (!parsed.success) return null;
                const { channels } = parsed.data;
                const palette = [
                  "var(--brand)",
                  "#60a5fa",
                  "#34d399",
                  "#fbbf24",
                  "#f472b6",
                ];
                const data = channels.map((c, idx) => ({
                  ...c,
                  fill: palette[idx % palette.length],
                }));

                return (
                  <Card key={section.id} title="Channel mix">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      <div className="h-60 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Tooltip
                              contentStyle={{
                                background: "rgba(10,10,10,0.95)",
                                border: "1px solid #262626",
                                borderRadius: 12,
                                color: "#fafafa",
                              }}
                              labelStyle={{ color: "#d4d4d4" }}
                            />
                            <Pie
                              data={data}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={55}
                              outerRadius={80}
                              stroke="#0a0a0a"
                              strokeWidth={2}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="space-y-2">
                        {data.map((c) => (
                          <div
                            key={c.name}
                            className="flex items-center justify-between gap-3 mac-card-subtle px-3 py-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ background: c.fill }}
                              />
                              <span className="text-sm text-[var(--white)] truncate">
                                {c.name}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-[var(--white)]">
                              {c.value}%
                            </span>
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

        <footer className="pt-4 text-xs text-[var(--muted)]">
          This report is provided by {agency.name}.
        </footer>
      </div>
    </main>
  );
}

