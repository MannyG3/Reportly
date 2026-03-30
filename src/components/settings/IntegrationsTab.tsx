"use client";

import { useEffect, useState } from "react";
import { BarChart3, Zap, Share2 } from "lucide-react";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

interface Integration {
  platform: "google_analytics" | "google_ads" | "meta_ads";
  isConnected: boolean;
}

const PLATFORMS = [
  {
    id: "google_analytics",
    name: "Google Analytics 4",
    description: "Track website traffic and user behavior",
    icon: BarChart3,
  },
  {
    id: "google_ads",
    name: "Google Ads",
    description: "Monitor campaign performance and spend",
    icon: Zap,
  },
  {
    id: "meta_ads",
    name: "Meta Ads",
    description: "Manage Facebook and Instagram advertising",
    icon: Share2,
  },
];

export default function IntegrationsTab({ agencyId }: { agencyId: string }) {
  const supabase = getBrowserSupabaseClient();
  const [integrations, setIntegrations] = useState<Map<string, boolean>>(
    new Map()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);

  // Fetch connected integrations
  useEffect(() => {
    async function fetchIntegrations() {
      try {
        const { data, error } = await supabase
          .from("integrations")
          .select("platform")
          .eq("agency_id", agencyId);

        if (error) throw error;

        const connected = new Map<string, boolean>();
        PLATFORMS.forEach((p) => connected.set(p.id, false));
        data.forEach((d) => connected.set(d.platform, true));
        setIntegrations(connected);
      } catch (err) {
        console.error("Failed to fetch integrations:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchIntegrations();
  }, [agencyId, supabase]);

  const handleConnect = async (platform: string) => {
    setIsConnecting(platform);
    try {
      const response = await fetch(`/api/integrations/${platform}/connect`);
      if (response.ok) {
        const { authUrl } = await response.json();
        window.location.href = authUrl;
      } else {
        alert(`Failed to initiate connection for ${platform}`);
      }
    } catch (err) {
      console.error("Connection error:", err);
      alert("An error occurred while connecting");
    } finally {
      setIsConnecting(platform);
    }
  };

  const handleDisconnect = async (platform: string) => {
    if (
      !confirm(
        `Are you sure you want to disconnect ${platform.replace(/_/g, " ")}?`
      )
    ) {
      return;
    }

    setIsDisconnecting(platform);
    try {
      const response = await fetch(
        `/api/integrations/${platform}/disconnect`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setIntegrations((prev) => new Map(prev).set(platform, false));
      } else {
        alert("Failed to disconnect integration");
      }
    } catch (err) {
      console.error("Disconnect error:", err);
      alert("An error occurred while disconnecting");
    } finally {
      setIsDisconnecting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {PLATFORMS.map((p) => (
          <div
            key={p.id}
            className="h-24 rounded-lg border border-neutral-800 bg-neutral-900/50 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {PLATFORMS.map((platform) => {
        const Icon = platform.icon;
        const isConnected = integrations.get(platform.id) || false;
        const isLoading = isConnecting === platform.id || isDisconnecting === platform.id;

        return (
          <div
            key={platform.id}
            className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/50 p-4 hover:border-neutral-700 transition"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-neutral-800">
                <Icon className="w-6 h-6 text-neutral-400" />
              </div>
              <div>
                <h3 className="font-medium text-neutral-50">{platform.name}</h3>
                <p className="text-sm text-neutral-400">{platform.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isConnected && (
                <span className="px-3 py-1 rounded-full bg-green-950/40 border border-green-900/60 text-xs font-medium text-green-400">
                  Connected
                </span>
              )}

              {isConnected ? (
                <button
                  onClick={() => handleDisconnect(platform.id)}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-red-900/60 text-red-400 hover:bg-red-950/20 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {isLoading ? "Disconnecting..." : "Disconnect"}
                </button>
              ) : (
                <button
                  onClick={() => handleConnect(platform.id)}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-neutral-50 text-neutral-950 hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {isLoading ? "Connecting..." : "Connect"}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
