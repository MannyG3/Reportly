"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { completeSignup } from "./actions";
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
    (field: keyof SignupFormState) => (e: ChangeEvent<HTMLInputElement>) => {
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
        | { ok: true; agencyId: string }
        | { error: string };

      if (!res.ok) {
        throw new Error(payload && "error" in payload ? payload.error : "Unable to sign up.");
      }

      const agencyId = payload && "ok" in payload && payload.ok ? payload.agencyId : null;

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

      // Best effort subscription provisioning. Account creation should still succeed.
      if (agencyId) {
        const signupResult = await completeSignup(
          agencyId,
          email,
          form.agencyName.trim()
        );

        if (!signupResult.success) {
          console.error("Subscription creation failed:", signupResult.error);
        }
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
    <main className="mac-page-center">
      <div className="mac-shell-sm space-y-8">
        <div className="text-center space-y-2">
          <h1 className="mac-title">
            Create your agency account
          </h1>
          <p className="mac-subtitle">
            Sign up to start generating white-label reports for your clients.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 mac-card p-6"
        >
          <div className="space-y-2">
            <label
              htmlFor="agencyName"
              className="block text-sm font-medium"
            >
              Agency name
            </label>
            <input
              id="agencyName"
              type="text"
              autoComplete="organization"
              value={form.agencyName}
              onChange={handleChange("agencyName")}
              className="mac-input"
              placeholder="Acme Marketing"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium">
              Work email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange("email")}
              className="mac-input"
              placeholder="you@agency.com"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange("password")}
              className="mac-input"
              placeholder="••••••••"
              minLength={8}
            />
          </div>

          {error && (
            <p className="mac-alert mac-alert-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mac-btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-center text-xs text-[var(--muted)]">
          Already have an account?{" "}
          <a
            href="/login"
            className="font-medium text-[var(--white)] hover:text-[var(--gold)] underline underline-offset-4"
          >
            Log in
          </a>
        </p>
      </div>
    </main>
  );
}

