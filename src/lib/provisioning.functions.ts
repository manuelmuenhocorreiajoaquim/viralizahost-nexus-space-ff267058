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
  fetchHostingerVpsCatalog,
  syncHostingerVpsCatalogToProviderProducts,
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
    if (/^vps-[1-4]$/.test(data.internal_product_id)) {
      throw new Error("Use apenas os slugs oficiais vps-nvme-1 a vps-nvme-4.");
    }
    if (data.provider_service_type === "vps") {
      const catalog = await fetchHostingerVpsCatalog();
      const valid = catalog.some((c) => c.item_id === data.provider_price_id);
      if (!data.provider_price_id || !valid) {
        throw new Error("VPS só pode ser salvo com item_id real retornado pelo catálogo Hostinger.");
      }
    }
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
    const res = await hostinger.listVps();
    return res;
  });

// ---- Admin: real VPS catalog from Hostinger billing API ----

export const adminListHostingerVpsCatalog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const items = await fetchHostingerVpsCatalog();
    return { items };
  });

export const adminSyncHostingerVpsCatalog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    return syncHostingerVpsCatalogToProviderProducts();
  });

// Upsert a provider_products row from a real catalog entry. The price markup
// (default 2x = 100% profit) is applied to the Hostinger price.
export const adminMapCatalogItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        item_id: z.string().min(1).max(200),
        internal_product_id: z.string().min(1).max(120),
        internal_product_name: z.string().min(1).max(200),
        internal_price: z.number().finite().nonnegative(),
        currency: z.string().min(1).max(8).default("BRL"),
        auto_provision: z.boolean().default(true),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    // Validate item_id against the live catalog.
    const catalog = await fetchHostingerVpsCatalog();
    const entry = catalog.find((c) => c.item_id === data.item_id);
    if (!entry) throw new Error(`item_id "${data.item_id}" não encontrado no catálogo Hostinger`);

    // Upsert by internal_product_id
    const { data: existing } = await supabaseAdmin
      .from("provider_products")
      .select("id")
      .eq("internal_product_id", data.internal_product_id)
      .eq("provider", "hostinger")
      .maybeSingle();

    const payload = {
      internal_product_id: data.internal_product_id,
      internal_product_name: data.internal_product_name,
      provider: "hostinger",
      provider_service_type: "vps",
      provider_price_id: data.item_id,
      provider_metadata: { catalog: entry.raw ?? null, hostinger_name: entry.name },
      auto_provision: data.auto_provision,
      internal_price: data.internal_price,
      currency: data.currency,
      active: true,
    };

    if (existing?.id) {
      const { error } = await supabaseAdmin
        .from("provider_products")
        .update(payload)
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { ok: true, id: existing.id, updated: true };
    }
    const { data: row, error } = await supabaseAdmin
      .from("provider_products")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row.id, updated: false };
  });


// ---- Admin: dedicated connection test (GET /api/vps/v1/virtual-machines) ----

export const adminTestHostingerConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const token = process.env.HOSTINGER_API_TOKEN;
    const tokenPresent = !!token && token.trim().length > 0;
    console.log("[hostinger-test] token_exists", tokenPresent);

    const res = await hostinger.call("/api/vps/v1/virtual-machines", { timeoutMs: 15_000 });
    console.log("[hostinger-test] response_status", res.status);

    let kind:
      | "ok"
      | "unauthorized"
      | "forbidden"
      | "timeout"
      | "http_error"
      | "network_error"
      | "missing_token" = "ok";
    let message = "API Hostinger conectada com sucesso.";
    if (!res.ok) {
      if (!tokenPresent) { kind = "missing_token"; message = "HOSTINGER_API_TOKEN não está configurado nos Secrets."; }
      else if (res.status === 401) { kind = "unauthorized"; message = "Token inválido ou Bearer malformado (401)."; }
      else if (res.status === 403) { kind = "forbidden"; message = "Acesso proibido (403). Verifique escopos do token."; }
      else if (res.status === 0 && res.error?.toLowerCase().includes("timeout")) { kind = "timeout"; message = "Timeout ao contactar a API Hostinger."; }
      else if (res.status === 0) { kind = "network_error"; message = res.error ?? "Falha de rede ao contactar a Hostinger."; }
      else { kind = "http_error"; message = `Erro HTTP ${res.status}: ${res.error ?? "sem detalhes"}`; }
    }

    return {
      ok: res.ok,
      status: res.status,
      kind,
      message,
      sample: res.ok ? (Array.isArray(res.data) ? `${res.data.length} VPS encontradas` : "resposta recebida") : null,
      details: res.ok ? null : res.data,
    };
  });
