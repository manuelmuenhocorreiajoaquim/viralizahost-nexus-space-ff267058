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
  fetchHostingerDomainCatalog,
  syncHostingerDomainCatalogToProviderProducts,
  tldOfDomain,
} from "@/lib/provisioning.server";
import { applyDomainMargin, getDomainMarginPercent } from "@/config/domainMargins";
import { getDomainPriceBRL, getDomainTotalBRL } from "@/config/domainFixedPrices";

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
    if (/^vps-[1-4]$/.test(data.internal_product_id)) {
      throw new Error("Mapeamento legado bloqueado. Use vps-nvme-1 a vps-nvme-4.");
    }
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

// ---- Admin: Hostinger DOMAIN catalog ----

export const adminListHostingerDomainCatalog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const items = await fetchHostingerDomainCatalog();
    return { items };
  });

export const adminSyncHostingerDomainCatalog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    return syncHostingerDomainCatalogToProviderProducts();
  });

export const adminMapDomainCatalogItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        item_id: z.string().min(1).max(200),
        tld: z.string().min(2).max(20),
        internal_price: z.number().finite().nonnegative(),
        currency: z.string().min(1).max(8).default("BRL"),
        auto_provision: z.boolean().default(true),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const catalog = await fetchHostingerDomainCatalog();
    const entry = catalog.find((c) => c.item_id === data.item_id);
    if (!entry) throw new Error(`item_id "${data.item_id}" não encontrado no catálogo de domínios da Hostinger`);
    const slug = `tld:${data.tld.startsWith(".") ? data.tld : "." + data.tld}`;
    const { data: existing } = await supabaseAdmin
      .from("provider_products")
      .select("id")
      .eq("internal_product_id", slug)
      .eq("provider", "hostinger")
      .maybeSingle();
    const payload = {
      internal_product_id: slug,
      internal_product_name: `Domínio ${data.tld}`,
      provider: "hostinger",
      provider_service_type: "domain",
      provider_price_id: data.item_id,
      provider_metadata: { tld: data.tld, hostinger_name: entry.name, catalog: entry.raw ?? null },
      auto_provision: data.auto_provision,
      internal_price: data.internal_price,
      currency: data.currency,
      active: true,
    };
    if (existing?.id) {
      const { error } = await supabaseAdmin.from("provider_products").update(payload).eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { ok: true, id: existing.id, updated: true };
    }
    const { data: row, error } = await supabaseAdmin.from("provider_products").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row.id, updated: false };
  });

// ---- Public-ish: domain availability via Hostinger (with markup) ----

const DomainSearchSchema = z.object({
  query: z.string().min(1).max(63),
});

type DomainPeriod = 1 | 2 | 3;
type DomainTier = {
  years: DomainPeriod;
  price_hostinger: number | null;
  renewal_price: number | null;
  promotional_price: number | null;
  icann_fee: number | null;
  whois_price: number | null;
  margin_percent: number;
  price_final: number | null; // null => preço indisponível
  item_id: string | null;
  unavailable: boolean;
};
type DomainPricing = Record<"1y" | "2y" | "3y", DomainTier>;

type DomainHit = {
  domain: string;
  ext: string;
  priceBRL: number;          // backward-compat: 1y final price (0 quando indisponível)
  price_hostinger: number | null;
  margin_percent: number;
  available: boolean;
  status: "available" | "taken" | "suggestion";
  source: string;
  suggested?: boolean;
  pricing: DomainPricing;
};

const DOMAIN_TLDS = [".com", ".com.br", ".net", ".org", ".ao", ".co.ao", ".online", ".shop", ".store", ".site", ".blog"] as const;
const CLIENT_DOMAIN_ERROR = "Não foi possível consultar agora. Tente novamente.";
const round2 = (n: number) => Math.round(n * 100) / 100;

function parseHostingerAvailability(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const v = value.toLowerCase().trim();
    return ["available", "true", "yes", "1"].includes(v);
  }
  return false;
}

/**
 * Calcula preço final ViralizaHost = Hostinger + margem dinâmica por TLD,
 * garantindo SEMPRE que final >= provider. Nunca retorna valor inventado.
 */
function normalizeDomainQuery(input: string) {
  const clean = input
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .replace(/[^a-z0-9.-]/g, "")
    .replace(/^-+|-+$/g, "");
  const requestedTld = tldOfDomain(clean);
  const base = (requestedTld ? clean.slice(0, -requestedTld.length) : clean.replace(/\..*$/, ""))
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63);
  return { base, requestedTld };
}

