// Server functions exposed to the client for the checkout / PIX flow.
// IMPORTANT: this file imports `client.server` indirectly via the MP client.
// Per TanStack rules it must contain ONLY createServerFn declarations + their
// imports — no plain helper exports — to keep client bundles clean.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getProvider } from "@/integrations/payments/mercadopago/client.server";

const CreatePixSchema = z.object({
  orderId: z.string().uuid(),
});

export const createPixPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreatePixSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    // Reload order from DB and revalidate ownership + amount.
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("id, user_id, total, currency, status, payment_status")
      .eq("id", data.orderId)
      .maybeSingle();

    if (orderErr) throw new Error(orderErr.message);
    if (!order) throw new Error("Pedido não encontrado");
    if (order.user_id !== userId) throw new Error("Pedido não pertence a este usuário");
    if (Number(order.total) <= 0) throw new Error("Valor do pedido inválido");

    // If a pending PIX already exists for this order, reuse it (avoids
    // duplicate charges if the user retries).
    const { data: existing } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("order_id", order.id)
      .eq("provider", "mercadopago")
      .eq("method", "pix")
      .in("status", ["pending", "in_process"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing && existing.qr_code && existing.expires_at && new Date(existing.expires_at) > new Date()) {
      return {
        paymentId: existing.id,
        providerPaymentId: existing.provider_payment_id,
        amount: Number(order.total),
        qrCode: existing.qr_code,
        qrCodeBase64: existing.qr_code_base64,
        pixCopyPaste: existing.pix_copy_paste,
        expiresAt: existing.expires_at,
        status: existing.status,
      };
    }

    // Lookup user email for payer.
    const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(userId);
    const payerEmail = userRes?.user?.email ?? "no-reply@viralizahost.com";

    const provider = getProvider();
    const pix = await provider.createPixPayment({
      orderId: order.id,
      amount: Number(order.total),
      currency: "BRL",
      payerEmail,
      description: `Pedido ViralizaHost ${order.id.slice(0, 8)}`,
      expiresInMinutes: 30,
    });

    const { data: payment, error: payErr } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: userId,
        order_id: order.id,
        amount: Number(order.total),
        currency: "BRL",
        method: "pix",
        provider: "mercadopago",
        provider_payment_id: pix.providerPaymentId,
        status: pix.status,
        qr_code: pix.qrCode,
        qr_code_base64: pix.qrCodeBase64,
        pix_copy_paste: pix.pixCopyPaste,
        expires_at: pix.expiresAt,
        raw_response: pix.raw as any,
      })
      .select()
      .single();

    if (payErr) throw new Error(payErr.message);

    await supabaseAdmin
      .from("orders")
      .update({ payment_status: "pending", payment_provider: "mercadopago", payment_method: "pix" })
      .eq("id", order.id);

    return {
      paymentId: payment.id,
      providerPaymentId: pix.providerPaymentId,
      amount: Number(order.total),
      qrCode: pix.qrCode,
      qrCodeBase64: pix.qrCodeBase64,
      pixCopyPaste: pix.pixCopyPaste,
      expiresAt: pix.expiresAt,
      status: pix.status,
    };
  });

const GetPaymentSchema = z.object({ paymentId: z.string().uuid() });

export const getPaymentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GetPaymentSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: payment, error } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("id", data.paymentId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!payment) throw new Error("Pagamento não encontrado");
    if (payment.user_id !== userId) throw new Error("Acesso negado");

    // If still pending, ask MP for the latest snapshot to short-circuit
    // webhook latency (the webhook is still authoritative).
    if (
      payment.provider === "mercadopago" &&
      payment.provider_payment_id &&
      ["pending", "in_process"].includes(payment.status)
    ) {
      try {
        const snap = await getProvider().getPaymentStatus(payment.provider_payment_id);
        if (snap.status !== payment.status) {
          await supabaseAdmin
            .from("payments")
            .update({
              status: snap.status,
              paid_at: snap.paidAt ?? payment.paid_at,
              raw_response: snap.raw as any,
            })
            .eq("id", payment.id);
          payment.status = snap.status;
          payment.paid_at = snap.paidAt ?? payment.paid_at;
        }
      } catch (e) {
        console.error("[payments] poll MP failed", e);
      }
    }

    return {
      id: payment.id,
      status: payment.status,
      paidAt: payment.paid_at,
      orderId: payment.order_id,
    };
  });
