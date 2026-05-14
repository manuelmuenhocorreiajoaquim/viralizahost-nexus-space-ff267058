// ExPay provider — placeholder for future integration.
import type { PaymentProvider } from "../types";

export const expay: PaymentProvider = {
  id: "expay",
  async createPixPayment() {
    throw new Error("ExPay ainda não está habilitado.");
  },
  async createCardPayment() {
    throw new Error("ExPay ainda não está habilitado.");
  },
  async createBoletoPayment() {
    throw new Error("ExPay ainda não está habilitado.");
  },
  async getPaymentStatus() {
    throw new Error("ExPay ainda não está habilitado.");
  },
};
