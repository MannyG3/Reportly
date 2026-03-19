import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types';

type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Server-side Supabase client bound to Next.js cookies.
 * Use in server components, server actions, and route handlers.
 */
export function createSupabaseServerClient(): TypedSupabaseClient {
  const cookieStore = cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: Parameters<typeof cookieStore.set>[1]) {
        cookieStore.set(name, value, options);
      },
      remove(name: string, options: Parameters<typeof cookieStore.set>[1]) {
        cookieStore.set(name, '', { ...options, maxAge: 0 });
      },
    },
  });
}

let serviceRoleClient: TypedSupabaseClient | null = null;

/**
 * Server-only Supabase client using the service role key.
 * Never import or use this in client components.
 * Intended for backend-only tasks (e.g. webhooks, cron jobs).
 */
export function getSupabaseServiceRoleClient(): TypedSupabaseClient {
  if (serviceRoleClient) {
    return serviceRoleClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  serviceRoleClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });

  return serviceRoleClient;
}

