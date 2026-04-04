import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const state = searchParams.get("state") || "google_analytics";

    // Handle OAuth errors
    if (error) {
      return NextResponse.redirect(
        new URL(
          `/settings?tab=integrations&error=${encodeURIComponent(error)}`,
          request.url
        )
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/settings?tab=integrations&error=missing_code", request.url)
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.redirect(
        new URL(
          "/settings?tab=integrations&error=server_misconfigured",
          request.url
        )
      );
    }

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("Token exchange error:", errorData);
      return NextResponse.redirect(
        new URL(
          `/settings?tab=integrations&error=token_exchange_failed`,
          request.url
        )
      );
    }

    const tokens = await tokenResponse.json();

    // Get authenticated user and agency
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const { data: dbUser } = await supabase
      .from("users")
      .select("agency_id")
      .eq("id", user.id)
      .single();

    if (!dbUser?.agency_id) {
      return NextResponse.redirect(
        new URL("/settings?tab=integrations&error=no_agency", request.url)
      );
    }

    // Use state parameter to determine platform (google_analytics or google_ads)
    const platform = (state === "google_ads" ? "google_ads" : "google_analytics") as "google_analytics" | "google_ads";

    const expiresAt = new Date(
      Date.now() + tokens.expires_in * 1000
    ).toISOString();

    // Upsert integration
    const { error: upsertError } = await supabase
      .from("integrations")
      .upsert(
        {
          agency_id: dbUser.agency_id,
          platform,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null,
          token_expires_at: expiresAt,
        },
        { onConflict: "agency_id,platform" }
      );

    if (upsertError) {
      console.error("Upsert error:", upsertError);
      return NextResponse.redirect(
        new URL(
          "/settings?tab=integrations&error=database_error",
          request.url
        )
      );
    }

    return NextResponse.redirect(
      new URL(
        `/settings?tab=integrations&connected=google`,
        request.url
      )
    );
  } catch (error) {
    console.error("Google callback error:", error);
    return NextResponse.redirect(
      new URL(
        "/settings?tab=integrations&error=internal_error",
        request.url
      )
    );
  }
}
