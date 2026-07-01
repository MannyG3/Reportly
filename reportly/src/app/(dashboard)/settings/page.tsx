"use client";

import { FormEvent, useState, useEffect, Suspense } from "react";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import IntegrationsTab from "@/components/settings/IntegrationsTab";
import { Trash2, UserPlus, Users, Eye, Sparkles } from "lucide-react";

type TabType = "branding" | "integrations" | "team";

interface SettingsFormState {
  agencyName: string;
  logoUrl: string;
  brandColor: string;
  customDomain: string;
}

interface TeamMember {
  id: string;
  email: string;
  role: "owner" | "admin" | "member";
  created_at: string;
}

function SettingsContent() {
  const supabase = getBrowserSupabaseClient();
  const searchParams = useSearchParams();
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [authedUserId, setAuthedUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("branding");
  
  const [form, setForm] = useState<SettingsFormState>({
    agencyName: "",
    logoUrl: "",
    brandColor: "#c9a84c",
    customDomain: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Team states
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"owner" | "admin" | "member">("member");
  const [isInviting, setIsInviting] = useState(false);

  // Set active tab from search params
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "integrations" || tab === "team") {
      setActiveTab(tab as TabType);
    } else {
      setActiveTab("branding");
    }

    const connected = searchParams.get("connected");
    if (connected) {
      setSuccess(`Successfully connected ${connected}!`);
      setTimeout(() => setSuccess(null), 3000);
    }

    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(`Connection failed: ${errorParam}`);
      setTimeout(() => setError(null), 5000);
    }
  }, [searchParams]);

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

        setAuthedUserId(user.id);

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
          brandColor: agency.brand_color || "#c9a84c",
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

  // Fetch Team members
  const fetchTeam = async () => {
    if (!agencyId) return;
    setLoadingTeam(true);
    try {
      const res = await fetch("/api/team");
      if (!res.ok) throw new Error("Failed to load team");
      const data = await res.json();
      setTeam(data.members || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch team members");
    } finally {
      setLoadingTeam(false);
    }
  };

  useEffect(() => {
    if (activeTab === "team" && agencyId) {
      fetchTeam();
    }
  }, [activeTab, agencyId]);

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

      setSuccess("Branding settings updated successfully!");
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

  // Handle Team Member Invitation
  const handleInviteMember = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to invite member");
      }

      setSuccess("Team member added successfully!");
      setInviteEmail("");
      fetchTeam();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invite failed");
    } finally {
      setIsInviting(false);
    }
  };

  // Handle member delete
  const handleRemoveMember = async (id: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    setError(null);
    try {
      const res = await fetch(`/api/team/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to delete member");
      }
      setSuccess("Team member removed successfully");
      fetchTeam();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remove failed");
    }
  };

  // Handle member role update
  const handleRoleUpdate = async (id: string, newRole: "owner" | "admin" | "member") => {
    setError(null);
    try {
      const res = await fetch(`/api/team/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to update role");
      }
      setSuccess("Member role updated");
      fetchTeam();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Role update failed");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-neutral-50">Settings</h1>
          <p className="text-sm text-neutral-400">Loading your settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-neutral-50">Settings</h1>
        <p className="text-sm text-neutral-400">
          Manage your agency settings, team, and integrations.
        </p>
      </div>

      {/* Tabs navigation */}
      <div className="flex gap-2 border-b border-neutral-800">
        {[
          { key: "branding", label: "Agency Branding" },
          { key: "integrations", label: "Integrations" },
          { key: "team", label: "Agency Team" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as TabType)}
            className={`px-4 py-3 text-sm font-medium transition border-b-2 ${
              activeTab === tab.key
                ? "border-[var(--gold)] text-[var(--gold)]"
                : "border-transparent text-neutral-400 hover:text-neutral-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content wrapper */}
      <div>
        {error && (
          <div className="p-3 mb-6 rounded-lg bg-red-950/40 border border-red-900/60 text-sm text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 mb-6 rounded-lg bg-green-950/40 border border-green-900/60 text-sm text-green-400">
            {success}
          </div>
        )}

        {/* Branding Tab */}
        {activeTab === "branding" && agencyId && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="agencyName" className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Agency name
                </label>
                <input
                  id="agencyName"
                  type="text"
                  value={form.agencyName}
                  onChange={handleChange("agencyName")}
                  className="mac-input"
                  placeholder="Your Agency Name"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="logoUrl" className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Logo URL
                </label>
                <input
                  id="logoUrl"
                  type="url"
                  value={form.logoUrl}
                  onChange={handleChange("logoUrl")}
                  className="mac-input"
                  placeholder="https://example.com/logo.png"
                />
                <p className="text-[10px] text-neutral-500">
                  Full URL to your agency's logo image (displayed on shared client reports).
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="brandColor" className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Brand color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="brandColor"
                    type="color"
                    value={form.brandColor}
                    onChange={handleChange("brandColor")}
                    className="h-10 w-16 rounded-lg border border-neutral-800 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={form.brandColor}
                    onChange={handleChange("brandColor")}
                    className="mac-input flex-1"
                    placeholder="#c9a84c"
                  />
                </div>
                <p className="text-[10px] text-neutral-500">
                  Primary branding color highlights on reports and summaries.
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="customDomain" className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Custom domain (optional)
                </label>
                <input
                  id="customDomain"
                  type="text"
                  value={form.customDomain}
                  onChange={handleChange("customDomain")}
                  className="mac-input"
                  placeholder="reports.youragency.com"
                />
                <p className="text-[10px] text-neutral-500">
                  Custom subdomain for hosted reports. Configure CNAME to point to reportlyy.app.
                </p>

                {/* Interactive CNAME/DNS Setup Guide */}
                {form.customDomain.trim().length > 0 && (
                  <div className="mt-3 p-4 rounded-xl border border-yellow-950/30 bg-yellow-950/10 text-xs text-yellow-200/90 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-yellow-300">DNS Config Checklist</span>
                      <span className="px-1.5 py-0.5 rounded bg-yellow-900/40 text-[9px] font-bold text-yellow-400 border border-yellow-800/40 animate-pulse">
                        Pending DNS propagation
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-yellow-200/75">
                      Configure the following record in your DNS provider (e.g. Cloudflare, GoDaddy) to verify domain hosting:
                    </p>
                    <div className="p-2.5 rounded-lg bg-black/45 border border-yellow-900/30 font-mono text-[10px] space-y-1 select-all">
                      <div><span className="text-neutral-400">Type:</span> CNAME</div>
                      <div><span className="text-neutral-400">Host:</span> {form.customDomain.split(".")[0] || "reports"}</div>
                      <div><span className="text-neutral-400">Target:</span> cname.reportlyy.app</div>
                      <div><span className="text-neutral-400">TTL:</span> Automatic / 3600</div>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mac-btn-primary px-6"
              >
                {isSubmitting ? "Saving..." : "Save Branding Settings"}
              </button>
            </form>

            {/* Live Preview Card */}
            <div className="lg:col-span-2 space-y-3">
              <span className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--gold)]" />
                Live Report Header Preview
              </span>
              
              <div
                className="mac-card overflow-hidden p-5 space-y-5 transition duration-300"
                style={{ borderLeft: `4px solid ${form.brandColor}` }}
              >
                <div className="flex items-center gap-3">
                  {form.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.logoUrl}
                      alt="Agency logo preview"
                      className="h-9 w-9 rounded-lg object-cover border border-neutral-800"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-lg border border-white/10 bg-white/95 flex items-center justify-center font-bold text-neutral-900 text-xs">
                      {(form.agencyName || "AG").slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-[9px] text-[var(--muted)] uppercase tracking-wider truncate">
                      {form.agencyName || "Your Agency"}
                    </div>
                    <div className="text-xs font-semibold text-[var(--white)] truncate">
                      Monthly Report • June 2026
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-[10px] text-neutral-500">
                  <span>Client: Acme Corp</span>
                  <span className="flex items-center gap-1 text-[var(--gold)]">
                    <Eye className="w-3.5 h-3.5" />
                    Branded report
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Integrations Tab */}
        {activeTab === "integrations" && agencyId && (
          <IntegrationsTab agencyId={agencyId} />
        )}

        {/* Team Tab */}
        {activeTab === "team" && agencyId && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Team invitation list */}
            <div className="lg:col-span-2 mac-card overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-sm font-medium text-[var(--white)] flex items-center gap-2">
                  <Users className="w-4 h-4 text-neutral-400" />
                  Active Agency Members
                </h3>
                <span className="text-[10px] bg-neutral-900 px-2 py-0.5 rounded text-neutral-400">
                  {team.length} members
                </span>
              </div>

              {loadingTeam ? (
                <div className="p-8 text-center text-xs text-neutral-500">
                  Loading agency team members...
                </div>
              ) : team.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-500">
                  No members found.
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {team.map((member) => {
                    const isSelf = member.id === authedUserId;
                    return (
                      <div
                        key={member.id}
                        className="px-5 py-3.5 flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-neutral-200 flex items-center gap-1.5 truncate">
                            {member.email}
                            {isSelf && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                                You
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-neutral-500 mt-0.5">
                            Added {new Date(member.created_at).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Role select */}
                          {isSelf ? (
                            <span className="text-[10px] font-semibold uppercase text-[var(--gold)] bg-[var(--gold-dim)] px-2 py-0.5 rounded border border-[rgba(201,168,76,0.3)]">
                              {member.role}
                            </span>
                          ) : (
                            <select
                              value={member.role}
                              onChange={(e) =>
                                handleRoleUpdate(
                                  member.id,
                                  e.target.value as "owner" | "admin" | "member"
                                )
                              }
                              className="mac-select py-1 px-2.5 text-xs rounded-lg bg-neutral-900 border-neutral-800 text-neutral-300 w-28"
                            >
                              <option value="owner">Owner</option>
                              <option value="admin">Admin</option>
                              <option value="member">Member</option>
                            </select>
                          )}

                          {/* Delete button */}
                          {!isSelf && (
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="p-1.5 rounded-lg border border-red-950/40 bg-red-950/20 text-red-400 hover:bg-red-950/40 hover:border-red-900/60 transition"
                              title="Remove member"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Invite Form */}
            <div className="mac-card p-5 space-y-4 h-fit">
              <div>
                <h3 className="text-sm font-medium text-[var(--white)] flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-[var(--gold)]" />
                  Add Team Member
                </h3>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Invite another user to join this agency and manage reports.
                </p>
              </div>

              <form onSubmit={handleInviteMember} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="inviteEmail" className="block text-xs text-neutral-400 font-medium">
                    Email Address
                  </label>
                  <input
                    id="inviteEmail"
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="mac-input"
                    placeholder="name@agency.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="inviteRole" className="block text-xs text-neutral-400 font-medium">
                    Role Privilege
                  </label>
                  <select
                    id="inviteRole"
                    value={inviteRole}
                    onChange={(e) =>
                      setInviteRole(e.target.value as "owner" | "admin" | "member")
                    }
                    className="mac-select"
                  >
                    <option value="member">Member (Can edit reports)</option>
                    <option value="admin">Admin (Can edit settings & clients)</option>
                    <option value="owner">Owner (Full administrative rights)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isInviting || !inviteEmail}
                  className="mac-btn-primary w-full disabled:opacity-60"
                >
                  {isInviting ? "Adding..." : "Add Member"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
