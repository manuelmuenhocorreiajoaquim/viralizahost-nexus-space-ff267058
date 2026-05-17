// Provisioning queue logic — server-only.
//
// Two-phase flow:
//   ensureProvisioningJobs(orderId)
//     → creates `provisioning_jobs` rows with status='pending' for every
//       order_item that has a mapping in `provider_products`. Idempotent.
//       Called as soon as a payment is generated (PIX / card / etc.), so
//       admins can see the job in /admin/provisioning before the payment
//       is even approved.
//
//   runPendingProvisioningJobs(orderId)
//     → picks up pending jobs (auto_provision=true) and actually calls the
//       Hostinger API to provision them. Called from
//       activateOrderAfterPayment() after the MP webhook approves the
//       payment.
//
//   enqueueHostingerProvisioning(orderId)
//     → backwards-compatible wrapper that does BOTH (used by webhook).

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
  cycle: string | null;
  unit_price: number | null;
  total: number | null;
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

/**
 * Idempotently create pending provisioning_jobs for an order.
 * Does NOT call the Hostinger API.
 */
export async function ensureProvisioningJobs(orderId: string) {
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, user_id, cycle, notes")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return { ok: false, reason: "order_not_found", jobs: [] as string[] };

  const { data: items } = await supabaseAdmin
    .from("order_items")
    .select(
      "id, order_id, product_id, product_name, product_type, quantity, domain, cycle, unit_price, total, metadata",
    )
    .eq("order_id", orderId);

  if (!items || items.length === 0) return { ok: true, jobs: [] as string[] };

  const productIds = Array.from(new Set(items.map((it) => it.product_id)));
  const { data: mappings } = await supabaseAdmin
    .from("provider_products")
    .select("*")
    .eq("provider", "hostinger")
    .eq("active", true)
    .in("internal_product_id", productIds);

  const byId = new Map<string, ProviderProductRow>();
  for (const m of mappings ?? []) byId.set(m.internal_product_id, m as any);

  // Lookup latest payment for amount/customer (best-effort).
  const { data: payment } = await supabaseAdmin
    .from("payments")
    .select("id, amount, raw_response, provider_payment_id")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let customerEmail: string | null = null;
  if (order.user_id) {
    const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(order.user_id);
    customerEmail = userRes?.user?.email ?? null;
  }

  const createdJobs: string[] = [];

  for (const item of items as OrderItemRow[]) {
    const mapping = byId.get(item.product_id);
    if (!mapping) continue;

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

    const providerRequest = {
      item_id: mapping.provider_price_id,
      hostinger_price_id: mapping.provider_price_id,
      product_slug: item.product_id,
      product_name: item.product_name,
      product_type: item.product_type,
      quantity: item.quantity,
      domain: item.domain,
      billing_cycle: item.cycle ?? order.cycle ?? null,
      unit_price: item.unit_price,
      amount: item.total ?? payment?.amount ?? null,
      customer_email: customerEmail,
      payment_id: payment?.id ?? null,
      provider_payment_id: payment?.provider_payment_id ?? null,
      metadata: { ...(item.metadata ?? {}), ...(mapping.provider_metadata ?? {}) },
    };

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
        provider_request: providerRequest,
      })
      .select("id")
      .single();
    if (jobErr || !job) {
      console.error("[provisioning] failed to create job", jobErr);
      continue;
    }
    console.log("[provisioning] created pending job", {
      jobId: job.id,
      orderId,
      itemId: item.id,
      productSlug: item.product_id,
      priceId: mapping.provider_price_id,
    });
    createdJobs.push(job.id);
  }

  return { ok: true, jobs: createdJobs };
}

/**
 * Process all pending jobs for an order via the Hostinger API.
 * Called after the payment is approved.
 */
export async function runPendingProvisioningJobs(orderId: string) {
  const { data: jobs } = await supabaseAdmin
    .from("provisioning_jobs")
    .select("id, status")
    .eq("order_id", orderId)
    .eq("provider", "hostinger")
    .in("status", ["pending"]);

  const ran: string[] = [];
  for (const j of jobs ?? []) {
    await processProvisioningJob(j.id);
    ran.push(j.id);
  }
  return { ok: true, processed: ran };
}

