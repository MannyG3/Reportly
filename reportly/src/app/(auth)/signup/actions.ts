"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSubscriptionForAgency } from "@/lib/stripe/server";

/**
 * Server action to complete signup with Stripe subscription
 */
export async function completeSignup(
  agencyId: string,
  email: string,
  agencyName: string
) {
  try {
    // Create Stripe subscription for the new agency
    const result = await createSubscriptionForAgency(
      agencyId,
      email,
      agencyName,
      "starter" // Start with starter plan
    );

    return {
      success: true,
      result,
    };
  } catch (error) {
    console.error("Signup completion failed:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to complete signup",
    };
  }
}
