// PayPal provider — Sandbox (REST API v2 Orders).
// Uses Client Credentials OAuth2 to get an access token, then creates
// and captures orders. Designed so we can flip to Live by changing the
// PAYPAL_MODE env var and providing PAYPAL_CLIENT_ID_LIVE / SECRET_LIVE.

import type { PaymentProvider, PaymentStatus } from "../types";

const SANDBOX_BASE = "https://api-m.sandbox.paypal.com";
const LIVE_BASE = "https://api-m.paypal.com";

type PayPalMode = "sandbox" | "live";

function getMode(): PayPalMode {
  const m = (process.env.PAYPAL_MODE ?? "sandbox").toLowerCase();
  return m === "live" ? "live" : "sandbox";
}

function getCreds() {
  const mode = getMode();
  const clientId =
    mode === "live"
      ? process.env.PAYPAL_CLIENT_ID_LIVE
      : process.env.PAYPAL_CLIENT_ID_SANDBOX;
  const secret =
    mode === "live" ? process.env.PAYPAL_SECRET_LIVE : process.env.PAYPAL_SECRET_SANDBOX;
  if (!clientId || !secret) {
    throw new Error(
      `PayPal ${mode} credentials not configured (PAYPAL_CLIENT_ID_${mode.toUpperCase()} / PAYPAL_SECRET_${mode.toUpperCase()})`,
    );
  }
  const base = mode === "live" ? LIVE_BASE : SANDBOX_BASE;
  return { clientId, secret, base, mode };
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.token;
  }
  const { clientId, secret, base } = getCreds();
  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");
  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`PayPal auth failed (${res.status}): ${txt.slice(0, 200)}`);
  }
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return json.access_token;
}

function mapStatus(s: string): PaymentStatus {
  switch (s) {
    case "COMPLETED":
    case "CAPTURED":
      return "approved";
    case "APPROVED":
    case "PAYER_ACTION_REQUIRED":
    case "CREATED":
    case "SAVED":
      return "pending";
    case "PENDING":
      return "in_process";
    case "VOIDED":
      return "cancelled";
    case "DECLINED":
    case "FAILED":
      return "rejected";
    case "REFUNDED":
    case "PARTIALLY_REFUNDED":
      return "refunded";
    default:
      return "pending";
  }
}

// USD conversion — PayPal Sandbox does not accept BRL for many merchants
// without local entity. We charge in USD using a fixed reference rate that
// can be tuned via env. For Sandbox this is fine; Live should re-evaluate.
function brlToUsd(amountBrl: number): number {
  const rate = Number(process.env.PAYPAL_BRL_USD_RATE ?? "5.40");
  const safeRate = Number.isFinite(rate) && rate > 0 ? rate : 5.4;
  return Number((amountBrl / safeRate).toFixed(2));
}

export type CreatePayPalOrderInput = {
  orderId: string;
  amountBrl: number;
  description: string;
  payerEmail?: string;
};

export type CreatePayPalOrderOutput = {
  providerOrderId: string;
  status: PaymentStatus;
  approveUrl: string | null;
  amountUsd: number;
  raw: unknown;
};

export async function createPayPalOrder(
  input: CreatePayPalOrderInput,
): Promise<CreatePayPalOrderOutput> {
  const { base } = getCreds();
  const token = await getAccessToken();
  const amountUsd = brlToUsd(input.amountBrl);
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
    throw new Error("Valor inválido para PayPal.");
  }
  const body = {
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: input.orderId,
        description: input.description.slice(0, 127),
        amount: { currency_code: "USD", value: amountUsd.toFixed(2) },
      },
    ],
    application_context: {
      brand_name: "ViralizaHost",
      user_action: "PAY_NOW",
      shipping_preference: "NO_SHIPPING",
    },
  };
  const res = await fetch(`${base}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("[paypal] create order error", res.status, json);
    throw new Error(json?.message ?? `PayPal create order falhou (${res.status})`);
  }
  const approveLink =
    Array.isArray(json?.links) && json.links.find((l: any) => l.rel === "approve")?.href;
  return {
    providerOrderId: String(json.id),
    status: mapStatus(json.status ?? "CREATED"),
    approveUrl: approveLink ?? null,
    amountUsd,
    raw: json,
  };
}

export type CapturePayPalOrderOutput = {
  providerOrderId: string;
  status: PaymentStatus;
  captureId: string | null;
  raw: unknown;
};

export async function capturePayPalOrder(
  providerOrderId: string,
): Promise<CapturePayPalOrderOutput> {
  const { base } = getCreds();
  const token = await getAccessToken();
  const res = await fetch(`${base}/v2/checkout/orders/${providerOrderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("[paypal] capture error", res.status, json);
    throw new Error(json?.message ?? `PayPal capture falhou (${res.status})`);
  }
  const cap = json?.purchase_units?.[0]?.payments?.captures?.[0];
  return {
    providerOrderId: String(json.id),
    status: mapStatus(cap?.status ?? json?.status ?? "PENDING"),
    captureId: cap?.id ?? null,
    raw: json,
  };
}

export async function getPayPalOrder(providerOrderId: string) {
  const { base } = getCreds();
  const token = await getAccessToken();
  const res = await fetch(`${base}/v2/checkout/orders/${providerOrderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message ?? `PayPal get order falhou (${res.status})`);
  return { status: mapStatus(json.status ?? "PENDING"), raw: json };
}

export function getPayPalPublicConfig() {
  const { clientId, mode } = getCreds();
  return { clientId, mode };
}

// Keep legacy PaymentProvider shape for the registry; PayPal flow uses its
// own dedicated server functions instead of pix/card/boleto.
export const paypal: PaymentProvider = {
  id: "paypal",
  async createPixPayment() {
    throw new Error("PayPal não suporta PIX.");
  },
  async createCardPayment() {
    throw new Error("Use o fluxo PayPal Checkout (createPayPalOrder).");
  },
  async createBoletoPayment() {
    throw new Error("PayPal não suporta boleto.");
  },
  async getPaymentStatus(providerPaymentId: string) {
    const snap = await getPayPalOrder(providerPaymentId);
    return {
      providerPaymentId,
      status: snap.status,
      paidAt: null,
      raw: snap.raw,
    };
  },
};
