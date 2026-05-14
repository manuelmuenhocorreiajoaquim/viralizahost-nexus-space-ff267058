// Provider-agnostic payment types. Implementations live in
// src/integrations/payments/<provider>/. The checkout/server-fn layer should
// only depend on this interface so we can later plug ExPay / PayPal in
// without touching the UI.

export type ProviderId = "mercadopago" | "expay" | "paypal";

export type PaymentMethod = "pix" | "card" | "boleto";

export type PaymentStatus =
  | "pending"
  | "in_process"
  | "approved"
  | "rejected"
  | "refunded"
  | "cancelled"
  | "expired";

export type CreatePixInput = {
  orderId: string;
  amount: number;
  currency: "BRL";
  payerEmail: string;
  description: string;
  expiresInMinutes?: number;
  items?: Array<{
    title: string;
    quantity: number;
    unit_price: number;
    currency_id: "BRL";
    description?: string;
  }>;
};

export type CreatePixOutput = {
  providerPaymentId: string;
  status: PaymentStatus;
  qrCode: string;
  qrCodeBase64: string;
  pixCopyPaste: string;
  expiresAt: string;
  raw: unknown;
};

export type PaymentSnapshot = {
  providerPaymentId: string;
  status: PaymentStatus;
  paidAt?: string | null;
  raw: unknown;
};

export interface PaymentProvider {
  id: ProviderId;
  createPixPayment(input: CreatePixInput): Promise<CreatePixOutput>;
  getPaymentStatus(providerPaymentId: string): Promise<PaymentSnapshot>;
}
