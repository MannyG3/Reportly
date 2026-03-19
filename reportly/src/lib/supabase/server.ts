import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types";

type TypedSupabaseClient = SupabaseClient<Database>;

export async function createSupabaseServerClient(): Promise<TypedSupabaseClient> {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: (input, init) => {
        if (!init?.headers) return fetch(input, init);
        const headers = new Headers(init.headers);
        const auth = headers.get("Authorization");
        if (auth && /Bearer\s+sb_[a-z_]+/i.test(auth)) {
          headers.delete("Authorization");
        }
        return fetch(input, { ...init, headers });
      },
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Ignore cookie mutations in contexts where response cookies are immutable.
        }
      },
    },
  });
}

let serviceRoleClient: TypedSupabaseClient | null = null;

export function getSupabaseServiceRoleClient(): TypedSupabaseClient {
  if (serviceRoleClient) return serviceRoleClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  serviceRoleClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  return serviceRoleClient;
}

