import Razorpay from "razorpay";
import crypto from "crypto";

/**
 * Server-side Razorpay client instance.
 * Use this in Next.js Server Actions or Route Handlers (app/api/...).
 *
 * Example:
 *   import { razorpay, createRazorpayOrder, verifyRazorpaySignature } from '@/lib/razorpay';
 *   const order = await createRazorpayOrder({ amount: 500 }); // 500 INR
 */

const keyId = process.env.RAZORPAY_KEY_ID || "";
const keySecret = process.env.RAZORPAY_KEY_SECRET || "";

export const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

export interface CreateOrderParams {
  /** Amount in standard currency units (e.g. 500 for ₹500). Will be converted to paise automatically. */
  amount: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

/**
 * Helper to generate a new Razorpay Order.
 * Automatically converts currency amounts into paise (e.g. 100 INR = 10000 paise).
 */
export async function createRazorpayOrder({
  amount,
  currency = "INR",
  receipt = `rcpt_${Date.now()}`,
  notes = {},
}: CreateOrderParams) {
  if (!keyId || !keySecret || keyId === "rzp_test_placeholder") {
    console.warn(
      "[Razorpay] Using placeholder credentials. Update RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env"
    );
  }

  const options = {
    amount: Math.round(amount * 100), // Razorpay expects amount in smallest currency unit (paise)
    currency,
    receipt,
    notes,
  };

  return await razorpay.orders.create(options);
}

export interface VerifySignatureParams {
  orderId: string;
  paymentId: string;
  signature: string;
}

/**
 * Validates the authenticity of a Razorpay payment response.
 * Uses HMAC-SHA256 verification as required by Razorpay.
 */
export function verifyRazorpaySignature({
  orderId,
  paymentId,
  signature,
}: VerifySignatureParams): boolean {
  if (!keySecret || keySecret === "placeholder_secret") {
    console.warn(
      "[Razorpay] RAZORPAY_KEY_SECRET is not set or using placeholder."
    );
    return false;
  }

  const generatedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return generatedSignature === signature;
}
