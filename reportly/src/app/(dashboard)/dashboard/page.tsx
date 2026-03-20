import Link from "next/link";

const stats = [
  { label: "Total Clients", value: "0" },
  { label: "Reports Generated", value: "0" },
  { label: "Reports This Month", value: "0" },
  { label: "Active Integrations", value: "0" },
];

export default function DashboardHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="mac-title">Dashboard</h1>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="mac-card p-4 lg:p-5 mac-hover-target spring-hover"
          >
            <p className="text-2xl font-semibold tracking-tight text-[var(--gold)] lg:text-3xl">
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-[var(--muted)] lg:text-sm">{stat.label}</p>
          </article>
        ))}
      </section>

      <section className="mac-card p-5 lg:p-6">
        <h2 className="text-lg font-medium text-[var(--white)]">Recent Reports</h2>
        <div className="mt-4 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-5 text-center lg:p-8">
          <p className="text-sm text-[var(--muted)]">
            You do not have any reports yet. Start by generating your first report.
          </p>
          <Link href="/reports" className="mac-btn-primary mt-4">
            Generate your first report
          </Link>
        </div>
      </section>
    </div>
  );
}

