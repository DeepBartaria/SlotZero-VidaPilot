import Stripe from "stripe";

/**
 * Server-side Stripe client instance for test and production environments.
 * Use this in Next.js Server Actions or Route Handlers (app/api/...).
 *
 * Example:
 *   import { stripe, createStripeCheckoutSession } from '@/lib/stripe';
 *   const session = await createStripeCheckoutSession({ ... });
 */

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";

export const stripe = new Stripe(stripeSecretKey, {
  typescript: true,
});

export interface CheckoutSessionParams {
  items: Array<{
    name: string;
    description?: string;
    amount: number; // in standard currency units (e.g. 50 for $50)
    quantity?: number;
    images?: string[];
  }>;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  currency?: string;
  metadata?: Record<string, string>;
}

/**
 * Creates a Stripe Checkout Session for hosted checkout pages.
 */
export async function createStripeCheckoutSession({
  items,
  customerEmail,
  successUrl,
  cancelUrl,
  currency = "usd",
  metadata = {},
}: CheckoutSessionParams) {
  if (!stripeSecretKey || stripeSecretKey === "sk_test_placeholder") {
    console.warn(
      "[Stripe] Using placeholder secret key. Replace STRIPE_SECRET_KEY in .env with your key from https://dashboard.stripe.com/test/apikeys"
    );
  }

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item) => ({
    price_data: {
      currency: currency.toLowerCase(),
      product_data: {
        name: item.name,
        description: item.description,
        images: item.images,
      },
      unit_amount: Math.round(item.amount * 100), // convert to cents / smallest unit
    },
    quantity: item.quantity ?? 1,
  }));

  return await stripe.checkout.sessions.create({
    line_items,
    mode: "payment",
    customer_email: customerEmail,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
  });
}

export interface PaymentIntentParams {
  amount: number; // in standard units
  currency?: string;
  metadata?: Record<string, string>;
}

/**
 * Creates a Stripe PaymentIntent for custom element checkout flows.
 */
export async function createStripePaymentIntent({
  amount,
  currency = "usd",
  metadata = {},
}: PaymentIntentParams) {
  return await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: currency.toLowerCase(),
    automatic_payment_methods: { enabled: true },
    metadata,
  });
}

/**
 * Verifies and constructs a Stripe Webhook Event from raw request body.
 */
export function constructStripeWebhookEvent(
  rawBody: string | Buffer,
  signature: string,
  secret?: string
): Stripe.Event {
  const webhookSecret = secret || process.env.STRIPE_WEBHOOK_SECRET || "";
  return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
}
