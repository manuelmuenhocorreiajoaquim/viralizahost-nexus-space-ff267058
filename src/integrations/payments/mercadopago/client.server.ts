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

type MercadoPagoResponse = {
  id?: string | number;
  status?: string | null;
  message?: string;
  error?: string;
  date_approved?: string | null;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
    };
  };
  raw?: string;
};

type MercadoPagoError = Error & { status?: number; data?: MercadoPagoResponse | null };

function resolveAccessToken(): string {
  const mode = (process.env.MP_MODE ?? "test").toLowerCase();
  const token =
    mode === "live" ? process.env.MP_ACCESS_TOKEN_LIVE : process.env.MP_ACCESS_TOKEN_TEST;
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

async function mpFetch(path: string, init: RequestInit = {}): Promise<MercadoPagoResponse> {
  const token = resolveAccessToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${MP_API}${path}`, { ...init, headers });
  const text = await res.text();
  let data: MercadoPagoResponse | null = null;
  try {
    data = text ? (JSON.parse(text) as MercadoPagoResponse) : null;
  } catch {
    data = { raw: text };
  }
  data ??= {};
  if (!res.ok) {
    const msg = data?.message || data?.error || `Mercado Pago error ${res.status}`;
    const err: MercadoPagoError = new Error(msg);
    err.status = res.status;
    err.data = data;
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

    const sanitizedItems = (input.items ?? [])
      .map((item) => ({
        title: String(item.title ?? "")
          .trim()
          .slice(0, 120),
        quantity: Math.max(1, Math.trunc(Number(item.quantity))),
        unit_price: Number(Number(item.unit_price).toFixed(2)),
        description: item.description ? String(item.description).trim().slice(0, 255) : undefined,
      }))
      .filter(
        (item) =>
          item.title.length > 0 &&
          Number.isInteger(item.quantity) &&
          item.quantity > 0 &&
          Number.isFinite(item.unit_price) &&
          item.unit_price > 0,
      );

    const body = {
      transaction_amount: Number(input.amount.toFixed(2)),
      description: input.description,
      payment_method_id: "pix",
      payer: { email: input.payerEmail },
      external_reference: input.orderId,
      date_of_expiration: expirationStr,
      notification_url: process.env.MP_NOTIFICATION_URL || undefined,
      metadata: { order_id: input.orderId },
      ...(sanitizedItems.length ? { additional_info: { items: sanitizedItems } } : {}),
    };

    const idemKey = `${input.orderId}-${Date.now()}`;
    const data = await mpFetch("/v1/payments", {
      method: "POST",
      headers: { "X-Idempotency-Key": idemKey },
      body: JSON.stringify(body),
    });
    console.log("[mercadopago] create pix raw response", {
      id: data?.id ?? null,
      status: data?.status ?? null,
      amount: body.transaction_amount,
      itemCount: sanitizedItems.length,
      hasPointOfInteraction: !!data?.point_of_interaction,
      hasTransactionData: !!data?.point_of_interaction?.transaction_data,
    });

    if (!data?.id) {
      console.error("[mercadopago] create pix invalid response", data);
      throw new Error("Mercado Pago não retornou o ID do pagamento.");
    }

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

  async createCardPayment(input) {
    const body: Record<string, unknown> = {
      transaction_amount: Number(input.amount.toFixed(2)),
      description: input.description,
      token: input.cardToken,
      installments: Math.max(1, Math.trunc(input.installments)),
      payment_method_id: input.paymentMethodId,
      external_reference: input.orderId,
      notification_url: process.env.MP_NOTIFICATION_URL || undefined,
      metadata: { order_id: input.orderId },
      payer: {
        email: input.payerEmail,
        first_name: input.payerName?.split(" ")[0],
        last_name: input.payerName?.split(" ").slice(1).join(" ") || undefined,
        identification: input.identification
          ? { type: input.identification.type, number: input.identification.number }
          : undefined,
      },
    };
    if (input.issuerId) body.issuer_id = input.issuerId;

    const idemKey = `${input.orderId}-card-${Date.now()}`;
    const data = await mpFetch("/v1/payments", {
      method: "POST",
      headers: { "X-Idempotency-Key": idemKey },
      body: JSON.stringify(body),
    });
    if (!data?.id) throw new Error("Mercado Pago não retornou o ID do pagamento.");
    return {
      providerPaymentId: String(data.id),
      status: mapStatus(data.status),
      statusDetail: (data as { status_detail?: string }).status_detail ?? null,
      raw: data,
    };
  },

  async createBoletoPayment(input) {
    const expires = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const body = {
      transaction_amount: Number(input.amount.toFixed(2)),
      description: input.description,
      payment_method_id: "bolbradesco",
      external_reference: input.orderId,
      date_of_expiration: expires.toISOString().replace("Z", "-00:00"),
      notification_url: process.env.MP_NOTIFICATION_URL || undefined,
      metadata: { order_id: input.orderId },
      payer: {
        email: input.payerEmail,
        first_name: input.payerFirstName,
        last_name: input.payerLastName,
        identification: { type: input.identification.type, number: input.identification.number },
      },
    };
    const idemKey = `${input.orderId}-boleto-${Date.now()}`;
    const data = await mpFetch("/v1/payments", {
      method: "POST",
      headers: { "X-Idempotency-Key": idemKey },
      body: JSON.stringify(body),
    });
    if (!data?.id) throw new Error("Mercado Pago não retornou o ID do pagamento.");
    const tx = (data as { transaction_details?: { external_resource_url?: string } })
      .transaction_details;
    const barcode =
      (data as { barcode?: { content?: string } }).barcode?.content ?? "";
    return {
      providerPaymentId: String(data.id),
      status: mapStatus(data.status),
      ticketUrl: tx?.external_resource_url ?? "",
      barcode,
      expiresAt: expires.toISOString(),
      raw: data,
    };
  },

  async getPaymentStatus(providerPaymentId: string): Promise<PaymentSnapshot> {
    const data = await mpFetch(`/v1/payments/${encodeURIComponent(providerPaymentId)}`);
    if (!data?.id) {
      console.error("[mercadopago] status invalid response", data);
      throw new Error("Mercado Pago não retornou o ID do pagamento.");
    }
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
