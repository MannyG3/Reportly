"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

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

  return (
    <>
      <style>{`
        .auth-container {
          min-height: 100vh;
          background: var(--black);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        .auth-card {
          width: 100%;
          max-width: 380px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 2.5rem;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .auth-title {
          font-family: var(--serif);
          font-size: 1.5rem;
          font-weight: 400;
          letter-spacing: -0.02em;
          margin-bottom: 0.5rem;
        }

        .auth-subtitle {
          font-size: 0.875rem;
          color: var(--muted);
          font-family: var(--sf);
          line-height: 1.5;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-label {
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--white);
          font-family: var(--sf);
          letter-spacing: -0.01em;
        }

        .form-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          color: var(--white);
          font-family: var(--sf);
          transition: all 0.15s ease;
        }

        .form-input::placeholder {
          color: var(--muted);
        }

        .form-input:focus {
          outline: none;
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(201, 168, 76, 0.5);
          box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.1);
        }

        .error-message {
          font-size: 0.8125rem;
          color: #ff6b6b;
          background: rgba(255, 107, 107, 0.1);
          border: 1px solid rgba(255, 107, 107, 0.2);
          border-radius: 10px;
          padding: 0.75rem 1rem;
          font-family: var(--sf);
          line-height: 1.5;
        }

        .btn-submit {
          width: 100%;
          background: var(--gold);
          color: var(--black);
          border: none;
          border-radius: 10px;
          padding: 0.875rem 1.5rem;
          font-size: 0.9375rem;
          font-weight: 600;
          font-family: var(--sf);
          letter-spacing: -0.01em;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .btn-submit:hover:not(:disabled) {
          background: #d4b55e;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(201, 168, 76, 0.3);
        }

        .btn-submit:active:not(:disabled) {
          transform: scale(0.98);
        }

        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .auth-footer {
          text-align: center;
          font-size: 0.8125rem;
          color: var(--muted);
          font-family: var(--sf);
        }

        .auth-link {
          color: var(--white);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.15s ease;
          border-bottom: 1px solid rgba(255, 255, 255, 0.3);
        }

        .auth-link:hover {
          color: var(--gold);
          border-bottom-color: var(--gold);
        }
      `}</style>

      <main className="auth-container">
        <div style={{ width: "100%", maxWidth: "380px", display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "1rem" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, var(--gold) 0%, #a07830 100%)",
                  boxShadow: "0 0 16px rgba(201, 168, 76, 0.3)",
                }}
              />
              <span style={{ fontFamily: "var(--sf)", fontSize: "1.1rem", fontWeight: "600", letterSpacing: "-0.02em" }}>
                Reportly
              </span>
            </div>
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-subtitle">
              Log in to access your client reports and dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }} className="auth-card">
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange("email")}
                className="form-input"
                placeholder="you@agency.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange("password")}
                className="form-input"
                placeholder="••••••••"
                minLength={8}
              />
            </div>

            {error && (
              <p className="error-message">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-submit"
            >
              {isSubmitting ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p className="auth-footer">
            New to Reportly?{" "}
            <a href="/signup" className="auth-link">
              Create an agency account
            </a>
          </p>
        </div>
      </main>
    </>
  );
}

