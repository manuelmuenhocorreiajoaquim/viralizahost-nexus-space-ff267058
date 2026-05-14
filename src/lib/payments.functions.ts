// Server functions exposed to the client for the checkout / PIX flow.
// IMPORTANT: this file imports `client.server` indirectly via the MP client.
// Per TanStack rules it must contain ONLY createServerFn declarations + their
// imports — no plain helper exports — to keep client bundles clean.

import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getProvider } from "@/integrations/payments/mercadopago/client.server";
import { activateOrderAfterPayment } from "@/lib/payments-activation.server";

const OrderItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.string().min(1),
  price: z.number().finite().positive(),
  quantity: z.number().int().positive(),
  domain: z.string().optional().nullable(),
  total: z.number().finite().positive().optional(),
});

const CreateCheckoutOrderSchema = z.object({
  cycle: z.string().min(1),
  currency: z.literal("BRL"),
  subtotal: z.number().finite().nonnegative(),
  discount: z.number().finite().nonnegative(),
  total: z.number().finite().positive(),
  paymentMethod: z.enum(["pix", "card", "boleto"]),
  paymentProvider: z.literal("mercadopago"),
  customerEmail: z.string().email().optional(),
  customerName: z.string().max(160).optional(),
  items: z.array(OrderItemSchema).min(1),
});

export const createCheckoutOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => CreateCheckoutOrderSchema.parse(input))
  .handler(async ({ data }) => {
    const authHeader = getRequestHeader("authorization");
    let userId: string | null = null;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userRes, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && userRes?.user?.id) userId = userRes.user.id;
    }

    console.log("[checkout] creating order", {
      userId,
      customerEmail: data.customerEmail ?? null,
      total: data.total,
      items: data.items.length,
    });

    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId,
        status: "pending",
        cycle: data.cycle,
        currency: data.currency,
        subtotal: Number(data.subtotal.toFixed(2)),
        discount: Number(data.discount.toFixed(2)),
        total: Number(data.total.toFixed(2)),
        payment_method: data.paymentMethod,
        payment_provider: data.paymentProvider,
        notes: data.customerEmail
          ? `Cliente: ${data.customerName ?? ""} <${data.customerEmail}>`.trim()
          : null,
      })
      .select("id")
      .single();

    if (orderErr) {
      console.error("[checkout] order insert error", orderErr);
      throw new Error(orderErr.message);
    }
    if (!order?.id) throw new Error("Não foi possível criar o pedido.");

    const items = data.items.map((item) => {
      const quantity = Math.trunc(Number(item.quantity));
      const unitPrice = Number(Number(item.price).toFixed(2));
      const itemTotal = Number(Number(item.total ?? unitPrice * quantity).toFixed(2));
      const title = String(item.domain || item.name || item.id).trim();
      if (
        !title ||
        !Number.isInteger(quantity) ||
        quantity <= 0 ||
        !Number.isFinite(unitPrice) ||
        unitPrice <= 0 ||
        !Number.isFinite(itemTotal) ||
        itemTotal <= 0
      ) {
        console.error("[checkout] invalid order item", {
          item,
          title,
          quantity,
          unitPrice,
          itemTotal,
        });
        throw new Error("Item inválido no carrinho.");
      }
      return {
        order_id: order.id,
        product_id: item.id,
        product_type: item.type,
        product_name: title,
        cycle: data.cycle,
        unit_price: unitPrice,
        quantity,
        total: itemTotal,
        domain: item.domain ?? null,
        metadata: { billing: item.type === "domain" ? "annual" : "cycle" },
      };
    });

    const { error: itemsErr } = await supabaseAdmin.from("order_items").insert(items);
    if (itemsErr) {
      console.error("[checkout] order_items insert error", itemsErr);
      throw new Error(itemsErr.message);
    }

    console.log("[checkout] order created", { orderId: order.id });
    return { success: true, orderId: order.id };
  });

const CreatePixSchema = z.object({
  orderId: z.string().uuid(),
  customerEmail: z.string().email().optional(),
  description: z.string().min(1).max(255).optional(),
});

