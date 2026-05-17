// Provisioning queue logic — server-only.
//
// For each paid order we:
//  1. fetch its order_items
//  2. look up provider_products mapping by internal_product_id
//  3. create a provisioning_jobs row (status=pending)
//  4. if mapping has auto_provision=true → try to provision now via Hostinger
//     API; otherwise leave it as manual_review so admin can act on it.
//
// This module is INDEPENDENT of the existing cPanel/WHM flow — the webhook
// continues to call `create-cpanel-account` exactly as before. Hostinger
// provisioning runs in addition to it.

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { hostinger } from "@/integrations/hostinger/client.server";

type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_type: string;
  quantity: number;
  domain: string | null;
  metadata: any;
};

type ProviderProductRow = {
  id: string;
  internal_product_id: string;
  provider: string;
  provider_service_type: string;
  provider_price_id: string | null;
  provider_metadata: any;
  auto_provision: boolean;
  active: boolean;
};

export async function enqueueHostingerProvisioning(orderId: string) {
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, user_id, status, payment_status")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return { ok: false, reason: "order_not_found" };
  if (order.status !== "paid") return { ok: false, reason: "order_not_paid" };

  const { data: items } = await supabaseAdmin
    .from("order_items")
    .select("id, order_id, product_id, product_name, product_type, quantity, domain, metadata")
    .eq("order_id", orderId);

  if (!items || items.length === 0) return { ok: true, jobs: [] };

  // Look up active mappings in one round-trip.
  const productIds = Array.from(new Set(items.map((it) => it.product_id)));
  const { data: mappings } = await supabaseAdmin
    .from("provider_products")
    .select("*")
    .eq("provider", "hostinger")
    .eq("active", true)
    .in("internal_product_id", productIds);

  const byId = new Map<string, ProviderProductRow>();
  for (const m of mappings ?? []) byId.set(m.internal_product_id, m as any);

  const createdJobs: string[] = [];

  for (const item of items as OrderItemRow[]) {
    const mapping = byId.get(item.product_id);
    if (!mapping) continue; // not mapped to Hostinger → skip (e.g. WHM/cPanel handled it)

    // Idempotency: don't create a duplicate job for the same order_item.
    const { data: existing } = await supabaseAdmin
      .from("provisioning_jobs")
      .select("id")
      .eq("order_item_id", item.id)
      .eq("provider", "hostinger")
      .maybeSingle();
    if (existing?.id) {
      createdJobs.push(existing.id);
      continue;
    }

    const initialStatus = mapping.auto_provision ? "pending" : "manual_review";

    const { data: job, error: jobErr } = await supabaseAdmin
      .from("provisioning_jobs")
      .insert({
        order_id: orderId,
        order_item_id: item.id,
        user_id: order.user_id,
        provider: "hostinger",
        provider_service_type: mapping.provider_service_type,
        provider_product_id: mapping.id,
        status: initialStatus,
        provider_request: {
          item_id: mapping.provider_price_id,
          quantity: item.quantity,
          domain: item.domain,
          metadata: item.metadata ?? {},
        },
      })
      .select("id")
      .single();
    if (jobErr || !job) {
      console.error("[provisioning] failed to create job", jobErr);
      continue;
    }

    createdJobs.push(job.id);

    if (mapping.auto_provision) {
      // Fire-and-await per item — total order processing is short.
      await processProvisioningJob(job.id);
    }
  }

  return { ok: true, jobs: createdJobs };
}

export async function processProvisioningJob(jobId: string) {
  const { data: job } = await supabaseAdmin
    .from("provisioning_jobs")
    .select("*")
    .eq("id", jobId)
    .maybeSingle();
  if (!job) return { ok: false, error: "job_not_found" };
  if (job.status === "provisioned") return { ok: true, alreadyDone: true };

  await supabaseAdmin
    .from("provisioning_jobs")
    .update({
      status: "processing",
      attempts: (job.attempts ?? 0) + 1,
      last_attempt_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  const req: any = job.provider_request ?? {};
  const itemId: string | null = req.item_id ?? null;
  const quantity: number = Number(req.quantity ?? 1);
  const domain: string | null = req.domain ?? null;

  let result: { ok: boolean; status: number; data: any; error?: string };

  try {
    switch (job.provider_service_type) {
      case "vps": {
        if (!itemId) throw new Error("Mapping missing provider_price_id (item_id)");
        // Best-effort: Hostinger requires more params (template, datacenter, hostname).
        // Pass metadata from the mapping as overrides.
        result = await hostinger.createVps(
          { item_id: itemId, ...(req.metadata?.vps ?? {}) },
          jobId,
        );
        break;
      }
      case "domain": {
        if (!domain) throw new Error("Missing domain name in order item");
        if (!itemId) throw new Error("Mapping missing provider_price_id (item_id)");
        result = await hostinger.buyDomain(
          { item_id: itemId, domain, ...(req.metadata?.domain ?? {}) },
          jobId,
        );
        break;
      }
      default: {
        // Hosting / email / builder / vibecode etc. — no public purchase API.
        await supabaseAdmin
          .from("provisioning_jobs")
          .update({
            status: "manual_review",
            error_message: "No public Hostinger endpoint for this service type",
          })
          .eq("id", jobId);
        return { ok: false, error: "manual_review_required" };
      }
    }
  } catch (e: any) {
    await supabaseAdmin
      .from("provisioning_jobs")
      .update({
        status: "failed",
        error_message: e?.message ?? "Unexpected error",
      })
      .eq("id", jobId);
    return { ok: false, error: e?.message };
  }

  if (!result.ok) {
    await supabaseAdmin
      .from("provisioning_jobs")
      .update({
        status: "failed",
        provider_response: result.data ?? {},
        error_message: result.error ?? `HTTP ${result.status}`,
      })
      .eq("id", jobId);
    return { ok: false, error: result.error };
  }

  const resourceId: string | null =
    result.data?.id?.toString?.() ??
    result.data?.data?.id?.toString?.() ??
    result.data?.resource?.id?.toString?.() ??
    null;

  await supabaseAdmin
    .from("provisioning_jobs")
    .update({
      status: "provisioned",
      provider_response: result.data ?? {},
      provider_resource_id: resourceId,
    })
    .eq("id", jobId);

  // Best-effort: create/refresh a row in `services` so the client panel
  // surfaces the active item.
  try {
    if (job.user_id) {
      await supabaseAdmin.from("services").insert({
        user_id: job.user_id,
        type: String(job.provider_service_type),
        name: `${String(job.provider_service_type)} (Hostinger)`,
        status: "active",
        provisioning_job_id: jobId,
      });
    }
  } catch (e) {
    console.warn("[provisioning] could not insert service row", e);
  }

  return { ok: true };
}