/**
 * Backwards-compatible: ensure jobs exist + run any pending ones immediately.
 */
export async function enqueueHostingerProvisioning(orderId: string) {
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return { ok: false, reason: "order_not_found" };

  await ensureProvisioningJobs(orderId);

  // Only auto-process when the order is already paid.
  if (order.status === "paid") {
    await runPendingProvisioningJobs(orderId);
  }
  return { ok: true };
}

const MAX_ATTEMPTS = 3;

export type HostingerCatalogPrice = {
  item_id: string;        // real catalog price id used on POST /api/vps/v1/virtual-machines
  catalog_id: string;     // parent catalog item id
  name: string;
  category: string;
  price: number | null;
  currency: string | null;
  period: number | null;
  period_unit: string | null;
  features?: any;
  raw?: any;
};

const VPS_INTERNAL_PRODUCTS: Record<string, { slug: string; name: string; price: number }> = {
  "1": { slug: "vps-nvme-1", name: "VPS NVMe 1", price: 59.99 },
  "2": { slug: "vps-nvme-2", name: "VPS NVMe 2", price: 87.99 },
  "4": { slug: "vps-nvme-3", name: "VPS NVMe 3", price: 119.99 },
  "8": { slug: "vps-nvme-4", name: "VPS NVMe 4", price: 239.99 },
};

function normalizePlanCode(input: string): string | null {
  return /vps-kvm(1|2|4|8)(?:\D|$)/i.exec(input)?.[1] ?? null;
}

function isMonthlyCatalogEntry(entry: HostingerCatalogPrice) {
  const item = entry.item_id.toLowerCase();
  const unit = String(entry.period_unit ?? "").toLowerCase();
  return item.endsWith("-1m") || item.includes("-1m-") || (Number(entry.period) === 1 && /month|mês|mes|monthly|m/.test(unit));
}

/**
 * Fetch the live Hostinger billing catalog and flatten every VPS price
 * (each plan × billing period) into a real `item_id` that can be sent to
 * POST /api/vps/v1/virtual-machines. NEVER use hard-coded ids.
 */
export async function fetchHostingerVpsCatalog(): Promise<HostingerCatalogPrice[]> {
  const res = await hostinger.listCatalog();
  if (!res.ok) return [];
  const raw: any = res.data;
  const list: any[] = Array.isArray(raw) ? raw : (raw?.data ?? raw?.items ?? []);
  const out: HostingerCatalogPrice[] = [];
  for (const item of list) {
    const category = String(item?.category ?? item?.type ?? "").toLowerCase();
    const name = String(item?.name ?? item?.title ?? "");
    if (!category.includes("vps") && !name.toLowerCase().includes("vps") && !name.toLowerCase().includes("kvm")) continue;
    const prices: any[] = Array.isArray(item?.prices) ? item.prices : [];
    if (prices.length === 0) {
      // Some catalog responses put the id at the root level.
      if (item?.id) {
        out.push({
          item_id: String(item.id),
          catalog_id: String(item.id),
          name,
          category,
          price: typeof item.price === "number" ? item.price : null,
          currency: item.currency ?? null,
          period: item.period ?? null,
          period_unit: item.period_unit ?? null,
          features: item.features ?? null,
          raw: item,
        });
      }
      continue;
    }
    for (const p of prices) {
      if (!p?.id) continue;
      out.push({
        item_id: String(p.id),
        catalog_id: String(item.id ?? ""),
        name: `${name}${p.name ? ` — ${p.name}` : ""}`,
        category,
        price: typeof p.first_period_price === "number"
          ? p.first_period_price / 100
          : typeof p.price === "number"
            ? p.price / 100
            : null,
        currency: p.currency ?? item.currency ?? null,
        period: p.period ?? null,
        period_unit: p.period_unit ?? null,
        features: item.features ?? null,
        raw: { item, price: p },
      });
    }
  }
  return out;
}

