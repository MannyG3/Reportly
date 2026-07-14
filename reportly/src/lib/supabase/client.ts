import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types";

let browserClient: SupabaseClient<Database> | null = null;

function isPlaceholderSupabaseValue(value: string) {
  return (
    value.includes("your-project") ||
    value.includes("your-anon-key") ||
    value.includes("your-service-role-key") ||
    value.includes("<your-")
  );
}

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
  if (
    process.env.NEXT_PUBLIC_OFFLINE_MODE === "true" ||
    (typeof document !== "undefined" && document.cookie.includes("is_demo=true"))
  ) {
    return getMockSupabaseClient() as any;
  }

  if (browserClient) return browserClient;

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

  browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: (input, init) => fetch(input, stripInvalidPublishableAuthorization(init)),
    },
  });
  return browserClient;
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
        if (typeof document !== "undefined") {
          document.cookie = "is_demo=; path=/; max-age=0";
        }
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