function collectAvailabilityResources(
  node: unknown,
  inheritedDomain?: string,
): Array<{ domain: string; available: boolean; isAlternative: boolean; raw: unknown }> {
  if (!node) return [];
  if (Array.isArray(node)) return node.flatMap((item) => collectAvailabilityResources(item, inheritedDomain));
  if (typeof node === "boolean" && inheritedDomain) {
    return [{ domain: inheritedDomain.toLowerCase(), available: node, isAlternative: false, raw: node }];
  }
  if (typeof node !== "object") return [];

  const record = node as Record<string, unknown>;
  const out: Array<{ domain: string; available: boolean; isAlternative: boolean; raw: unknown }> = [];
  const directDomain = String(
    record.domain ?? record.name ?? record.domain_name ?? inheritedDomain ?? "",
  ).toLowerCase();
  const hasAvailability = "is_available" in record || "available" in record || "status" in record;
  if (directDomain && hasAvailability) {
    out.push({
      domain: directDomain,
      available: parseHostingerAvailability(record.is_available ?? record.available ?? record.status),
      isAlternative: record.is_alternative === true || record.isAlternative === true,
      raw: record,
    });
  }

  for (const [key, value] of Object.entries(record)) {
    if (/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(key)) {
      out.push(...collectAvailabilityResources(value, key.toLowerCase()));
    } else if (["data", "results", "domains", "availability", "alternatives"].includes(key)) {
      out.push(...collectAvailabilityResources(value, inheritedDomain));
    }
  }
  return out;
}

export const searchDomainsHostinger = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => DomainSearchSchema.parse(input))
  .handler(async ({ data }) => {
    const started = Date.now();
    const { base, requestedTld } = normalizeDomainQuery(data.query);
    if (!base) return { results: [], warning: "Domínio inválido." };

    const tldsToCheck = Array.from(new Set(requestedTld ? [requestedTld, ...DOMAIN_TLDS] : DOMAIN_TLDS));

    // Pricing comes from the fixed retail table — NOT from the Hostinger
    // catalog. Hostinger is only used for availability checks.
    const tierFor = (ext: string, years: DomainPeriod): DomainTier => {
      const fixedYearly = getDomainPriceBRL(ext);
      const total = getDomainTotalBRL(ext, years);
      return {
        years,
        price_hostinger: null,
        renewal_price: null,
        promotional_price: null,
        icann_fee: null,
        whois_price: null,
        margin_percent: 0,
        price_final: total,
        item_id: null,
        unavailable: false,
      };
    };

    const pricingFor = (ext: string): DomainPricing => ({
      "1y": tierFor(ext, 1),
      "2y": tierFor(ext, 2),
      "3y": tierFor(ext, 3),
    });

    const results: DomainHit[] = [];
    const primaryTld = requestedTld ?? ".com";

    const callAvailability = async (tlds: string[], withAlternatives: boolean, label: string) => {
      const payload = {
        domain: base,
        tlds: tlds.map((t) => t.replace(/^\./, "")),
        with_alternatives: withAlternatives,
      };
      const res = await hostinger.call<any>("/api/domains/v1/availability", {
        method: "POST",
        body: payload,
        timeoutMs: 15_000,
      });
      console.log("[domain-search] hostinger.call", {
        query: base,
        label,
        endpoint: "/api/domains/v1/availability",
        payload,
        status: res.status,
        ok: res.ok,
        error: res.error ?? null,
      });
      return { ...res, payload, label };
    };

    const pushHit = (
      domain: string,
      ext: string,
      available: boolean,
      isAlternative: boolean,
      source: string,
    ) => {
      if (results.find((r) => r.domain === domain)) return;
      const pricing = pricingFor(ext);
      const t1 = pricing["1y"];
      const status = available ? (isAlternative ? "suggestion" : "available") : "taken";
      console.log("[domain-search] result", {
        domain, status, available, source,
        provider_price: t1.price_hostinger,
        margin_percent: t1.margin_percent,
        final_price: t1.price_final,
      });
      results.push({
        domain, ext,
        priceBRL: t1.price_final ?? 0,
        price_hostinger: t1.price_hostinger,
        margin_percent: t1.margin_percent,
        available, status, source,
        suggested: isAlternative || undefined,
        pricing,
      });
    };

    const resAll = await callAvailability(tldsToCheck, false, "multi-tld");
    let resAlt: Awaited<ReturnType<typeof callAvailability>> | null = null;

    if (resAll.ok) {
      for (const item of collectAvailabilityResources(resAll.data)) {
        const ext = tldOfDomain(item.domain);
        if (!ext) continue;
        pushHit(item.domain, ext, item.available, item.isAlternative, "hostinger");
      }

      // Alternatives require exactly one TLD according to Hostinger docs.
      // Only call it after the main check succeeds to avoid rate-limit loops.
      resAlt = await callAvailability([primaryTld], true, "alternatives");
      if (resAlt.ok) {
        for (const item of collectAvailabilityResources(resAlt.data)) {
          const ext = tldOfDomain(item.domain);
          if (!ext) continue;
          pushHit(item.domain, ext, item.available, item.isAlternative, item.isAlternative ? "hostinger_alt" : "hostinger");
        }
      }
    }

    console.log("[domain-search] summary", {
      query: base, ms: Date.now() - started,
      total_tlds: tldsToCheck.length,
      results: results.length, any_ok: resAll.ok,
    });

    if (!resAll.ok) {
      return {
        results: [],
        warning: CLIENT_DOMAIN_ERROR,
        adminError: {
          endpoint: "/api/domains/v1/availability",
          payload: resAll.payload,
          status: resAll.status,
          response: resAll.data,
          message: resAll.error ?? "Hostinger availability failed",
        },
      };
    }

    // If Hostinger omits a requested primary TLD, keep it visible but blocked.
    // Omitted entries are NOT purchasable because availability was not confirmed.
    for (const t of tldsToCheck) {
      const domain = `${base}${t}`;
      if (!results.find((r) => r.domain === domain)) {
        pushHit(domain, t, false, false, "hostinger_unconfirmed");
      }
    }

    const weight = (r: DomainHit) =>
      r.available ? 0 : r.status === "suggestion" || r.suggested ? 1 : 2;
    results.sort((a, b) => weight(a) - weight(b));

    return { results, warning: null as string | null };
  });

export const adminTestHostingerDomainSearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const catalog = await fetchHostingerDomainCatalog();
    const tests = ["google.com", "gustavomartins.com", "viralizahostteste123.com"];

    const priceFor = (domain: string) => {
      const ext = tldOfDomain(domain);
      const matches = catalog.filter(
        (c) =>
          c.tld === ext &&
          Number(c.period) === 1 &&
          String(c.period_unit ?? "").toLowerCase().startsWith("y") &&
          c.price != null &&
          c.price > 0,
      );
      // Pick the LOWEST-priced SKU — preço público real cobrado pela Hostinger no período.
      const entry = matches.sort((a, b) => (a.price ?? 0) - (b.price ?? 0))[0];
      const provider = entry?.price != null ? round2(entry.price) : null;
      const marginPercent = getDomainMarginPercent(ext);
      const final = provider != null && ext ? applyDomainMargin(provider, ext) : null;
      return { ext, provider_price: provider, margin_percent: marginPercent, final_price: final, item_id: entry?.item_id ?? null };
    };

    const checks = [];
    for (const domain of tests) {
      const ext = tldOfDomain(domain);
      const base = ext ? domain.slice(0, -ext.length) : domain.split(".")[0];
      const payload = { domain: base, tlds: ext ? [ext.replace(/^\./, "")] : ["com"], with_alternatives: false };
      const res = await hostinger.call<any>("/api/domains/v1/availability", {
        method: "POST",
        body: payload,
        timeoutMs: 15_000,
      });
      const match = collectAvailabilityResources(res.data).find((item) => item.domain === domain);
      const pricing = priceFor(domain);
      checks.push({
        domain,
        endpoint: "/api/domains/v1/availability",
        payload,
        api_ok: res.ok,
        status_code: res.status,
        api_error: res.error ?? null,
        raw_response: res.data,
        availability_status: res.ok ? (match?.available ? "available" : "taken") : "error",
        available: res.ok ? match?.available === true : false,
        provider_price: pricing.provider_price,
        margin_percent: pricing.margin_percent,
        final_price: pricing.final_price,
        item_id: pricing.item_id,
      });
    }

    return { ok: checks.every((c) => c.api_ok), checks };
  });


// ---- Admin: domain orders (manual activation) ----

