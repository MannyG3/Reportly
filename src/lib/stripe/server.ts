import Stripe from "stripe";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-01-27.acpi",
});

/**
 * Create a Stripe customer and subscription for a new agency.
 * 
 * @param agencyId - Supabase agency ID
 * @param email - Agency email
 * @param agencyName - Agency name
 * @param plan - Subscription plan ("starter", "pro", "enterprise")
 * @returns Subscription data or error
 */
export async function createSubscriptionForAgency(
  agencyId: string,
  email: string,
  agencyName: string,
  plan: "starter" | "pro" | "enterprise" = "starter"
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient<Database>(
      supabaseUrl,
      supabaseServiceRoleKey
    );

    // 1. Create Stripe customer
    const customer = await stripe.customers.create({
      email,
      name: agencyName,
      metadata: {
        agency_id: agencyId,
      },
    });

    // 2. Get price ID for plan (you'll need to set these in Stripe)
    // For now, using placeholder - in production, fetch from Stripe API
    const priceIds: Record<string, string> = {
      starter:
        process.env.STRIPE_PRICE_ID_STARTER ||
        "price_starter_placeholder",
      pro: process.env.STRIPE_PRICE_ID_PRO || "price_pro_placeholder",
      enterprise:
        process.env.STRIPE_PRICE_ID_ENTERPRISE ||
        "price_enterprise_placeholder",
    };

    // 3. Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [
        {
          price: priceIds[plan],
        },
      ],
      metadata: {
        agency_id: agencyId,
        plan,
      },
      // Enable automatic tax calculation if configured
      automatic_tax: { enabled: true },
    });

    // 4. Save subscription to Supabase
    const { data: savedSubscription, error: saveError } = await supabase
      .from("subscriptions")
      .insert({
        agency_id: agencyId,
        stripe_customer_id: customer.id,
        stripe_subscription_id: subscription.id,
        plan,
        status: subscription.status as any,
        current_period_end: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
      })
      .select()
      .single();

    if (saveError) {
      throw new Error(`Failed to save subscription: ${saveError.message}`);
    }

    return {
      success: true,
      subscription: savedSubscription,
      stripeCustomerId: customer.id,
      stripeSubscriptionId: subscription.id,
    };
  } catch (error) {
    console.error("Failed to create subscription:", error);
    throw error;
  }
}

/**
 * Get subscription details for an agency
 */
export async function getSubscriptionForAgency(agencyId: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient<Database>(
      supabaseUrl,
      supabaseServiceRoleKey
    );

    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("agency_id", agencyId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch subscription: ${error.message}`);
    }

    return subscription;
  } catch (error) {
    console.error("Failed to get subscription:", error);
    throw error;
  }
}

/**
 * Update subscription plan
 */
export async function updateSubscriptionPlan(
  agencyId: string,
  newPlan: "starter" | "pro" | "enterprise"
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient<Database>(
      supabaseUrl,
      supabaseServiceRoleKey
    );

    // Get current subscription
    const { data: subscription, error: fetchError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("agency_id", agencyId)
      .single();

    if (fetchError || !subscription) {
      throw new Error("Subscription not found");
    }

    // Update Stripe subscription
    const priceIds: Record<string, string> = {
      starter:
        process.env.STRIPE_PRICE_ID_STARTER ||
        "price_starter_placeholder",
      pro: process.env.STRIPE_PRICE_ID_PRO || "price_pro_placeholder",
      enterprise:
        process.env.STRIPE_PRICE_ID_ENTERPRISE ||
        "price_enterprise_placeholder",
    };

    const updatedSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      {
        items: [
          {
            id: (subscription as any).stripe_subscription_item_id,
            price: priceIds[newPlan],
          },
        ],
        metadata: {
          plan: newPlan,
        },
      }
    );

    // Update DB
    const { data: updated, error: updateError } = await supabase
      .from("subscriptions")
      .update({
        plan: newPlan,
        status: updatedSubscription.status as any,
      })
      .eq("agency_id", agencyId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update subscription: ${updateError.message}`);
    }

    return updated;
  } catch (error) {
    console.error("Failed to update subscription plan:", error);
    throw error;
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(agencyId: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient<Database>(
      supabaseUrl,
      supabaseServiceRoleKey
    );

    const { data: subscription, error: fetchError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("agency_id", agencyId)
      .single();

    if (fetchError || !subscription) {
      throw new Error("Subscription not found");
    }

    // Cancel Stripe subscription
    await stripe.subscriptions.del(subscription.stripe_subscription_id);

    // Update DB
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        status: "canceled",
      })
      .eq("agency_id", agencyId);

    if (updateError) {
      throw new Error(`Failed to cancel subscription: ${updateError.message}`);
    }

    return true;
  } catch (error) {
    console.error("Failed to cancel subscription:", error);
    throw error;
  }
}