export const createPixPayment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => CreatePixSchema.parse(input))
  .handler(async ({ data }) => {
    // Reload order from DB and revalidate ownership + amount.
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("id, user_id, total, currency, status, payment_status")
      .eq("id", data.orderId)
      .maybeSingle();

    if (orderErr) {
      console.error("[pix] order lookup error", orderErr);
      throw new Error(orderErr.message);
    }
    if (!order) throw new Error("Pedido não encontrado");
    const { data: orderItems, error: itemsErr } = await supabaseAdmin
      .from("order_items")
      .select("product_name, product_type, unit_price, quantity, total, domain")
      .eq("order_id", order.id);
    if (itemsErr) {
      console.error("[pix] order items lookup error", itemsErr);
      throw new Error(itemsErr.message);
    }

    const mpItems = (orderItems ?? []).map((item) => {
      const title = String(item.domain || item.product_name || "")
        .trim()
        .slice(0, 120);
      const quantity = Math.max(1, Math.trunc(Number(item.quantity)));
      const unitPrice = Number(Number(item.unit_price).toFixed(2));
      const total = Number(Number(item.total).toFixed(2));
      if (
        !title ||
        !Number.isInteger(quantity) ||
        quantity <= 0 ||
        !Number.isFinite(unitPrice) ||
        unitPrice <= 0 ||
        !Number.isFinite(total) ||
        total <= 0
      ) {
        console.error("[pix] invalid MP item", { item, title, quantity, unitPrice, total });
        throw new Error("Item inválido no carrinho.");
      }
      return {
        title,
        quantity,
        unit_price: unitPrice,
        currency_id: "BRL" as const,
        description: item.product_type === "domain" ? `Registro anual do domínio ${title}` : title,
      };
    });
    if (mpItems.length === 0) throw new Error("Item inválido no carrinho.");
    const itemsAmount = Number(
      mpItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0).toFixed(2),
    );
    const orderAmount = Number(Number(order.total).toFixed(2));
    const amount = Number(
      (Number.isFinite(itemsAmount) && itemsAmount > 0 ? itemsAmount : orderAmount).toFixed(2),
    );
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("Valor do pedido inválido");
    if (Math.abs(amount - orderAmount) > 0.01) {
      console.warn("[pix] order total mismatch, syncing from items", {
        orderId: order.id,
        orderAmount,
        itemsAmount,
      });
      await supabaseAdmin.from("orders").update({ total: amount }).eq("id", order.id);
    }
    console.log("[pix] creating payment", {
      orderId: order.id,
      amount,
      itemCount: mpItems.length,
      items: mpItems,
      userId: order.user_id ?? null,
    });

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

    if (
      existing &&
      existing.qr_code &&
      existing.expires_at &&
      new Date(existing.expires_at) > new Date()
    ) {
      console.log("[pix] reusing existing pending payment", existing.id);
      return {
        success: true,
        paymentId: existing.id,
        providerPaymentId: existing.provider_payment_id,
        amount,
        qrCode: existing.qr_code,
        qrCodeBase64: existing.qr_code_base64 ?? "",
        copyPasteCode: existing.pix_copy_paste ?? existing.qr_code,
        pixCopyPaste: existing.pix_copy_paste ?? existing.qr_code,
        ticketUrl:
          (existing.raw_response as any)?.point_of_interaction?.transaction_data?.ticket_url ??
          null,
        expiresAt: existing.expires_at,
        status: existing.status,
      };
    }

    // Lookup user email for payer.
    let accountEmail: string | undefined;
    if (order.user_id) {
      const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(order.user_id);
      accountEmail = userRes?.user?.email ?? undefined;
    }
    const payerEmail = data.customerEmail ?? accountEmail ?? "cliente@viralizahost.com";

    const provider = getProvider();
    let pix;
    try {
      pix = await provider.createPixPayment({
        orderId: order.id,
        amount,
        currency: "BRL",
        payerEmail,
        description: data.description ?? `Pedido ViralizaHost ${order.id.slice(0, 8)}`,
        expiresInMinutes: 30,
        items: mpItems,
      });
    } catch (err: any) {
      console.error("[pix] provider error", {
        message: err?.message,
        status: err?.status,
        data: err?.data,
      });
      throw new Error(err?.message ?? "Falha ao gerar PIX no provedor");
    }
    console.log("[pix] provider response", {
      providerPaymentId: pix?.providerPaymentId,
      status: pix?.status,
      hasQr: !!pix?.qrCode,
      hasQrBase64: !!pix?.qrCodeBase64,
    });

    if (!pix || !pix.providerPaymentId) {
      throw new Error("Resposta inválida do provedor de pagamento");
    }

    const { data: payment, error: payErr } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: order.user_id ?? null,
        order_id: order.id,
        amount,
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

    if (payErr) {
      console.error("[pix] payment insert error", payErr);
      throw new Error(payErr.message);
    }
    if (!payment?.id) {
      throw new Error("Não foi possível registrar o pagamento");
    }

    await supabaseAdmin
      .from("orders")
      .update({ payment_status: "pending", payment_provider: "mercadopago", payment_method: "pix" })
      .eq("id", order.id);

    return {
      success: true,
      paymentId: payment.id,
      providerPaymentId: pix.providerPaymentId,
      amount,
      qrCode: pix.qrCode ?? "",
      qrCodeBase64: pix.qrCodeBase64 ?? "",
      copyPasteCode: pix.pixCopyPaste ?? "",
      pixCopyPaste: pix.pixCopyPaste ?? "",
      ticketUrl: (pix.raw as any)?.point_of_interaction?.transaction_data?.ticket_url ?? null,
      expiresAt: pix.expiresAt,
      status: pix.status,
    };
  });

