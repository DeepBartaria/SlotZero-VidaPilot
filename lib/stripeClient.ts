import { loadStripe, Stripe as StripeClient } from "@stripe/stripe-js";

/**
 * Client-side Stripe helper using @stripe/stripe-js.
 * Lazy-loads the Stripe.js script only when needed to optimize bundle performance.
 *
 * Example in a React component:
 *   import { redirectToStripeCheckout } from '@/lib/stripeClient';
 *
 *   const handleCheckout = async () => {
 *     // Pass the sessionId returned from your API/server action
 *     await redirectToStripeCheckout(sessionId);
 *   };
 */

let stripePromise: Promise<StripeClient | null> | null = null;

export function getStripe(): Promise<StripeClient | null> {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  if (!publishableKey || publishableKey === "pk_test_placeholder") {
    console.warn(
      "[Stripe Client] Using placeholder publishable key. Add your NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in .env"
    );
  }

  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey || "");
  }

  return stripePromise;
}

/**
 * Redirects the user to a hosted Stripe Checkout page.
 * Supports direct session URL navigation or session ID.
 */
export async function redirectToStripeCheckout(checkoutUrlOrSessionId: string): Promise<void> {
  if (checkoutUrlOrSessionId.startsWith("http://") || checkoutUrlOrSessionId.startsWith("https://")) {
    window.location.href = checkoutUrlOrSessionId;
    return;
  }

  const stripe = await getStripe();
  if (!stripe) {
    throw new Error("Failed to load Stripe client library.");
  }

  if (typeof (stripe as any).redirectToCheckout === "function") {
    const { error } = await (stripe as any).redirectToCheckout({ sessionId: checkoutUrlOrSessionId });
    if (error) {
      throw new Error(error.message || "Failed to redirect to Stripe checkout.");
    }
  } else {
    window.location.href = `https://checkout.stripe.com/c/pay/${checkoutUrlOrSessionId}`;
  }
}
