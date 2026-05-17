// Server functions for the Hostinger provisioning admin & client UIs.
// Thin file: only createServerFn declarations + imports (per TanStack rules).

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { hostinger } from "@/integrations/hostinger/client.server";
import {
  enqueueHostingerProvisioning,
  processProvisioningJob,
} from "@/lib/provisioning.server";

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden: admin only");
}

// ---- Client-side: list my own provisioning jobs ----

export const listMyProvisioningJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin
      .from("provisioning_jobs")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return { jobs: data ?? [] };
  });

// ---- Admin: provisioning queue ----

export const adminListProvisioningJobs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ status: z.string().optional() })
      .default({})
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    let q = supabaseAdmin
      .from("provisioning_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { jobs: rows ?? [] };
  });

export const adminRetryProvisioning = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ jobId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const res = await processProvisioningJob(data.jobId);
    return res;
  });

export const adminMarkProvisioned = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        jobId: z.string().uuid(),
        providerResourceId: z.string().min(1).max(200).optional(),
        note: z.string().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("provisioning_jobs")
      .update({
        status: "provisioned",
        provider_resource_id: data.providerResourceId ?? null,
        error_message: data.note ?? null,
      })
      .eq("id", data.jobId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminRunQueueForOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ orderId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    return enqueueHostingerProvisioning(data.orderId);
  });

export const adminGetJobLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ jobId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: logs } = await supabaseAdmin
      .from("hostinger_logs")
      .select("*")
      .eq("job_id", data.jobId)
      .order("created_at", { ascending: false })
      .limit(50);
    return { logs: logs ?? [] };
  });

// ---- Admin: provider_products CRUD ----

const ProviderProductInput = z.object({
  id: z.string().uuid().optional(),
  internal_product_id: z.string().min(1).max(120),
  internal_product_name: z.string().min(1).max(200),
  provider: z.string().min(1).max(60).default("hostinger"),
  provider_service_type: z.enum([
    "vps",
    "domain",
    "hosting",
    "email",
    "email_marketing",
    "builder",
    "vibecode",
  ]),
  provider_price_id: z.string().max(200).nullable().optional(),
  provider_metadata: z.record(z.string(), z.any()).default({}),
  auto_provision: z.boolean().default(false),
  internal_price: z.number().finite().nonnegative().default(0),
  currency: z.string().min(1).max(8).default("BRL"),
  active: z.boolean().default(true),
  notes: z.string().max(500).optional().nullable(),
});

export const adminListProviderProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("provider_products")
      .select("*")
      .order("internal_product_name", { ascending: true });
    if (error) throw new Error(error.message);
    return { products: data ?? [] };
  });

export const adminUpsertProviderProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ProviderProductInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const payload = { ...data };
    if (payload.id) {
      const { id, ...rest } = payload;
      const { error } = await supabaseAdmin
        .from("provider_products")
        .update(rest)
        .eq("id", id);
      if (error) throw new Error(error.message);
      return { ok: true, id };
    }
    const { data: row, error } = await supabaseAdmin
      .from("provider_products")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row.id };
  });

export const adminDeleteProviderProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("provider_products")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Admin: probe Hostinger catalog (live API call) ----

export const adminHostingerCatalog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const res = await hostinger.listCatalog();
    return res;
  });
