// Mercado Pago webhook receiver.
// URL: https://project--e7e3a3ae-d8d9-4e43-b64c-f5f92cca6ccd.lovable.app/api/public/payments/mercadopago/webhook
//
// Configure in MP dashboard > Webhooks > Payments. Set the secret to
// MP_WEBHOOK_SECRET — MP signs every request with x-signature + x-request-id.

import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getProvider } from "@/integrations/payments/mercadopago/client.server";
import { activateOrderAfterPayment } from "@/lib/payments-activation.server";

function verifySignature(req: Request, dataId: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true; // not configured: skip (dev). Production should set it.
  const sigHeader = req.headers.get("x-signature");
  const requestId = req.headers.get("x-request-id");
  if (!sigHeader || !requestId) return false;

  // x-signature: "ts=1700000000,v1=abcdef..."
  const parts = Object.fromEntries(
    sigHeader.split(",").map((p) => {
      const [k, ...rest] = p.trim().split("=");
      return [k, rest.join("=")];
    }),
  );
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const hmac = createHmac("sha256", secret).update(manifest).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(v1, "hex"), Buffer.from(hmac, "hex"));
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/api/public/payments/mercadopago/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const bodyText = await request.text();
        let body: any = {};
        try {
          body = bodyText ? JSON.parse(bodyText) : {};
        } catch {
          body = {};
        }

        // MP sends the payment id either in body.data.id or query.data.id
        const paymentId =
          body?.data?.id?.toString() ??
          url.searchParams.get("data.id") ??
          url.searchParams.get("id");
        const topic =
          body?.type ?? body?.topic ?? url.searchParams.get("type") ?? url.searchParams.get("topic");

        if (!paymentId) {
          return new Response("Missing payment id", { status: 400 });
        }

        if (topic && topic !== "payment") {
          // Only handle payment events for now.
          return new Response("Ignored", { status: 200 });
        }

        if (!verifySignature(request, paymentId)) {
          console.warn("[mp-webhook] invalid signature for", paymentId);
          return new Response("Invalid signature", { status: 401 });
        }

        try {
          // Always re-fetch from MP — body is just a notification.
          const snap = await getProvider().getPaymentStatus(paymentId);

          // Locate our payment row by provider_payment_id
          const { data: paymentRow } = await supabaseAdmin
            .from("payments")
            .select("id, order_id, status")
            .eq("provider", "mercadopago")
            .eq("provider_payment_id", paymentId)
            .maybeSingle();

          if (!paymentRow) {
            console.warn("[mp-webhook] payment row not found for", paymentId);
            return new Response("OK", { status: 200 });
          }

          // Idempotent: skip if already in this state.
          if (paymentRow.status !== snap.status) {
            await supabaseAdmin
              .from("payments")
              .update({
                status: snap.status,
                paid_at: snap.paidAt ?? null,
                raw_response: snap.raw as any,
              })
              .eq("id", paymentRow.id);
          }

          if (snap.status === "approved" && paymentRow.order_id) {
            await activateOrderAfterPayment(paymentRow.order_id);
          } else if (
            (snap.status === "rejected" ||
              snap.status === "cancelled" ||
              snap.status === "expired") &&
            paymentRow.order_id
          ) {
            await supabaseAdmin
              .from("orders")
              .update({ payment_status: snap.status })
              .eq("id", paymentRow.order_id);
          }

          return new Response("OK", { status: 200 });
        } catch (e: any) {
          console.error("[mp-webhook] handler error", e);
          // 200 to avoid endless retries on persistent errors after we logged.
          return new Response("OK", { status: 200 });
        }
      },
      GET: async () => new Response("OK", { status: 200 }),
    },
  },
});
