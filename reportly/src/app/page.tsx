'use client';

import Link from 'next/link';
import { ArrowRight, BarChart3, Zap, Shield, FileText } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50">
      {/* Navigation */}
      <nav className="border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-neutral-50" />
            <span className="font-semibold text-lg">Reportly</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-neutral-400 hover:text-neutral-50 transition"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-neutral-50 text-neutral-950 px-4 py-2 text-sm font-medium transition hover:bg-white/90"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              White-label client reports,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-200 to-neutral-400">
                automated
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-neutral-400 mx-auto max-w-2xl">
              Generate branded PDF reports from Google Analytics and Google Ads. Your clients see your agency's logo, you build the relationship.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-50 text-neutral-950 px-6 py-3 text-base font-medium transition hover:bg-white/90"
            >
              Start for free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center justify-center rounded-lg border border-neutral-800 text-neutral-50 px-6 py-3 text-base font-medium transition hover:bg-neutral-900/50"
            >
              View features
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-12 text-sm text-neutral-400">
            <div>
              <p className="text-2xl font-bold text-neutral-50">100%</p>
              <p>White-label</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-50">24/7</p>
              <p>Automation</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-50">&lt;5min</p>
              <p>Setup time</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t border-neutral-900 py-20 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Everything you need</h2>
            <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
              Built for marketing agencies that want to deliver polished reports without the busy work.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-6 hover:bg-neutral-900/60 transition">
              <BarChart3 className="w-8 h-8 text-neutral-50 mb-4" />
              <h3 className="font-semibold mb-2">Real-time Analytics</h3>
              <p className="text-sm text-neutral-400">
                Connect Google Analytics & Ads. Get live data in beautiful dashboards.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-6 hover:bg-neutral-900/60 transition">
              <FileText className="w-8 h-8 text-neutral-50 mb-4" />
              <h3 className="font-semibold mb-2">PDF Reports</h3>
              <p className="text-sm text-neutral-400">
                Generate stunning PDF reports monthly. Fully automated, ready to share.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-6 hover:bg-neutral-900/60 transition">
              <Shield className="w-8 h-8 text-neutral-50 mb-4" />
              <h3 className="font-semibold mb-2">Your Branding</h3>
              <p className="text-sm text-neutral-400">
                White-label everything. Your logo, your colors, your domain.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-6 hover:bg-neutral-900/60 transition">
              <Zap className="w-8 h-8 text-neutral-50 mb-4" />
              <h3 className="font-semibold mb-2">Instant Setup</h3>
              <p className="text-sm text-neutral-400">
                OAuth integration in minutes. Start sending reports today.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-neutral-900 py-20 sm:py-32">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">Ready to build better client relationships?</h2>
            <p className="text-lg text-neutral-400">
              Join agencies that are delivering reports faster and building stronger client bonds.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-50 text-neutral-950 px-6 py-3 text-base font-medium transition hover:bg-white/90"
            >
              Start free trial <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg border border-neutral-800 text-neutral-50 px-6 py-3 text-base font-medium transition hover:bg-neutral-900/50"
            >
              Already have an account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="border-t border-neutral-900 py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 text-sm text-neutral-500">
            <div>© 2024 Reportly. All rights reserved.</div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-neutral-300 transition">Privacy</a>
              <a href="#" className="hover:text-neutral-300 transition">Terms</a>
              <a href="#" className="hover:text-neutral-300 transition">Contact</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
