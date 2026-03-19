"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
<<<<<<<< HEAD:src/app/(auth)/signup/page.tsx
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import { completeSignup } from "./actions";

========
>>>>>>>> e9730c1 (Fix auth flow and app routing):reportly/src/app/(auth)/signup/page.tsx
interface SignupFormState {
  agencyName: string;
  email: string;
  password: string;
}

export default function SignupPage() {
  const router = useRouter();

  const [form, setForm] = useState<SignupFormState>({
    agencyName: "",
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange =
    (field: keyof SignupFormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.agencyName.trim() || !form.email.trim() || !form.password) {
      setError("Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyName: form.agencyName.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
        }),
      });

      const payload = (await res.json().catch(() => null)) as
        | { ok: true }
        | { error: string };

      if (!res.ok) {
        throw new Error(payload && "error" in payload ? payload.error : "Unable to sign up.");
      }

      const email = form.email.trim().toLowerCase();
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: form.password }),
      });

      const loginPayload = (await loginRes.json().catch(() => null)) as
        | { ok: true }
        | { error: string };

      if (!loginRes.ok) {
        throw new Error(
          loginPayload && "error" in loginPayload
            ? loginPayload.error
            : "Account created, but unable to log in."
        );
      }

      // 4) Create Stripe subscription (server-side for security)
      const signupResult = await completeSignup(
        agency.id,
        form.email.trim().toLowerCase(),
        form.agencyName.trim()
      );

      if (!signupResult.success) {
        console.error("Subscription creation failed:", signupResult.error);
        // Don't fail signup if Stripe fails - account is already created
        // User can retry subscription setup from settings
      }

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Create your agency account
          </h1>
          <p className="text-sm text-neutral-400">
            Sign up to start generating white-label reports for your clients.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-neutral-900/60 border border-neutral-800 rounded-xl p-6 shadow-lg shadow-black/40"
        >
          <div className="space-y-2">
            <label
              htmlFor="agencyName"
              className="block text-sm font-medium text-neutral-200"
            >
              Agency name
            </label>
            <input
              id="agencyName"
              type="text"
              autoComplete="organization"
              value={form.agencyName}
              onChange={handleChange("agencyName")}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm placeholder-neutral-500 outline-none ring-0 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-500/40 transition"
              placeholder="Acme Marketing"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-neutral-200">
              Work email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange("email")}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm placeholder-neutral-500 outline-none ring-0 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-500/40 transition"
              placeholder="you@agency.com"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-neutral-200"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange("password")}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm placeholder-neutral-500 outline-none ring-0 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-500/40 transition"
              placeholder="••••••••"
              minLength={8}
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/60 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center rounded-lg bg-neutral-50 text-neutral-950 px-4 py-2.5 text-sm font-medium transition disabled:opacity-60 disabled:cursor-not-allowed hover:bg-white/90"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-center text-xs text-neutral-500">
          Already have an account?{" "}
          <a
            href="/login"
            className="font-medium text-neutral-200 hover:text-white underline underline-offset-4"
          >
            Log in
          </a>
        </p>
      </div>
    </main>
  );
}

