// Server-only Hostinger API client. Never import from client code.
// Reads HOSTINGER_API_TOKEN from env at call time. Logs every call to
// the `hostinger_logs` table for auditing.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BASE = "https://developers.hostinger.com";
const DEFAULT_TIMEOUT_MS = 15_000;

type HostingerCallOpts = {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  jobId?: string | null;
  timeoutMs?: number;
};

export type HostingerResult<T = any> = {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
};

async function writeHostingerLog(input: {
  jobId?: string | null;
  endpoint: string;
  method: string;
  status: number;
  started: number;
  request?: unknown;
  response?: unknown;
  success: boolean;
  errorMessage?: string | null;
}) {
  try {
    await supabaseAdmin.from("hostinger_logs").insert({
      job_id: input.jobId ?? null,
      endpoint: input.endpoint,
      method: input.method,
      status_code: input.status || null,
      duration_ms: Date.now() - input.started,
      request: input.request ? (input.request as any) : {},
      response: input.response ? (input.response as any) : {},
      success: input.success,
      error_message: input.errorMessage ?? null,
    });
  } catch (e) {
    console.error("[hostinger] failed to insert log", e);
  }
}

function getHostingerToken() {
  const raw = process.env.HOSTINGER_API_TOKEN;
  return raw?.replace(/^Bearer\s+/i, "").trim() ?? "";
}

export async function hostingerCall<T = any>(
  path: string,
  opts: HostingerCallOpts = {},
): Promise<HostingerResult<T>> {
  const method = opts.method ?? "GET";
  const started = Date.now();
  const token = getHostingerToken();
  console.log("[hostinger] token_exists", Boolean(token));

  if (!token) {
    await writeHostingerLog({
      jobId: opts.jobId,
      endpoint: path,
      method,
      status: 0,
      started,
      request: opts.body,
      response: { error: "missing_token" },
      success: false,
      errorMessage: "HOSTINGER_API_TOKEN is not configured",
    });
    return {
      ok: false,
      status: 0,
      data: null,
      error: "HOSTINGER_API_TOKEN is not configured",
    };
  }

  const url = `${BASE}${path}`;
  console.log("[hostinger] request_started", { method, url });

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
        "Cache-Control": "no-store",
        "User-Agent": "ViralizaHost/1.0 (+https://viralizahost.com)",
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: AbortSignal.timeout(opts.timeoutMs ?? DEFAULT_TIMEOUT_MS),
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
    console.log("[hostinger] response_status", status);
    console.log("[hostinger] response_body", parsed);
  } catch (e: any) {
    const timedOut = e?.name === "TimeoutError" || e?.name === "AbortError";
    errorMessage = timedOut
      ? "Timeout calling Hostinger API"
      : e?.message ?? "Network error calling Hostinger API";
    console.error("[hostinger] fetch_error", { name: e?.name, message: errorMessage });
  }

  await writeHostingerLog({
    jobId: opts.jobId,
    endpoint: path,
    method,
    status,
    started,
    request: opts.body,
    response: parsed ?? {},
    success,
    errorMessage: errorMessage ?? null,
  });

  return {
    ok: success,
    status,
    data: parsed as T,
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

  listTemplates: () => hostingerCall("/api/vps/v1/templates"),
  listDataCenters: () => hostingerCall("/api/vps/v1/data-centers"),

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
