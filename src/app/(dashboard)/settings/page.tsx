"use client";

import { FormEvent, useState, useEffect } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

interface SettingsFormState {
  agencyName: string;
  logoUrl: string;
  brandColor: string;
  customDomain: string;
}

export default function SettingsPage() {
  const supabase = getBrowserSupabaseClient();
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [form, setForm] = useState<SettingsFormState>({
    agencyName: "",
    logoUrl: "",
    brandColor: "#ffffff",
    customDomain: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch agency data on mount
  useEffect(() => {
    async function fetchAgency() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          window.location.href = "/login";
          return;
        }

        const { data: dbUser, error: dbUserError } = await supabase
          .from("users")
          .select("agency_id")
          .eq("id", user.id)
          .single();

        if (dbUserError || !dbUser) {
          window.location.href = "/login";
          return;
        }

        const { data: agency, error: agencyError } = await supabase
          .from("agencies")
          .select("name, logo_url, brand_color, custom_domain")
          .eq("id", dbUser.agency_id)
          .single();

        if (agencyError || !agency) {
          setError("Unable to load agency settings.");
          return;
        }

        setAgencyId(dbUser.agency_id);
        setForm({
          agencyName: agency.name || "",
          logoUrl: agency.logo_url || "",
          brandColor: agency.brand_color || "#ffffff",
          customDomain: agency.custom_domain || "",
        });
      } catch (err) {
        console.error(err);
        setError("An error occurred while loading settings.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchAgency();
  }, [supabase]);

  const handleChange = (field: keyof SettingsFormState) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.agencyName.trim()) {
      setError("Agency name is required.");
      return;
    }

    if (!agencyId) {
      setError("Unable to update: agency not found.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: updateError } = await supabase
        .from("agencies")
        .update({
          name: form.agencyName.trim(),
          logo_url: form.logoUrl.trim() || null,
          brand_color: form.brandColor,
          custom_domain: form.customDomain.trim() || null,
        })
        .eq("id", agencyId);

      if (updateError) {
        throw updateError;
      }

      setSuccess("Settings updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to update settings."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-neutral-50">Settings</h1>
          <p className="text-sm text-neutral-400">
            Loading your agency settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-neutral-50">Settings</h1>
        <p className="text-sm text-neutral-400">
          Manage your agency branding and settings.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-8 max-w-2xl"
      >
        {error && (
          <div className="p-3 rounded-lg bg-red-950/40 border border-red-900/60 text-sm text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 rounded-lg bg-green-950/40 border border-green-900/60 text-sm text-green-400">
            {success}
          </div>
        )}

        {/* Agency Name */}
        <div className="space-y-3">
          <label
            htmlFor="agencyName"
            className="block text-sm font-medium text-neutral-200"
          >
            Agency name
          </label>
          <input
            id="agencyName"
            type="text"
            value={form.agencyName}
            onChange={handleChange("agencyName")}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-50 placeholder-neutral-500 outline-none ring-0 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-500/40 transition"
            placeholder="Your Agency Name"
          />
        </div>

        {/* Logo URL */}
        <div className="space-y-3">
          <label
            htmlFor="logoUrl"
            className="block text-sm font-medium text-neutral-200"
          >
            Logo URL
          </label>
          <input
            id="logoUrl"
            type="url"
            value={form.logoUrl}
            onChange={handleChange("logoUrl")}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-50 placeholder-neutral-500 outline-none ring-0 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-500/40 transition"
            placeholder="https://example.com/logo.png"
          />
          <p className="text-xs text-neutral-500">
            Full URL to your agency's logo image.
          </p>
        </div>

        {/* Brand Color */}
        <div className="space-y-3">
          <label
            htmlFor="brandColor"
            className="block text-sm font-medium text-neutral-200"
          >
            Brand color
          </label>
          <div className="flex items-center gap-3">
            <input
              id="brandColor"
              type="color"
              value={form.brandColor}
              onChange={handleChange("brandColor")}
              className="h-10 w-20 rounded-lg border border-neutral-800 cursor-pointer"
            />
            <input
              type="text"
              value={form.brandColor}
              onChange={handleChange("brandColor")}
              className="flex-1 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-50 placeholder-neutral-500 outline-none ring-0 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-500/40 transition"
              placeholder="#ffffff"
            />
          </div>
          <p className="text-xs text-neutral-500">
            Primary color for report styling.
          </p>
        </div>

        {/* Custom Domain */}
        <div className="space-y-3">
          <label
            htmlFor="customDomain"
            className="block text-sm font-medium text-neutral-200"
          >
            Custom domain (optional)
          </label>
          <input
            id="customDomain"
            type="text"
            value={form.customDomain}
            onChange={handleChange("customDomain")}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-50 placeholder-neutral-500 outline-none ring-0 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-500/40 transition"
            placeholder="reports.youragency.com"
          />
          <p className="text-xs text-neutral-500">
            Custom domain for client report URLs. Leave blank to use default.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-lg bg-neutral-50 text-neutral-950 px-5 py-2.5 text-sm font-medium transition disabled:opacity-60 disabled:cursor-not-allowed hover:bg-white/90"
        >
          {isSubmitting ? "Saving..." : "Save settings"}
        </button>
      </form>
    </div>
  );
}
