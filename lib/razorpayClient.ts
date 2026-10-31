/**
 * Client-side Razorpay SDK loader and checkout helper.
 * Safely loads the Razorpay checkout script on demand and triggers the modal.
 *
 * Example in a React component:
 *   import { openRazorpayCheckout } from '@/lib/razorpayClient';
 *
 *   const handlePayment = async () => {
 *     await openRazorpayCheckout({
 *       orderId: 'order_xxx', // from your backend / API
 *       amount: 500,          // 500 INR
 *       name: 'MedaVida Healthcare',
 *       description: 'Consultation Fee',
 *       prefill: { email: 'user@example.com', contact: '9999999999' },
 *       onSuccess: (res) => console.log('Payment success:', res),
 *       onFailure: (err) => console.error('Payment failed/dismissed:', err),
 *     });
 *   };
 */

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayCheckoutOptions {
  orderId?: string;
  amount: number; // in INR
  currency?: string;
  name?: string;
  description?: string;
  image?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  themeColor?: string;
  onSuccess?: (response: RazorpaySuccessResponse) => void;
  onFailure?: (error: any) => void;
}

/**
 * Dynamically loads the Razorpay checkout.js script once into the document.
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error("Failed to load Razorpay checkout script.");
      resolve(false);
    };

    document.body.appendChild(script);
  });
}

/**
 * Opens the Razorpay payment modal with the given configuration.
 */
export async function openRazorpayCheckout(options: RazorpayCheckoutOptions): Promise<void> {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded || !window.Razorpay) {
    throw new Error("Razorpay SDK could not be loaded. Check your internet connection.");
  }

  const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";

  const config = {
    key: key || "rzp_test_placeholder",
    amount: Math.round(options.amount * 100), // in paise
    currency: options.currency || "INR",
    name: options.name || "MedaVida",
    description: options.description || "Payment Transaction",
    image: options.image || undefined,
    order_id: options.orderId || undefined,
    prefill: options.prefill || {},
    notes: options.notes || {},
    theme: {
      color: options.themeColor || "#714B67", // matches project purple theme
    },
    handler: function (response: RazorpaySuccessResponse) {
      if (options.onSuccess) {
        options.onSuccess(response);
      }
    },
    modal: {
      ondismiss: function () {
        if (options.onFailure) {
          options.onFailure({ message: "Checkout modal dismissed by user" });
        }
      },
    },
  };

  const rzp = new window.Razorpay(config);
  rzp.on("payment.failed", function (response: any) {
    if (options.onFailure) {
      options.onFailure(response.error);
    }
  });

  rzp.open();
}