export const adminListDomainOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ status: z.string().optional() })
      .default({})
      .parse(input ?? {}),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    let q = supabaseAdmin
      .from("domain_orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { orders: rows ?? [] };
  });

export const adminUpdateDomainOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum([
          "PENDENTE_ATIVACAO",
          "AGUARDANDO_COMPRA_HOSTINGER",
          "ATIVO",
          "CANCELADO",
        ]),
        admin_notes: z.string().max(2000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const patch: Record<string, unknown> = { status: data.status };
    if (data.admin_notes !== undefined) patch.admin_notes = data.admin_notes;
    if (data.status === "ATIVO") {
      patch.activated_at = new Date().toISOString();
      patch.admin_activated_by = context.userId;
    }
    if (data.status === "AGUARDANDO_COMPRA_HOSTINGER") {
      patch.hostinger_purchased_at = new Date().toISOString();
    }
    if (data.status === "CANCELADO") patch.cancelled_at = new Date().toISOString();

    const { data: row, error } = await supabaseAdmin
      .from("domain_orders")
      .update(patch as never)
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    // Mirror to `domains` when activating, so the client panel surfaces it
    // with DNS management. Idempotent.
    if (data.status === "ATIVO" && row.user_id && row.domain_name) {
      const { data: existing } = await supabaseAdmin
        .from("domains")
        .select("id")
        .eq("user_id", row.user_id)
        .eq("domain", row.domain_name)
        .maybeSingle();
      if (existing?.id) {
        await supabaseAdmin
          .from("domains")
          .update({
            status: "ATIVO",
            domain_order_id: row.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabaseAdmin.from("domains").insert({
          user_id: row.user_id,
          domain: row.domain_name,
          status: "ATIVO",
          domain_order_id: row.id,
          nameservers: ["ns1.viralizahost.com", "ns2.viralizahost.com"],
          dns_records: [],
        });
      }
    }
    return { order: row };
  });

// ---- Client: my domain orders ----

export const listMyDomainOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin
      .from("domain_orders")
      .select(
        "id, domain_name, extension, price, currency, status, created_at, activated_at, cancelled_at",
      )
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { orders: data ?? [] };
  });

// ---- Client: DNS management for active domains ----

const DnsRecordSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV"]),
  name: z.string().min(1).max(253),
  value: z.string().min(1).max(2000),
  ttl: z.number().int().min(60).max(86400).default(3600),
  priority: z.number().int().min(0).max(65535).optional(),
});

export const getMyDomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ domain: z.string().min(3).max(253) }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("domains")
      .select("id, domain, status, nameservers, dns_records, target_ip, updated_at, created_at")
      .eq("user_id", context.userId)
      .eq("domain", data.domain.toLowerCase().trim())
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Domínio não encontrado.");
    return { domain: row };
  });

export const updateMyDomainDns = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        nameservers: z.array(z.string().min(3).max(253)).max(8).optional(),
        dns_records: z.array(DnsRecordSchema).max(100).optional(),
        target_ip: z.string().max(45).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    try {
      const { data: existing, error: readErr } = await supabaseAdmin
        .from("domains")
        .select("id, user_id, status")
        .eq("id", data.id)
        .maybeSingle();
      if (readErr) throw new Error(readErr.message);
      if (!existing || existing.user_id !== context.userId) {
        return { ok: false, fallback: true, error: "Domínio não encontrado." };
      }
      if ((existing.status ?? "").toUpperCase() !== "ATIVO") {
        return { ok: false, fallback: true, error: "Domínio ainda não está ativo." };
      }
      const nowIso = new Date().toISOString();
      const patch: Record<string, unknown> = {
        updated_at: nowIso,
        dns_change_pending: true,
        dns_change_requested_at: nowIso,
        dns_change_applied_at: null,
      };
      if (data.nameservers !== undefined) patch.nameservers = data.nameservers;
      if (data.dns_records !== undefined) {
        patch.dns_records = data.dns_records.map((r) => ({
          ...r,
          id: r.id ?? crypto.randomUUID(),
        }));
      }
      if (data.target_ip !== undefined) patch.target_ip = data.target_ip;
      const { data: row, error } = await supabaseAdmin
        .from("domains")
        .update(patch as never)
        .eq("id", data.id)
        .select("id, domain, status, nameservers, dns_records, target_ip, updated_at")
        .single();
      if (error) {
        console.error("[updateMyDomainDns] update_failed", error);
        return { ok: false, fallback: true, error: "Não foi possível salvar agora." };
      }
      return { ok: true, domain: row };
    } catch (e: any) {
      console.error("[updateMyDomainDns] exception", e);
      return { ok: false, fallback: true, error: "Não foi possível salvar agora." };
    }
  });

