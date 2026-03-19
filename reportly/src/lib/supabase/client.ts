import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types";

let browserClient: SupabaseClient<Database> | null = null;

function stripInvalidPublishableAuthorization(init?: RequestInit) {
  if (!init?.headers) return init;

  const headers = new Headers(init.headers);
  const auth = headers.get("Authorization");

  // Supabase "publishable" keys are not JWTs; some clients may accidentally
  // set `Authorization: Bearer sb_publishable_...` which Supabase rejects.
  if (auth && /Bearer\s+sb_[a-z_]+/i.test(auth)) {
    headers.delete("Authorization");
  }

  return { ...init, headers };
}

export function getBrowserSupabaseClient(): SupabaseClient<Database> {
  if (browserClient) return browserClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: (input, init) => fetch(input, stripInvalidPublishableAuthorization(init)),
    },
  });
  return browserClient;
}

