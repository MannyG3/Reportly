/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types";

type TypedSupabaseClient = SupabaseClient<Database>;

function isPlaceholderSupabaseValue(value: string) {
  return (
    value.includes("your-project") ||
    value.includes("your-anon-key") ||
    value.includes("your-service-role-key") ||
    value.includes("<your-")
  );
}

export async function createSupabaseServerClient(): Promise<TypedSupabaseClient> {
  if (process.env.OFFLINE_MODE === "true") {
    return getMockSupabaseClient() as unknown as TypedSupabaseClient;
  }

  const cookieStore = await cookies();

  if (cookieStore.get("is_demo")?.value === "true") {
    return getMockSupabaseClient() as unknown as TypedSupabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  if (isPlaceholderSupabaseValue(supabaseUrl) || isPlaceholderSupabaseValue(supabaseAnonKey)) {
    throw new Error(
      "Supabase environment variables are using placeholder values. Update NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in reportly/.env.local with real Supabase credentials."
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

export function getSupabaseServiceRoleClient(): TypedSupabaseClient {
  if (process.env.OFFLINE_MODE === "true") {
    return getMockSupabaseClient() as unknown as TypedSupabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  if (isPlaceholderSupabaseValue(supabaseUrl) || isPlaceholderSupabaseValue(serviceRoleKey)) {
    throw new Error(
      "Supabase environment variables are using placeholder values. Update NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in reportly/.env.local with real Supabase credentials."
    );
  }

  const realClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const proxy: any = {
    auth: realClient.auth,
    from: (table: string) => {
      return {
        select: (columns?: string, options?: any) => {
          const chain: any = {
            eq: () => chain,
            is: () => chain,
            order: () => chain,
            limit: () => chain,
            gte: () => chain,
          };

          const execute = async () => {
            let isDemo = false;
            try {
              const cookieStore = await cookies();
              isDemo = cookieStore.get("is_demo")?.value === "true";
            } catch {}

            if (isDemo) {
              return getMockSupabaseClient().from(table).select(columns, options);
            }
            return realClient.from(table as any).select(columns, options);
          };

          chain.single = async () => {
            const res = await execute();
            return res.single();
          };

          chain.maybeSingle = async () => {
            const res = await execute();
            return res.maybeSingle();
          };

          Object.defineProperty(chain, "then", {
            value: (onfulfilled: any) => execute().then((res: any) => res.then(onfulfilled)),
            configurable: true,
          });

          return chain;
        },
        insert: (values: any) => {
          const chain: any = {
            select: () => chain,
          };

          const execute = async () => {
            let isDemo = false;
            try {
              const cookieStore = await cookies();
              isDemo = cookieStore.get("is_demo")?.value === "true";
            } catch {}

            if (isDemo) {
              return getMockSupabaseClient().from(table).insert(values);
            }
            return realClient.from(table as any).insert(values);
          };

          chain.single = async () => {
            const res = await execute();
            return res.single();
          };

          Object.defineProperty(chain, "then", {
            value: (onfulfilled: any) => execute().then((res: any) => res.then(onfulfilled)),
            configurable: true,
          });

          return chain;
        },
        update: (values: any) => {
          const chain: any = {
            eq: () => chain,
            select: () => chain,
          };

          const execute = async () => {
            let isDemo = false;
            try {
              const cookieStore = await cookies();
              isDemo = cookieStore.get("is_demo")?.value === "true";
            } catch {}

            if (isDemo) {
              return getMockSupabaseClient().from(table).update(values);
            }
            return realClient.from(table as any).update(values);
          };

          chain.single = async () => {
            const res = await execute();
            return res.single();
          };

          Object.defineProperty(chain, "then", {
            value: (onfulfilled: any) => execute().then((res: any) => res.then(onfulfilled)),
            configurable: true,
          });

          return chain;
        },
        delete: () => {
          const chain: any = {
            eq: () => chain,
            select: () => chain,
          };

          const execute = async () => {
            let isDemo = false;
            try {
              const cookieStore = await cookies();
              isDemo = cookieStore.get("is_demo")?.value === "true";
            } catch {}

            if (isDemo) {
              return getMockSupabaseClient().from(table).delete();
            }
            return realClient.from(table as any).delete();
          };

          chain.single = async () => {
            const res = await execute();
            return res.single();
          };

          Object.defineProperty(chain, "then", {
            value: (onfulfilled: any) => execute().then((res: any) => res.then(onfulfilled)),
            configurable: true,
          });

          return chain;
        },
      };
    },
  };

  return proxy;
}

function getMockSupabaseClient(): any {
  return {
    auth: {
      getUser: async () => ({
        data: {
          user: {
            id: "demo-user-id",
            email: "demo@reportly.com",
          },
        },
        error: null,
      }),
      getSession: async () => ({
        data: {
          session: {
            user: {
              id: "demo-user-id",
              email: "demo@reportly.com",
            },
          },
        },
        error: null,
      }),
      signOut: async () => {
        return { error: null };
      },
    },
    from: (table: string) => {
      const chain: any = {
        select: (columns?: string, options?: any) => {
          let data: any = [];
          let count = 0;

          if (table === "users") {
            data = { agency_id: "demo-agency-id", role: "owner" };
            count = 1;
          } else if (table === "clients") {
            data = [
              { id: "c1", name: "Acme Corp", email: "contact@acme.com" },
              { id: "c2", name: "Stark Industries", email: "pepper@stark.com" },
              { id: "c3", name: "Wayne Enterprises", email: "bruce@wayne.com" },
            ];
            count = 3;
          } else if (table === "reports") {
            data = [
              { id: "r1", title: "Q2 Marketing Performance", status: "ready", share_token: "demo-token-1", created_at: new Date().toISOString(), client_id: "c1", clients: { name: "Acme Corp" } },
              { id: "r2", title: "Google Ads Overview", status: "ready", share_token: "demo-token-2", created_at: new Date().toISOString(), client_id: "c1", clients: { name: "Acme Corp" } },
              { id: "r3", title: "Social Campaign Reach", status: "ready", share_token: "demo-token-3", created_at: new Date().toISOString(), client_id: "c2", clients: { name: "Stark Industries" } },
              { id: "r4", title: "Monthly Growth Audit", status: "ready", share_token: "demo-token-4", created_at: new Date().toISOString(), client_id: "c3", clients: { name: "Wayne Enterprises" } },
              { id: "r5", title: "SEO Audit Draft", status: "draft", share_token: null, created_at: new Date().toISOString(), client_id: "c3", clients: { name: "Wayne Enterprises" } },
            ];
            count = 5;
          } else if (table === "integrations") {
            data = [];
            count = 0;
          } else if (table === "subscriptions") {
            data = { plan: "starter", status: "active" };
            count = 1;
          } else if (table === "agencies") {
            data = {
              name: "Demo Agency",
              logo_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&auto=format&fit=crop&q=60",
              brand_color: "#c9a84c",
              custom_domain: "reports.demoagency.com"
            };
            count = 1;
          }

          const finalChain: any = {
            eq: () => finalChain,
            is: () => finalChain,
            order: () => finalChain,
            limit: () => finalChain,
            gte: () => finalChain,
            single: async () => ({ data, error: null }),
            maybeSingle: async () => ({ data, error: null }),
          };

          Object.defineProperty(finalChain, "then", {
            value: (onfulfilled: any) => Promise.resolve({ data, count, error: null }).then(onfulfilled),
            configurable: true,
          });

          return finalChain;
        },
        insert: (values: any) => {
          const insertChain: any = {
            select: () => insertChain,
            single: async () => ({ data: Array.isArray(values) ? values[0] : values, error: null }),
            maybeSingle: async () => ({ data: Array.isArray(values) ? values[0] : values, error: null }),
          };
          Object.defineProperty(insertChain, "then", {
            value: (onfulfilled: any) => Promise.resolve({ data: Array.isArray(values) ? values[0] : values, error: null }).then(onfulfilled),
            configurable: true,
          });
          return insertChain;
        },
        update: (values: any) => {
          const updateChain: any = {
            eq: () => updateChain,
            select: () => updateChain,
            single: async () => ({ data: values, error: null }),
            maybeSingle: async () => ({ data: values, error: null }),
          };
          Object.defineProperty(updateChain, "then", {
            value: (onfulfilled: any) => Promise.resolve({ data: values, error: null }).then(onfulfilled),
            configurable: true,
          });
          return updateChain;
        },
        delete: () => {
          const deleteChain: any = {
            eq: () => deleteChain,
            select: () => deleteChain,
            single: async () => ({ data: {}, error: null }),
            maybeSingle: async () => ({ data: {}, error: null }),
          };
          Object.defineProperty(deleteChain, "then", {
            value: (onfulfilled: any) => Promise.resolve({ data: {}, error: null }).then(onfulfilled),
            configurable: true,
          });
          return deleteChain;
        }
      };
      return chain;
    },
  };
}

