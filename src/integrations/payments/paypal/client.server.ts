// PayPal provider — placeholder for future integration.
import type { PaymentProvider } from "../types";

export const paypal: PaymentProvider = {
  id: "paypal",
  async createPixPayment() {
    throw new Error("PayPal não suporta PIX. Use Mercado Pago para PIX ou aguarde a ativação do checkout PayPal.");
  },
  async getPaymentStatus() {
    throw new Error("PayPal ainda não está habilitado.");
  },
};
