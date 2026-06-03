// Activation logic invoked by the Mercado Pago webhook AFTER a payment is
// approved. Marks the order as paid and triggers cPanel provisioning for any
// hosting items. Server-only (uses service role).

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { enqueueHostingerProvisioning } from "@/lib/provisioning.server";
import { DOMAIN_ORDER_STATUS } from "@/config/domainFixedPrices";

async function createDomainOrdersForPaidOrder(orderId: string) {
  // Pull domain items + customer email; insert one domain_orders row per
  // domain item, idempotent via existing row check.
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, user_id, currency, total")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return;

  const { data: items } = await supabaseAdmin
    .from("order_items")
    .select("id, product_name, product_type, unit_price, total, domain, metadata")
    .eq("order_id", orderId)
    .eq("product_type", "domain");
  if (!items?.length) return;

  let customerEmail: string | null = null;
  if (order.user_id) {
    const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(order.user_id);
    customerEmail = userRes?.user?.email ?? null;
  }

  for (const item of items) {
    const domain = String(item.domain || item.product_name || "").toLowerCase().trim();
    if (!domain) continue;
    const ext = domain.match(/\.[^.]+(\.[^.]+)?$/)?.[0] ?? "";
    const { data: existing } = await supabaseAdmin
      .from("domain_orders")
      .select("id")
      .eq("order_id", orderId)
      .eq("domain_name", domain)
      .maybeSingle();
    if (existing?.id) continue;
    await supabaseAdmin.from("domain_orders").insert({
      order_id: orderId,
      user_id: order.user_id ?? null,
      customer_email: customerEmail,
      domain_name: domain,
      extension: ext,
      price: Number(item.total ?? item.unit_price ?? 0),
      currency: order.currency ?? "BRL",
      provider: "hostinger_manual",
      status: DOMAIN_ORDER_STATUS.PENDING_ACTIVATION,
      metadata: (item.metadata as Record<string, unknown>) ?? {},
    });
  }
}

export async function activateOrderAfterPayment(orderId: string) {
  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select("id, user_id, status, payment_status, provisioned")
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!order) {
    console.warn("[activation] order not found", orderId);
    return;
  }

  await supabaseAdmin
    .from("orders")
    .update({ status: "paid", payment_status: "approved" })
    .eq("id", orderId);

  // Domain orders go to manual activation queue regardless of provisioning state.
  try {
    await createDomainOrdersForPaidOrder(orderId);
  } catch (e) {
    console.error("[activation] domain_orders insert error", e);
  }

  // Idempotent: if already provisioned, skip.
  if (order.provisioned) return;

  // Fire cPanel provisioning Edge Function (best effort; webhook already 200s).
  try {
    const url = `${process.env.SUPABASE_URL}/functions/v1/create-cpanel-account`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ order_id: orderId }),
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error("[activation] create-cpanel-account failed", res.status, txt);
    }
  } catch (e) {
    console.error("[activation] cPanel provisioning error", e);
  }

  // Hostinger provisioning queue — runs in addition to cPanel.
  // Only items mapped in `provider_products` are processed; everything else
  // is a no-op so the existing WHM flow remains untouched.
  try {
    await enqueueHostingerProvisioning(orderId);
  } catch (e) {
    console.error("[activation] hostinger provisioning error", e);
  }
}