async function validateItemIdInCatalog(itemId: string): Promise<{ ok: boolean; available: string[] }> {
  const cat = await fetchHostingerVpsCatalog();
  const ids = cat.map((c) => c.item_id);
  return { ok: ids.includes(itemId), available: ids };
}

export async function syncHostingerVpsCatalogToProviderProducts() {
  const catalog = await fetchHostingerVpsCatalog();
  const preferred = new Map<string, HostingerCatalogPrice>();
  for (const entry of catalog) {
    const plan = normalizePlanCode(entry.item_id) ?? normalizePlanCode(entry.name);
    const product = plan ? VPS_INTERNAL_PRODUCTS[plan] : null;
    if (!product) continue;
    const current = preferred.get(product.slug);
    if (!current || (isMonthlyCatalogEntry(entry) && !isMonthlyCatalogEntry(current))) {
      preferred.set(product.slug, entry);
    }
  }
  for (const [slug, entry] of preferred) {
    const plan = normalizePlanCode(entry.item_id) ?? normalizePlanCode(entry.name);
    const product = plan ? VPS_INTERNAL_PRODUCTS[plan] : null;
    if (!product) continue;
    await supabaseAdmin.from("provider_products").upsert(
      {
        internal_product_id: product.slug,
        internal_product_name: product.name,
        provider: "hostinger",
        provider_service_type: "vps",
        provider_price_id: entry.item_id,
        provider_metadata: {
          catalog: entry.raw ?? null,
          hostinger_name: entry.name,
          hostinger_item_id: entry.item_id,
          billing_period: entry.period ? `${entry.period}${entry.period_unit ?? ""}` : null,
        },
        auto_provision: true,
        internal_price: product.price,
        currency: "BRL",
        active: true,
      },
      { onConflict: "provider,internal_product_id" },
    );
  }
  return { ok: true, catalog, mapped: Array.from(preferred.entries()).map(([slug, entry]) => ({ slug, item_id: entry.item_id })) };
}

function generateRootPassword(): string {
  // 20-char password with upper/lower/digits/symbol.
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%^*-_=+";
  const all = upper + lower + digits + symbols;
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
  let pwd = pick(upper) + pick(lower) + pick(digits) + pick(symbols);
  for (let i = 0; i < 16; i++) pwd += pick(all);
  return pwd.split("").sort(() => Math.random() - 0.5).join("");
}

async function pickUbuntuTemplateId(jobId: string): Promise<number | string | null> {
  const res = await hostinger.listTemplates();
  const list: any[] = Array.isArray(res.data)
    ? res.data
    : (res.data?.data ?? res.data?.templates ?? []);
  if (!list.length) return null;
  const norm = (s: any) => String(s ?? "").toLowerCase();
  const ubuntu2204 = list.find(
    (t) => norm(t.name).includes("ubuntu") && norm(t.name).includes("22.04"),
  );
  const anyUbuntu = list.find((t) => norm(t.name).includes("ubuntu"));
  const chosen = ubuntu2204 ?? anyUbuntu ?? list[0];
  console.log("[provisioning] picked template", { jobId, id: chosen?.id, name: chosen?.name });
  return chosen?.id ?? null;
}

async function validateTemplateId(templateId: number | string): Promise<{ ok: boolean; available: string[] }> {
  const res = await hostinger.listTemplates();
  const list: any[] = Array.isArray(res.data)
    ? res.data
    : (res.data?.data ?? res.data?.templates ?? []);
  const ids = list.map((t) => String(t?.id)).filter(Boolean);
  return { ok: ids.includes(String(templateId)), available: ids };
}