const GetPaymentSchema = z.object({ paymentId: z.string().uuid() });

export const getPaymentStatus = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => GetPaymentSchema.parse(input))
  .handler(async ({ data }) => {
    const { data: payment, error } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("id", data.paymentId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!payment) throw new Error("Pagamento não encontrado");
    const authHeader = getRequestHeader("authorization");
    if (payment.user_id && authHeader?.startsWith("Bearer ")) {
      const { data: userRes } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));
      if (userRes?.user?.id && payment.user_id !== userRes.user.id)
        throw new Error("Acesso negado");
    }

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
        if (snap.status === "approved" && payment.order_id) {
          await activateOrderAfterPayment(payment.order_id);
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

/* ============================================================
 * Helper: load order + recompute amount + lookup payer email
 * ============================================================ */
async function loadOrderForCharge(orderId: string) {
  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select("id, user_id, total, currency, status, payment_status")
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!order) throw new Error("Pedido não encontrado");

  const { data: orderItems, error: itemsErr } = await supabaseAdmin
    .from("order_items")
    .select("product_name, unit_price, quantity, total, domain")
    .eq("order_id", order.id);
  if (itemsErr) throw new Error(itemsErr.message);

  const itemsAmount = Number(
    (orderItems ?? [])
      .reduce((s, it) => s + Number(it.unit_price) * Math.max(1, Math.trunc(Number(it.quantity))), 0)
      .toFixed(2),
  );
  const orderAmount = Number(Number(order.total).toFixed(2));
  const amount = Number(
    (Number.isFinite(itemsAmount) && itemsAmount > 0 ? itemsAmount : orderAmount).toFixed(2),
  );
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Valor do pedido inválido");

  let accountEmail: string | undefined;
  if (order.user_id) {
    const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(order.user_id);
    accountEmail = userRes?.user?.email ?? undefined;
  }
  return { order, amount, accountEmail };
}

/* ============================================================
 * Public publishable key (safe to expose to the browser)
 * ============================================================ */
export const getMercadoPagoPublicKey = createServerFn({ method: "GET" }).handler(async () => {
  const mode = (process.env.MP_MODE ?? "test").toLowerCase();
  const key =
    mode === "live" ? process.env.MP_PUBLIC_KEY_LIVE : process.env.MP_PUBLIC_KEY_TEST;
  if (!key) throw new Error("Mercado Pago public key not configured");
  return { publicKey: key, mode };
});

/* ============================================================
 * CARD
 * ============================================================ */
