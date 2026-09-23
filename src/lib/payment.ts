import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// iyzico sandbox credentials
// Replace with live credentials when going to production
const IYZICO_API_KEY = "sandbox-api-key";
const IYZICO_SECRET_KEY = "sandbox-secret-key";
const IYZICO_BASE_URL = "https://sandbox-api.iyzipay.com";

export type PaymentForm = {
  orderId: string;
  total: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  items: { name: string; price: number; qty: number }[];
};

// Step 1: Initialize payment — returns a checkout form URL
export const initPayment = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orderId: z.string(),
      total: z.number(),
      customerName: z.string(),
      customerEmail: z.string().email(),
      customerPhone: z.string(),
      customerAddress: z.string(),
      items: z.array(
        z.object({ name: z.string(), price: z.number(), qty: z.number() }),
      ),
    }),
  )
  .handler(async ({ data }) => {
    // In sandbox mode, we simulate the iyzico payment flow
    // The real integration would POST to iyzico API and get a checkout form URL

    // For now, we create a simulated payment page URL
    const paymentUrl = `/payment/checkout?orderId=${data.orderId}&total=${data.total}`;

    return {
      success: true,
      paymentUrl,
      conversationId: `conv_${Date.now()}`,
    };
  });

// Step 2: Verify payment (simulated)
export const verifyPayment = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orderId: z.string(),
      paymentId: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    // In sandbox, always succeed
    return {
      success: true,
      status: "success",
      paymentId: data.paymentId,
    };
  });