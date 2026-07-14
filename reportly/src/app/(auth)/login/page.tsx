"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import { TrendingUp } from "lucide-react";

interface LoginFormState {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState<LoginFormState>({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirectTo, setRedirectTo] = useState("/dashboard");

  useEffect(() => {
    const redirect = new URLSearchParams(window.location.search).get("redirect");
    if (redirect) {
      setRedirectTo(redirect);
    }
  }, []);

  const handleChange =
    (field: keyof LoginFormState) => (e: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.email.trim() || !form.password) {
      setError("Please enter your email and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const email = form.email.trim().toLowerCase();
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: form.password }),
      });

      const payload = (await res.json().catch(() => null)) as
        | { ok: true }
        | { error: string };

      if (!res.ok) {
        throw new Error(payload && "error" in payload ? payload.error : "Unable to log in.");
      }

      // Wait for session to be established before redirecting
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Verify session is established
      const supabase = getBrowserSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Session not established. Please try again.");
      }

      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Unable to log in. Please try again."
      );
      setIsSubmitting(false);
    }
  }

  async function handleDemoLogin() {
    setIsSubmitting(true);
    setError(null);

    try {
      document.cookie = "is_demo=true; path=/; max-age=86400";
      await new Promise((resolve) => setTimeout(resolve, 300));
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Unable to log in as demo user.");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mac-page-center">
      <div className="mac-shell-sm space-y-6">
        <div className="flex justify-start">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>

        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="h-2 w-2 rounded-full bg-[var(--gold)] shadow-[0_0_10px_rgba(201,168,76,0.75)]" />
            <span className="text-sm font-medium tracking-tight text-[var(--foreground)]">Reportly</span>
          </div>
          <h1 className="mac-title">Welcome back</h1>
          <p className="mac-subtitle">
            Log in to access your client reports and dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 mac-card p-6">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange("email")}
              className="mac-input"
              placeholder="you@agency.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange("password")}
              className="mac-input"
              placeholder="••••••••"
              minLength={8}
              required
            />
          </div>

          {error && (
            <p className="mac-alert mac-alert-error">{error}</p>
          )}

          <div className="space-y-2 pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="mac-btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? "Logging in..." : "Log in"}
            </button>
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={isSubmitting}
              className="mac-btn-secondary w-full disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Try with Demo Account
            </button>
          </div>
        </form>

        <p className="text-center text-xs text-[var(--muted)]">
          New to Reportly?{" "}
          <a
            href="/signup"
            className="font-medium text-[var(--white)] hover:text-[var(--gold)] underline underline-offset-4"
          >
            Create an agency account
          </a>
        </p>
      </div>
    </main>
  );
}

