import { NextRequest, NextResponse } from "next/server";

/**
 * Stripe webhook — placeholder for when Stripe is wired up.
 * Configure your Stripe webhook to POST to /api/stripe/webhook
 * and set STRIPE_WEBHOOK_SECRET in env.
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ received: true, message: "Webhook secret not configured" }, { status: 200 });
  }
  // TODO: stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  // TODO: Handle subscription created/updated/deleted, payment_intent.succeeded, etc.
  return NextResponse.json({ received: true }, { status: 200 });
}
