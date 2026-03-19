import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-01-27.acpi",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

/**
 * POST /api/webhooks
 * Handle Stripe webhook events for subscription management.
 * 
 * Events handled:
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.payment_succeeded
 * - invoice.payment_failed
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 403 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("Missing Supabase configuration");
    return NextResponse.json(
      { error: "Server misconfiguration" },
      { status: 500 }
    );
  }

  const supabase = createClient<Database>(
    supabaseUrl,
    supabaseServiceRoleKey
  );

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find agency by Stripe customer ID
        const { data: agency, error: agencyError } = await supabase
          .from("subscriptions")
          .select("agency_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (!agency) {
          // First time seeing this customer, might be from customer.subscription.created
          // The subscription will be linked via agency creation
          console.warn(`Agency not found for customer ${customerId}`);
        } else {
          // Get plan from metadata or price
          const plan = (subscription.metadata?.plan as
            | "starter"
            | "pro"
            | "enterprise") || "starter";

          const currentPeriodEnd = subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null;

          const { error: updateError } = await supabase
            .from("subscriptions")
            .update({
              stripe_subscription_id: subscription.id,
              plan,
              status: subscription.status as any,
              current_period_end: currentPeriodEnd,
            })
            .eq("agency_id", agency.agency_id);

          if (updateError) {
            console.error("Failed to update subscription:", updateError);
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Mark subscription as canceled
        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
          })
          .eq("stripe_customer_id", customerId);

        if (updateError) {
          console.error("Failed to cancel subscription:", updateError);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Find subscription and update status
        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({
            status: "active",
          })
          .eq("stripe_customer_id", customerId);

        if (updateError) {
          console.error("Failed to update subscription status:", updateError);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Mark subscription as past_due
        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({
            status: "past_due",
          })
          .eq("stripe_customer_id", customerId);

        if (updateError) {
          console.error("Failed to update subscription status:", updateError);
        }
        break;
      }

      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
