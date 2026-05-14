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

export type PayerIdentification = { type: "CPF" | "CNPJ"; number: string };

export type CreateCardInput = {
  orderId: string;
  amount: number;
  payerEmail: string;
  description: string;
  cardToken: string;
  paymentMethodId: string;
  installments: number;
  issuerId?: string;
  payerName?: string;
  identification?: PayerIdentification;
};

export type CreateCardOutput = {
  providerPaymentId: string;
  status: PaymentStatus;
  statusDetail?: string | null;
  raw: unknown;
};

export type CreateBoletoInput = {
  orderId: string;
  amount: number;
  payerEmail: string;
  description: string;
  payerFirstName: string;
  payerLastName: string;
  identification: PayerIdentification;
};

export type CreateBoletoOutput = {
  providerPaymentId: string;
  status: PaymentStatus;
  ticketUrl: string;
  barcode: string;
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
  createCardPayment(input: CreateCardInput): Promise<CreateCardOutput>;
  createBoletoPayment(input: CreateBoletoInput): Promise<CreateBoletoOutput>;
  getPaymentStatus(providerPaymentId: string): Promise<PaymentSnapshot>;
}

