import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function Home() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    redirect(user ? "/dashboard" : "/login");
  } catch {
    // If server env vars are not configured yet, keep the app accessible.
    redirect("/login");
  }
}
