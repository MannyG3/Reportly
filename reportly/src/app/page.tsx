import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 md:px-10 md:py-24">
        <div className="space-y-6">
          <p className="inline-flex items-center rounded-full border border-neutral-800 bg-neutral-900/70 px-3 py-1 text-xs text-neutral-300">
            White-label reporting for agencies
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
            Launch polished client reports in minutes, not weeks.
          </h1>
          <p className="max-w-2xl text-base text-neutral-300 md:text-lg">
            Reportly helps agencies generate branded monthly reports, share secure links,
            and keep clients in the loop without manual slide decks.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-neutral-50 px-4 py-2.5 text-sm font-medium text-neutral-950 transition hover:bg-white/90"
            >
              Start free
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-sm font-medium text-neutral-100 transition hover:bg-neutral-800"
            >
              Log in
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
            <h2 className="text-sm font-medium text-neutral-100">Branded Reports</h2>
            <p className="mt-2 text-sm text-neutral-400">
              Keep your agency identity front and center with logo, colors, and client-ready
              summaries.
            </p>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
            <h2 className="text-sm font-medium text-neutral-100">Secure Sharing</h2>
            <p className="mt-2 text-sm text-neutral-400">
              Publish passwordless private report links and control access per client.
            </p>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
            <h2 className="text-sm font-medium text-neutral-100">Fast Workflows</h2>
            <p className="mt-2 text-sm text-neutral-400">
              Move from data to delivery quickly so your team spends less time formatting and
              more time advising.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
