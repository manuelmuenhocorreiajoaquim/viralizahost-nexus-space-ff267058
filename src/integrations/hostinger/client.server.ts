// Server-only Hostinger API client. Never import from client code.
// Reads HOSTINGER_API_TOKEN from env at call time. Logs every call to
// the `hostinger_logs` table for auditing.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BASE = "https://developers.hostinger.com";

type HostingerCallOpts = {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  jobId?: string | null;
};

export type HostingerResult<T = any> = {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
};

export async function hostingerCall<T = any>(
  path: string,
  opts: HostingerCallOpts = {},
): Promise<HostingerResult<T>> {
  const token = process.env.HOSTINGER_API_TOKEN;
  if (!token) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: "HOSTINGER_API_TOKEN is not configured",
    };
  }

  const method = opts.method ?? "GET";
  const url = `${BASE}${path}`;
  const started = Date.now();

  let status = 0;
  let parsed: any = null;
  let success = false;
  let errorMessage: string | undefined;

  try {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    status = res.status;
    const text = await res.text();
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = { raw: text };
    }
    success = res.ok;
    if (!res.ok) {
      errorMessage =
        parsed?.message ?? parsed?.error ?? `Hostinger API ${status}`;
    }
  } catch (e: any) {
    errorMessage = e?.message ?? "Network error calling Hostinger API";
  }

  // Best-effort audit log — never throw on logging failure.
  try {
    await supabaseAdmin.from("hostinger_logs").insert({
      job_id: opts.jobId ?? null,
      endpoint: path,
      method,
      status_code: status || null,
      duration_ms: Date.now() - started,
      request: opts.body ? (opts.body as any) : {},
      response: parsed ?? {},
      success,
      error_message: errorMessage ?? null,
    });
  } catch (e) {
    console.error("[hostinger] failed to insert log", e);
  }

  return {
    ok: success,
    status,
    data: success ? (parsed as T) : null,
    error: errorMessage,
  };
}

// ---- Convenience wrappers (best-effort; endpoints may evolve) ----

export const hostinger = {
  call: hostingerCall,

  listCatalog: () => hostingerCall("/api/billing/v1/catalog"),

  listPaymentMethods: () => hostingerCall("/api/billing/v1/payment-methods"),

  // Generic billing order (legacy). Body shape:
  // { payment_method_id, items: [{ item_id, quantity }], coupons?: string[] }
  createBillingOrder: (
    body: {
      payment_method_id: number | string;
      items: Array<{ item_id: string; quantity: number }>;
      coupons?: string[];
    },
    jobId?: string,
  ) =>
    hostingerCall("/api/billing/v1/orders", {
      method: "POST",
      body,
      jobId,
    }),

  // Preferred: dedicated VPS purchase endpoint
  createVps: (body: Record<string, unknown>, jobId?: string) =>
    hostingerCall("/api/vps/v1/virtual-machines", {
      method: "POST",
      body,
      jobId,
    }),

  listVps: () => hostingerCall("/api/vps/v1/virtual-machines"),

  // Preferred: dedicated domain purchase endpoint
  buyDomain: (body: Record<string, unknown>, jobId?: string) =>
    hostingerCall("/api/domains/v1/portfolio", {
      method: "POST",
      body,
      jobId,
    }),

  checkDomain: (domain: string, jobId?: string) =>
    hostingerCall(
      `/api/domains/v1/availability?domain=${encodeURIComponent(domain)}`,
      { jobId },
    ),
};
