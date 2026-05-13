// ExPay provider — placeholder for future integration. Keeps the
// PaymentProvider interface honest so we can switch with a single env var
// once credentials are available.
import type { PaymentProvider } from "../types";

export const expay: PaymentProvider = {
  id: "expay",
  async createPixPayment() {
    throw new Error("ExPay ainda não está habilitado. Configure as credenciais ExPay para ativar.");
  },
  async getPaymentStatus() {
    throw new Error("ExPay ainda não está habilitado.");
  },
};
