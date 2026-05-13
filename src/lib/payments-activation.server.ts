// Activation logic invoked by the Mercado Pago webhook AFTER a payment is
// approved. Marks the order as paid and triggers cPanel provisioning for any
// hosting items. Server-only (uses service role).

import { supabaseAdmin } from "@/integrations/supabase/client.server";

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
}