const CreateCardSchema = z.object({
  orderId: z.string().uuid(),
  cardToken: z.string().min(1),
  paymentMethodId: z.string().min(1),
  installments: z.number().int().min(1).max(24),
  issuerId: z.string().optional(),
  payerEmail: z.string().email(),
  payerName: z.string().min(2).max(160),
  identification: z.object({
    type: z.enum(["CPF", "CNPJ"]),
    number: z.string().min(8).max(20),
  }),
});

export const createCardPayment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => CreateCardSchema.parse(input))
  .handler(async ({ data }) => {
    const { order, amount, accountEmail } = await loadOrderForCharge(data.orderId);
    const payerEmail = data.payerEmail || accountEmail || "cliente@viralizahost.com";
    const provider = getProvider();
    const result = await provider.createCardPayment({
      orderId: order.id,
      amount,
      payerEmail,
      description: `Pedido ViralizaHost ${order.id.slice(0, 8)}`,
      cardToken: data.cardToken,
      paymentMethodId: data.paymentMethodId,
      installments: data.installments,
      issuerId: data.issuerId,
      payerName: data.payerName,
      identification: data.identification,
    });

    const { data: payment, error } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: order.user_id ?? null,
        order_id: order.id,
        amount,
        currency: "BRL",
        method: "card",
        provider: "mercadopago",
        provider_payment_id: result.providerPaymentId,
        status: result.status,
        raw_response: result.raw as any,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    await supabaseAdmin
      .from("orders")
      .update({
        payment_status: result.status === "approved" ? "approved" : "pending",
        status: result.status === "approved" ? "paid" : "pending",
        payment_provider: "mercadopago",
        payment_method: "card",
      })
      .eq("id", order.id);

    if (result.status === "approved") {
      await activateOrderAfterPayment(order.id);
    }

    return {
      success: true,
      paymentId: payment!.id,
      status: result.status,
      statusDetail: result.statusDetail ?? null,
    };
  });

/* ============================================================
 * BOLETO
 * ============================================================ */
const CreateBoletoSchema = z.object({
  orderId: z.string().uuid(),
  payerEmail: z.string().email(),
  payerFirstName: z.string().min(1).max(80),
  payerLastName: z.string().min(1).max(80),
  identification: z.object({
    type: z.enum(["CPF", "CNPJ"]),
    number: z.string().min(8).max(20),
  }),
});

export const createBoletoPayment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => CreateBoletoSchema.parse(input))
  .handler(async ({ data }) => {
    const { order, amount, accountEmail } = await loadOrderForCharge(data.orderId);
    const payerEmail = data.payerEmail || accountEmail || "cliente@viralizahost.com";

    // Reuse pending boleto if any
    const { data: existing } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("order_id", order.id)
      .eq("provider", "mercadopago")
      .eq("method", "boleto")
      .in("status", ["pending", "in_process"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing && existing.expires_at && new Date(existing.expires_at) > new Date()) {
      const raw = (existing.raw_response ?? {}) as Record<string, any>;
      return {
        success: true,
        paymentId: existing.id,
        ticketUrl: raw?.transaction_details?.external_resource_url ?? "",
        barcode: raw?.barcode?.content ?? "",
        amount,
        expiresAt: existing.expires_at,
        status: existing.status,
      };
    }

    const provider = getProvider();
    const result = await provider.createBoletoPayment({
      orderId: order.id,
      amount,
      payerEmail,
      description: `Pedido ViralizaHost ${order.id.slice(0, 8)}`,
      payerFirstName: data.payerFirstName,
      payerLastName: data.payerLastName,
      identification: data.identification,
    });

    const { data: payment, error } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: order.user_id ?? null,
        order_id: order.id,
        amount,
        currency: "BRL",
        method: "boleto",
        provider: "mercadopago",
        provider_payment_id: result.providerPaymentId,
        status: result.status,
        expires_at: result.expiresAt,
        raw_response: result.raw as any,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    await supabaseAdmin
      .from("orders")
      .update({
        payment_status: "pending",
        payment_provider: "mercadopago",
        payment_method: "boleto",
      })
      .eq("id", order.id);

    return {
      success: true,
      paymentId: payment!.id,
      ticketUrl: result.ticketUrl,
      barcode: result.barcode,
      amount,
      expiresAt: result.expiresAt,
      status: result.status,
    };
  });

