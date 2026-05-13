// Mercado Pago REST client. Uses fetch directly (Worker-safe) instead of the
// Node SDK. Reads the access token from server env at call time.

import type {
  CreatePixInput,
  CreatePixOutput,
  PaymentProvider,
  PaymentSnapshot,
  PaymentStatus,
} from "../types";

const MP_API = "https://api.mercadopago.com";

function resolveAccessToken(): string {
  const mode = (process.env.MP_MODE ?? "test").toLowerCase();
  const token =
    mode === "live"
      ? process.env.MP_ACCESS_TOKEN_LIVE
      : process.env.MP_ACCESS_TOKEN_TEST;
  if (!token) {
    throw new Error(
      `Mercado Pago access token missing for mode "${mode}". Configure MP_ACCESS_TOKEN_${mode.toUpperCase()}.`,
    );
  }
  return token;
}

function mapStatus(s: string | undefined | null): PaymentStatus {
  switch (s) {
    case "approved":
      return "approved";
    case "in_process":
    case "in_mediation":
    case "authorized":
      return "in_process";
    case "rejected":
      return "rejected";
    case "refunded":
    case "charged_back":
      return "refunded";
    case "cancelled":
      return "cancelled";
    case "expired":
      return "expired";
    case "pending":
    default:
      return "pending";
  }
}

async function mpFetch(path: string, init: RequestInit = {}): Promise<any> {
  const token = resolveAccessToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${MP_API}${path}`, { ...init, headers });
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const msg =
      data?.message || data?.error || `Mercado Pago error ${res.status}`;
    const err = new Error(msg);
    (err as any).status = res.status;
    (err as any).data = data;
    throw err;
  }
  return data;
}

export const mercadopago: PaymentProvider = {
  id: "mercadopago",

  async createPixPayment(input: CreatePixInput): Promise<CreatePixOutput> {
    const expiresInMinutes = input.expiresInMinutes ?? 30;
    const expires = new Date(Date.now() + expiresInMinutes * 60_000);
    // MP requires ISO with timezone offset; toISOString returns Z which is accepted.
    const expirationStr = expires.toISOString().replace("Z", "-00:00");

    const body = {
      transaction_amount: Number(input.amount.toFixed(2)),
      description: input.description,
      payment_method_id: "pix",
      payer: { email: input.payerEmail },
      external_reference: input.orderId,
      date_of_expiration: expirationStr,
      notification_url: process.env.MP_NOTIFICATION_URL || undefined,
      metadata: { order_id: input.orderId },
    };

    const idemKey = `${input.orderId}-${Date.now()}`;
    const data = await mpFetch("/v1/payments", {
      method: "POST",
      headers: { "X-Idempotency-Key": idemKey },
      body: JSON.stringify(body),
    });

    const tx = data?.point_of_interaction?.transaction_data ?? {};
    return {
      providerPaymentId: String(data.id),
      status: mapStatus(data.status),
      qrCode: tx.qr_code ?? "",
      qrCodeBase64: tx.qr_code_base64 ?? "",
      pixCopyPaste: tx.qr_code ?? "",
      expiresAt: expires.toISOString(),
      raw: data,
    };
  },

  async getPaymentStatus(providerPaymentId: string): Promise<PaymentSnapshot> {
    const data = await mpFetch(
      `/v1/payments/${encodeURIComponent(providerPaymentId)}`,
    );
    return {
      providerPaymentId: String(data.id),
      status: mapStatus(data.status),
      paidAt: data.date_approved ?? null,
      raw: data,
    };
  },
};

export function getProvider() {
  // Single provider for now. Switch on env later for ExPay / PayPal.
  return mercadopago;
}