async function pickDataCenterId(jobId: string): Promise<number | string | null> {
  const res = await hostinger.listDataCenters();
  const list: any[] = Array.isArray(res.data)
    ? res.data
    : (res.data?.data ?? res.data?.dataCenters ?? res.data?.data_centers ?? []);
  if (!list.length) return null;
  const norm = (s: any) => String(s ?? "").toLowerCase();
  // Prefer Brazil/São Paulo → Americas → first
  const br =
    list.find((d) => norm(d.location).includes("brazil") || norm(d.city).includes("sao paulo") || norm(d.name).includes("brazil")) ??
    list.find((d) => norm(d.continent).includes("america") || norm(d.location).includes("us") || norm(d.name).includes("america"));
  const chosen = br ?? list[0];
  console.log("[provisioning] picked datacenter", { jobId, id: chosen?.id, name: chosen?.name ?? chosen?.location });
  return chosen?.id ?? null;
}

async function validateDataCenterId(dataCenterId: number | string): Promise<{ ok: boolean; available: string[] }> {
  const res = await hostinger.listDataCenters();
  const list: any[] = Array.isArray(res.data)
    ? res.data
    : (res.data?.data ?? res.data?.dataCenters ?? res.data?.data_centers ?? []);
  const ids = list.map((d) => String(d?.id)).filter(Boolean);
  return { ok: ids.includes(String(dataCenterId)), available: ids };
}

export async function processProvisioningJob(jobId: string) {
  const { data: job } = await supabaseAdmin
    .from("provisioning_jobs")
    .select("*")
    .eq("id", jobId)
    .maybeSingle();
  if (!job) return { ok: false, error: "job_not_found" };
  if (job.status === "provisioned") return { ok: true, alreadyDone: true };
  if ((job.attempts ?? 0) >= MAX_ATTEMPTS && job.status === "failed") {
    return { ok: false, error: `max_attempts_reached (${MAX_ATTEMPTS})` };
  }

  await supabaseAdmin
    .from("provisioning_jobs")
    .update({
      status: "processing",
      attempts: (job.attempts ?? 0) + 1,
      last_attempt_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  const req: any = job.provider_request ?? {};
  const itemId: string | null = req.item_id ?? req.hostinger_price_id ?? null;
  const domain: string | null = req.domain ?? null;

  let result: { ok: boolean; status: number; data: any; error?: string };
  let builtPayload: Record<string, unknown> | null = null;

  try {
    switch (job.provider_service_type) {
      case "vps": {
        if (!itemId) throw new Error("Mapeamento sem provider_price_id — sincronize o catálogo Hostinger no admin");

        // Validate against the LIVE Hostinger billing catalog.
        const validation = await validateItemIdInCatalog(itemId);
        if (!validation.ok) {
          throw new Error(
            `item_id "${itemId}" não existe no catálogo real da Hostinger. ` +
            `Sincronize o catálogo em /admin/provider-products e mapeie o produto. ` +
            `IDs disponíveis: ${validation.available.slice(0, 8).join(", ")}${validation.available.length > 8 ? "…" : ""}`,
          );
        }

        // Resolve template + datacenter (auto)
        const [templateId, dataCenterId] = await Promise.all([
          pickUbuntuTemplateId(jobId),
          pickDataCenterId(jobId),
        ]);
        if (!templateId) throw new Error("Hostinger template (Ubuntu 22.04 LTS) não encontrado");
        if (!dataCenterId) throw new Error("Nenhum data center Hostinger disponível");

        const hostname = `vps-${String(job.order_id ?? job.id).slice(0, 8)}`;
        const rootPassword = generateRootPassword();

        builtPayload = {
          item_id: itemId,
          setup: {
            template_id: templateId,
            data_center_id: dataCenterId,
            hostname,
            root_password: rootPassword,
            ...(req.metadata?.vps?.setup ?? {}),
          },
        };

        console.log("[provisioning] hostinger payload", { jobId, payload: { ...builtPayload, setup: { ...(builtPayload as any).setup, root_password: "***" } } });
        result = await hostinger.createVps(builtPayload, jobId);

        // Persist generated setup fields back into provider_request so the
        // admin / customer can retrieve hostname + root_user later.
        await supabaseAdmin
          .from("provisioning_jobs")
          .update({
            provider_request: {
              ...req,
              setup: { template_id: templateId, data_center_id: dataCenterId, hostname, root_user: "root" },
            },
          })
          .eq("id", jobId);
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
