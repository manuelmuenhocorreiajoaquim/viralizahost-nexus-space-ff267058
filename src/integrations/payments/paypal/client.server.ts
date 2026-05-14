// PayPal provider — placeholder for future integration.
import type { PaymentProvider } from "../types";

export const paypal: PaymentProvider = {
  id: "paypal",
  async createPixPayment() {
    throw new Error("PayPal não suporta PIX.");
  },
  async createCardPayment() {
    throw new Error("PayPal ainda não está habilitado.");
  },
  async createBoletoPayment() {
    throw new Error("PayPal ainda não está habilitado.");
  },
  async getPaymentStatus() {
    throw new Error("PayPal ainda não está habilitado.");
  },
};
