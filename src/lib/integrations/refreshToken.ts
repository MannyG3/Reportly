import { createSupabaseServerClient } from "@/lib/supabase/server";

interface TokenRefreshResult {
  success: boolean;
  accessToken?: string;
  expiresAt?: number;
  error?: string;
}

export async function refreshGoogleToken(
  integrationId: string
): Promise<TokenRefreshResult> {
  try {
    const supabase = await createSupabaseServerClient();

    // Get the integration with refresh token
    const { data: integration, error: fetchError } = await supabase
      .from("integrations")
      .select("refresh_token")
      .eq("id", integrationId)
      .single();

    if (fetchError || !integration?.refresh_token) {
      return { success: false, error: "Integration not found or no refresh token" };
    }

    // Exchange refresh token for new access token
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        refresh_token: integration.refresh_token,
        grant_type: "refresh_token",
      }).toString(),
    });

    if (!response.ok) {
      return { success: false, error: "Failed to refresh token" };
    }

    const data = await response.json();

    // Update the integration with new access token
    const expiresAt = Date.now() + data.expires_in * 1000;
    const { error: updateError } = await supabase
      .from("integrations")
      .update({
        access_token: data.access_token,
        token_expires_at: new Date(expiresAt).toISOString(),
      })
      .eq("id", integrationId);

    if (updateError) {
      return { success: false, error: "Failed to update token" };
    }

    return { success: true, accessToken: data.access_token, expiresAt };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