// ---- Admin: DNS change requests ----

export const adminListDnsChangeRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("domains")
      .select(
        "id, user_id, domain, status, nameservers, dns_records, target_ip, dns_change_pending, dns_change_requested_at, dns_change_applied_at, dns_change_note, updated_at",
      )
      .eq("dns_change_pending", true)
      .order("dns_change_requested_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { requests: data ?? [] };
  });

export const adminMarkDnsChangeApplied = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), note: z.string().max(1000).optional() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("domains")
      .update({
        dns_change_pending: false,
        dns_change_applied_at: new Date().toISOString(),
        dns_change_note: data.note ?? null,
      } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });


// ---- Email orders (manual activation flow) ----

export const listMyEmailOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin
      .from("email_orders")
      .select(
        "id, plan_id, plan_name, domain, accounts_count, storage_gb, price, currency, status, webmail_url, cpanel_url, created_at, activated_at",
      )
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { orders: data ?? [] };
  });

export const adminListEmailOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ status: z.string().optional() }).default({}).parse(input ?? {}),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    let q = supabaseAdmin
      .from("email_orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { orders: rows ?? [] };
  });

export const adminUpdateEmailOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["PENDENTE_ATIVACAO", "ATIVO", "CANCELADO"]).optional(),
        admin_notes: z.string().max(2000).optional(),
        webmail_url: z.string().max(500).optional(),
        cpanel_url: z.string().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const patch: Record<string, unknown> = {};
    if (data.status) patch.status = data.status;
    if (data.admin_notes !== undefined) patch.admin_notes = data.admin_notes;
    if (data.webmail_url !== undefined) patch.webmail_url = data.webmail_url || null;
    if (data.cpanel_url !== undefined) patch.cpanel_url = data.cpanel_url || null;
    if (data.status === "ATIVO") {
      patch.activated_at = new Date().toISOString();
      patch.admin_activated_by = context.userId;
    }
    if (data.status === "CANCELADO") patch.cancelled_at = new Date().toISOString();

    const { data: row, error } = await supabaseAdmin
      .from("email_orders")
      .update(patch as never)
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { order: row };
  });


// ---- Hosting orders (manual activation flow) ----

export const listMyHostingOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin
      .from("hosting_orders")
      .select(
        "id, plan_id, plan_name, domain, price, currency, status, cpanel_username, cpanel_url, server_ip, whm_package, storage_gb, created_at, activated_at",
      )
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { orders: data ?? [] };
  });

export const adminListHostingOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ status: z.string().optional() }).default({}).parse(input ?? {}),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    let q = supabaseAdmin
      .from("hosting_orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { orders: rows ?? [] };
  });

export const adminUpdateHostingOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["PENDENTE_ATIVACAO", "ATIVO", "CANCELADO"]).optional(),
        domain: z.string().max(255).optional(),
        cpanel_username: z.string().max(120).optional(),
        cpanel_url: z.string().max(500).optional(),
        server_ip: z.string().max(60).optional(),
        whm_package: z.string().max(120).optional(),
        admin_notes: z.string().max(2000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const patch: Record<string, unknown> = {};
    if (data.status) patch.status = data.status;
    if (data.domain !== undefined) patch.domain = data.domain || null;
    if (data.cpanel_username !== undefined) patch.cpanel_username = data.cpanel_username || null;
    if (data.cpanel_url !== undefined) patch.cpanel_url = data.cpanel_url || null;
    if (data.server_ip !== undefined) patch.server_ip = data.server_ip || null;
    if (data.whm_package !== undefined) patch.whm_package = data.whm_package || null;
    if (data.admin_notes !== undefined) patch.admin_notes = data.admin_notes;
    if (data.status === "ATIVO") {
      patch.activated_at = new Date().toISOString();
      patch.admin_activated_by = context.userId;
    }
    if (data.status === "CANCELADO") patch.cancelled_at = new Date().toISOString();

    const { data: row, error } = await supabaseAdmin
      .from("hosting_orders")
      .update(patch as never)
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { order: row };
  });

