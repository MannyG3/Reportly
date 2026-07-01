import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase/server";

// Memory cache to store user.id -> agency_id mappings and speed up database requests.
const agencyIdCache = new Map<string, string>();

export async function getAgencyIdForAuthedUser() {
  const supabase = await createSupabaseServerClient();
  
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // Check cache first to avoid database lookup
  const cachedAgencyId = agencyIdCache.get(user.id);
  if (cachedAgencyId) {
    return { supabase, agencyId: cachedAgencyId, userId: user.id };
  }

  const { data: dbUser, error: dbUserError } = await supabase
    .from("users")
    .select("agency_id")
    .eq("id", user.id)
    .single();

  if (dbUserError || !dbUser) {
    redirect("/login");
  }

  // Save to memory cache
  agencyIdCache.set(user.id, dbUser.agency_id);

  return { supabase, agencyId: dbUser.agency_id, userId: user.id };
}

// Clear user cache (useful on logout)
export function clearAgencyIdCache(userId: string) {
  agencyIdCache.delete(userId);
}
